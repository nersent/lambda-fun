import { ObserverManager } from "../utils/observer-manager";
import {
  IThread,
  IThreadManager,
  ThreadExecutionResponse,
} from "../threads/thread-types";
import { makeId } from "../utils";
import { QueueEventRecorder } from "./queue-event-recorder";
import {
  Queue,
  QueueCancelReason,
  QueueEnqueueOptions,
  QueueExecutionContext,
  QueueObserverMap,
  QueueResolveEvent,
} from "./queue-types";
import { Observable } from "../utils/observable";

export interface AsyncQueueEntry {
  id: string;
  data: any;
}

export interface AsyncQueueExecutionContext extends QueueExecutionContext {
  data: any;
}

export type AsyncQueueEventRecorderType =
  | "enqueue"
  | "tick"
  | "flush-threads"
  | "done"
  | "empty-queue"
  | "no-executable-thread"
  | "before-execution"
  | "after-execution"
  | "emit-resolve"
  | "clear-context-map";

export interface AsyncQueueDelegates {
  readonly threadManager: IThreadManager;
  readonly execute: (ctx: AsyncQueueExecutionContext) => Promise<any> | any;
}

export interface AsyncQueueOptions {
  verbose?: boolean;
  printSteps?: boolean;
}

export class AsyncQueue extends Observable<QueueObserverMap> implements Queue {
  private readonly queue: AsyncQueueEntry[] = [];

  private readonly contextMap = new Map<string, AsyncQueueExecutionContext>();

  private readonly eventRecorder:
    | QueueEventRecorder<AsyncQueueEventRecorderType>
    | undefined = undefined;

  constructor(
    private readonly delegates: AsyncQueueDelegates,
    private readonly options?: AsyncQueueOptions,
  ) {
    super();
    if (options?.verbose) {
      this.eventRecorder = new QueueEventRecorder(options.printSteps);
    }
  }

  public getContext(id: string): AsyncQueueExecutionContext | undefined {
    return this.contextMap.get(id);
  }

  public enqueue(data: any, opts?: QueueEnqueueOptions | undefined): string {
    const id = makeId();
    const entry: AsyncQueueEntry = { id, data };
    this.eventRecorder?.register("enqueue", entry);
    this.queue.push(entry);
    return id;
  }

  public pause(ids: string | string[], reason?: any): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public resume(ids: string | string[], reason?: any): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public cancel(ids: string | string[], reason?: any): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public getLogs() {
    return this.eventRecorder?.events;
  }

  public wait(id: string) {
    return new Promise<any>((resolve, reject) => {
      const clearListeners = () => {
        this.removeListener("finish", onFinish);
      };

      const onFinish = () => {
        clearListeners();
        resolve(undefined);
      };

      const onResolve = (event: QueueResolveEvent<any>) => {
        if (event.contextId === id) {
          clearListeners();
          if ("error" in event) {
            reject(event.error);
          }
          if (event.isCanceled) {
            reject((event as any).cancelReason);
          } else if ("data" in event) {
            resolve(event.data);
          }
        }
      };

      this.on("finish", onFinish);
      this.on("resolve", onResolve);
    });
  }

  public tick(): void {
    this.eventRecorder?.register("tick", { queue: this.queue });

    this.eventRecorder?.register("flush-threads", {
      threads: this.delegates.threadManager.getThreads(),
    });
    this.delegates.threadManager.flush();

    if (this.queue.length === 0) {
      const executingThreads = this.delegates.threadManager
        .getThreads()
        .filter((r) => r.isExecuting());
      if (executingThreads.length === 0) {
        this.eventRecorder?.register("done");
        this.emit("finish");
        this.eventRecorder?.print();
        return;
      }
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const entry = this.queue.shift();
      if (entry == null) {
        this.eventRecorder?.register("empty-queue");
        break;
      }

      const thread = this.delegates.threadManager.findExecutableThread({});

      if (thread == null) {
        this.queue.unshift(entry);
        this.eventRecorder?.register("no-executable-thread");
        break;
      }

      const ctx: AsyncQueueExecutionContext = {
        id: entry.id,
        threadId: thread.getId(),
        data: entry.data,
      };

      this.eventRecorder?.register("before-execution", { ctx });
      this.contextMap.set(entry.id, ctx);
      this.executeOnThread(thread, ctx);
    }
  }

  protected executeOnThread(thread: IThread, ctx: AsyncQueueExecutionContext) {
    thread
      .execute({
        fn: () => {
          return this.delegates.execute(ctx);
        },
      })
      .then(async (res) => {
        this.eventRecorder?.register("after-execution", { ctx, res });

        let resolveEvent: Partial<QueueResolveEvent<any>> = {
          contextId: ctx.id,
          queue: this,
        };

        if ("error" in res) {
          if (res.error instanceof QueueCancelReason) {
            resolveEvent = {
              ...resolveEvent,
              isCanceled: true,
              cancelReason: res.error,
            };
          } else {
            resolveEvent = { ...resolveEvent, error: res.error };
          }
        } else {
          resolveEvent = { ...resolveEvent, data: res.data };
        }

        this.eventRecorder?.register("emit-resolve", {
          ...resolveEvent,
          queue: undefined,
        });
        await this.emitAsync("resolve", resolveEvent as QueueResolveEvent<any>);

        this.eventRecorder?.register("clear-context-map", { ctx });
        this.contextMap.delete(ctx.id);
        this.tick();
      });
  }
}
