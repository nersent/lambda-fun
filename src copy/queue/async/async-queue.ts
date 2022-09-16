import { makeId } from "../../utils";
import { ThreadManager } from "../../threads";
import {
  Queue,
  QueueEnqueueOptions,
  QueueResponse,
  QueueResponseStatus,
} from "../queue";
import {
  QueueTaskCancelController,
  QueueTaskCancelStrategy,
} from "../queue-task-cancel-controller";
import { QueueTaskContext } from "../queue-task-context";
import { AsyncQueueSnapshotController } from "./async-queue-snapshot";

interface AsyncQueueListItem<T, K> {
  id: string;
  data: T;
  handler: (data: T, ctx: QueueTaskContext) => Promise<K>;
}

export interface AsyncQueueDelegates {
  readonly onFinish?: () => any;
  readonly onResolve?: (err: any, e: AsyncQueueResolvedEvent<any>) => void;
}

export interface AsyncQueueOptions {
  debug?: boolean;
  printEveryStep?: boolean;
  printOnFinish?: boolean;
}

export type AsyncQueueResolvedEvent<T> =
  | {
      id: string;
    } & (
      | {
          data: undefined;
          isCanceled: true;
        }
      | {
          data: T;
          isCanceled: false;
        }
    );

export class AsyncQueue implements Queue {
  private readonly queue: AsyncQueueListItem<any, any>[] = [];

  private readonly ctxMap = new Map<string, QueueTaskContext>();

  private readonly listeners = new Map<
    string,
    (error: any, data: any, isCanceled: boolean) => void
  >();

  /**
   * Used for debugging.
   */
  public readonly snapshots: AsyncQueueSnapshotController | undefined;

  constructor(
    private readonly threadManager: ThreadManager,
    private readonly delegates: AsyncQueueDelegates,
    private readonly options: AsyncQueueOptions = {},
  ) {
    if (this.options.debug) {
      this.snapshots = new AsyncQueueSnapshotController(
        () => ({
          queueLength: this.queue.length,
          threads: this.threadManager.getState(),
        }),
        this.options.printEveryStep,
      );
    }
  }

  private createId() {
    return makeId();
  }

  public enqueue<T, K>(
    handler: (data: T, ctx: QueueTaskContext) => Promise<K>,
    data: T,
    opts?: QueueEnqueueOptions,
  ) {
    const id = opts?.id ?? this.createId();
    this.queue.push({ id, handler, data });
    return id;
  }

  public enqueueArray<T, K>(
    handler: (data: T, ctx: QueueTaskContext) => Promise<K>,
    items: T[],
  ) {
    const ids: string[] = [];
    const mapped = items.map((data, index) => {
      const id = this.createId();
      ids[index] = id;
      return { id, handler, data };
    });
    this.queue.push(...mapped);
    return ids;
  }

  public subscribe<T>(id: string, tick = true) {
    const promise = new Promise<QueueResponse<T>>((resolve, reject) => {
      this.listeners.set(id, (err, data: T, isCanceled) => {
        this.listeners.delete(id);
        if (err != null) reject(err);
        resolve({
          data,
          status: isCanceled
            ? QueueResponseStatus.Canceled
            : QueueResponseStatus.Resolved,
        });
      });
    });
    if (tick) this.tick();
    return promise;
  }

  public tick = () => {
    this.threadManager.flushThreads();

    this.snapshots?.create("tick");

    if (this.queue.length === 0) {
      if (!this.threadManager.isAnyRunning()) {
        this.snapshots?.create("done");
        this.delegates.onFinish?.();
        if (this.options.printOnFinish) {
          this.snapshots?.print();
        }
        return;
      }
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const item = this.queue.shift();
      if (item == null) {
        this.snapshots?.create("empty-queue");
        break;
      }

      const thread = this.threadManager.getAvailableThread(item.data);

      if (thread == null) {
        this.queue.unshift(item);
        this.snapshots?.create("no-free-thread");
        break;
      }

      const cancelController = new QueueTaskCancelController(item.id, {
        onCancel: this.onTaskCancel,
      });

      const ctx = new QueueTaskContext(item.id, thread, cancelController, {});
      this.ctxMap.set(item.id, ctx);

      this.snapshots?.create("before-execution", {
        id: item.id,
        threadId: thread.getId(),
        data: item.data,
      });

      thread.execute({
        data: item.data,
        handler: (data) => item.handler(data, ctx),
        onFinish: (error, data) => {
          this.snapshots?.create("thread-resolved", {
            id: item.id,
            threadId: thread.getId(),
            data,
            error,
          });

          if (
            cancelController.isCanceled() &&
            cancelController.getStrategy() === QueueTaskCancelStrategy.Callback
          ) {
            this.snapshots?.create("thread-resolved-canceled", {
              id: item.id,
              threadId: thread.getId(),
              data,
              error,
            });
            return;
          }

          this.endTask(ctx, error, data);
        },
      });

      this.snapshots?.create("after-execution", {
        id: item.id,
        threadId: thread.getId(),
        data: item.data,
      });
    }
  };

  private onTaskCancel = (err: any | undefined, id: string) => {
    const ctx = this.ctxMap.get(id);
    if (ctx == null) {
      throw new Error(`Context ${id} not found`);
    }

    this.snapshots?.create("cancel-callback-resolved", { id });
    this.endTask(ctx, err, null);
  };

  private endTask<T>(ctx: QueueTaskContext, error: any, data: T) {
    const id = ctx.getId();
    const threadId = ctx.getThreadId();
    const isCanceled = ctx.cancelController.isCanceled();

    this.snapshots?.create("task-resolved", { id, threadId, data, error });
    this.listeners.get(id)?.(error, data, isCanceled);

    this.ctxMap.delete(id);
    this.threadManager.getThread(threadId)!.markAsReady();

    this.delegates?.onResolve?.(error, {
      data,
      id,
      isCanceled,
    } as AsyncQueueResolvedEvent<T>);

    this.tick();
  }

  public cancel(id: string) {
    const ctx = this.ctxMap.get(id);

    if (ctx == null) {
      const queueIndex = this.queue.findIndex((r) => r.id === id);

      if (queueIndex === -1) {
        throw new Error(`Task ${id} is not in neither in queue nor threads.`);
      }

      this.queue.splice(queueIndex, 1);
      this.snapshots?.create("delete-from-queue", { id });
      this.listeners.get(id)?.(null, null, true);
    } else {
      this.snapshots?.create("cancel-request", {
        id,
        data: ctx.cancelController.getStrategy(),
      });
      ctx.cancelController.cancel();
    }
  }
}
