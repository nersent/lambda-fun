import { IThreadManager } from "../threads/thread-manager-types";
import { Observable } from "../observable/observable";
import { IThread } from "../threads/thread-types";
import { makeId } from "../utils";
import {
  IQueue,
  QueueCancelReason,
  QueueEnqueueOptions,
  QueueEventMap,
  QueueExecutionContext,
  QueuePauseReason,
  QueueResolveEvent,
} from "./queue-types";
import { Logger } from "../logger/logger";

export interface AsyncQueueEntry {
  id: string;
  data: any;
  isPaused?: boolean;
}

export interface AsyncQueueExecutionContext extends QueueExecutionContext {
  data: any;
  cancelReason?: QueueCancelReason;
}

export type AsyncQueueLogType =
  | "enqueue"
  | "tick"
  | "flush-threads"
  | "done"
  | "empty-queue"
  | "no-executable-thread"
  | "before-execution"
  | "execution-call"
  | "execution-callback"
  | "execution"
  | "after-execution"
  | "emit-resolve"
  | "clear-context-map"
  | "cancel-remove-from-queue"
  | "clear"
  | "tick-call"
  | "omit-paused"
  | "resume"
  | "empty-queue-all-paused"
  | "tick-loop-start"
  | "tick-loop-end";

export interface AsyncQueueDelegates {
  readonly threadManager: IThreadManager;
  readonly execute: (ctx: AsyncQueueExecutionContext) => Promise<any> | any;
}

export interface AsyncQueueOptions {
  verbose?: boolean;
  printSteps?: boolean;
  verbosePath?: string;
}

export class AsyncQueue extends Observable<QueueEventMap> implements IQueue {
  private queue: AsyncQueueEntry[] = [];

  private readonly contextMap = new Map<string, AsyncQueueExecutionContext>();

  private readonly logger: Logger<AsyncQueueLogType> | undefined = undefined;

  constructor(
    private readonly delegates: AsyncQueueDelegates,
    private readonly options?: AsyncQueueOptions,
  ) {
    super();
    if (options?.verbose) {
      this.logger = new Logger({ print: options.printSteps });
    }
  }

  public clear() {
    this.logger?.log("clear");
    this.queue = [];
  }

  public getContext(id: string): AsyncQueueExecutionContext | undefined {
    return this.contextMap.get(id);
  }

  public enqueue(data: any, options?: QueueEnqueueOptions | undefined): string {
    const id = options?.id ?? makeId();
    const entry: AsyncQueueEntry = { id, data, isPaused: options?.isPaused };
    this.logger?.log("enqueue", { entry, options });
    if (options?.first) {
      this.queue.unshift(entry);
    } else {
      this.queue.push(entry);
    }
    this.emit("enqueue", entry);
    return id;
  }

  public async pause(
    ids: string | string[],
    reason: QueuePauseReason = new QueueCancelReason(
      `Operation ${ids} was paused`,
    ),
  ) {
    if (!Array.isArray(ids)) ids = [ids];
    await Promise.all(ids.map((id) => this._pause(id, reason)));
  }

  public async resume(ids: string | string[], first?: boolean) {
    if (!Array.isArray(ids)) ids = [ids];
    await Promise.all(ids.map((id) => this._resume(id, first)));
  }

  public async cancel(
    ids: string | string[],
    reason: QueueCancelReason = new QueueCancelReason(
      `Operation ${ids} was canceled`,
    ),
  ) {
    if (!Array.isArray(ids)) ids = [ids];
    await Promise.all(ids.map((id) => this._cancel(id, reason)));
  }

  private async _resume(id: string, first?: boolean) {
    const entryIndex = this.queue.findIndex((r) => r.id === id);
    if (entryIndex === -1) throw new Error(`Entry ${id} not found`);

    const entry = this.queue.splice(entryIndex, 1)[0];

    if (first) {
      this.queue.unshift(entry);
    } else {
      this.queue.push(entry);
    }

    entry.isPaused = false;
    this.logger?.log("resume", { entry, first });
    this.tick();
  }

  private async _pause(id: string, reason: QueuePauseReason) {
    const ctx = this.getContext(id);
    if (ctx == null) throw new Error(`Context ${id} not found`);

    await this._cancel(id, reason);
    this.enqueue(ctx.data, { id: ctx.id, isPaused: true });
  }

  private async _cancel(id: string, reason: QueueCancelReason) {
    const ctx = this.getContext(id);

    if (ctx == null) {
      const queueIndex = this.queue.findIndex((r) => r.id);
      if (queueIndex >= 0) {
        this.logger?.log("cancel-remove-from-queue", {
          index: queueIndex,
          queue: this.queue,
        });
        this.queue.splice(queueIndex, 1);
      } else {
        throw new Error(
          `Context for ${id} is not found and entry is not in queue`,
        );
      }
    } else {
      ctx.cancelReason = reason;
      await this.emitAsync("cancel", id, reason);
    }
  }

  public exists(id: string) {
    return this.contextMap.has(id) || this.queue.some((r) => r.id === id);
  }

  public getLogger() {
    return this.logger;
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
        if (event.id === id) {
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
    this.logger?.log("tick", { queue: this.queue });
    this.logger?.log("flush-threads", {
      threads: this.delegates.threadManager.getThreads(),
    });
    this.delegates.threadManager.flush();

    if (this.queue.length === 0) {
      this.logger?.log("empty-queue");

      const executingThreads = this.delegates.threadManager
        .getThreads()
        .filter((r) => r.isExecuting());
      if (executingThreads.length === 0) {
        this.logger?.log("done");
        this.emit("finish");
        this.logger?.print();
        return;
      }
      return;
    }
    // const queueEntries = this.queue.filter((r) => !r.isPaused);

    // if (queueEntries.length === 0) {
    //   this.eventRecorder?.register("empty-queue-all-paused", {queue: this.queue});
    //   return;
    // }
    const queueCopy = [...this.queue];

    this.logger?.log("tick-loop-start", { queueCopy });

    for (const queueEntry of queueCopy) {
      if (queueEntry.isPaused) {
        this.logger?.log("omit-paused", { queueEntry });
        continue;
      }

      const queueEntryIndex = this.queue.indexOf(queueEntry);

      if (queueEntryIndex === -1) {
        throw new Error("Queue entry index is invalid");
      }

      const thread = this.delegates.threadManager.findExecutableThread({});

      if (thread == null) {
        this.logger?.log("no-executable-thread", {
          entry: queueEntry,
        });
        break;
      }

      this.queue.splice(queueEntryIndex, 1);

      const ctx: AsyncQueueExecutionContext = {
        id: queueEntry.id,
        threadId: thread.getId(),
        data: queueEntry.data,
      };

      this.logger?.log("before-execution", { ctx });
      this.contextMap.set(queueEntry.id, ctx);
      this.executeOnThread(thread, ctx);
    }

    this.logger?.log("tick-loop-end");

    // eslint-disable-next-line no-constant-condition
    // while (true) {
    //   // const entry = this.queue.shift();

    //   if (entry.isPaused) {
    //     this.queue.push(entry);

    //     if (this.queue.length === 1) {
    //       this.eventRecorder?.register("tick-loop-break-pause", {
    //         entry,
    //         queue: this.queue,
    //       });
    //       break;
    //     }

    //     this.eventRecorder?.register("omit-paused", {
    //       entry,
    //       queue: this.queue,
    //     });
    //     continue;
    //   }

    //   const thread = this.delegates.threadManager.findExecutableThread({});

    //   if (thread == null) {
    //     this.queue.unshift(entry);
    //     this.eventRecorder?.register("no-executable-thread", { entry });
    //     break;
    //   }

    //   const ctx: AsyncQueueExecutionContext = {
    //     id: entry.id,
    //     threadId: thread.getId(),
    //     data: entry.data,
    //   };

    //   this.eventRecorder?.register("before-execution", { ctx });
    //   this.contextMap.set(entry.id, ctx);
    //   this.executeOnThread(thread, ctx);
    // }
  }

  protected executeOnThread(thread: IThread, ctx: AsyncQueueExecutionContext) {
    this.logger?.log("execution-call", { ctx });
    thread
      .execute({
        fn: async () => {
          this.logger?.log("execution", { ctx });
          const res = await this.delegates.execute(ctx);
          this.logger?.log("execution-callback", { ctx, res });
          return res;
        },
      })
      .then(async (res) => {
        this.logger?.log("after-execution", { ctx, res });

        let resolveEvent: Partial<QueueResolveEvent<any>> = {
          id: ctx.id,
          queue: this,
        };

        if (ctx.cancelReason) {
          resolveEvent = {
            ...resolveEvent,
            isCanceled: true,
            cancelReason: ctx.cancelReason,
          };
        }

        if ("error" in res) {
          resolveEvent = { ...resolveEvent, error: res.error };
        } else if (ctx.cancelReason == null) {
          resolveEvent = { ...resolveEvent, data: res.data };
        }

        this.logger?.log("emit-resolve", {
          ...resolveEvent,
          queue: undefined,
        });
        await this.emitAsync("resolve", resolveEvent as QueueResolveEvent<any>);

        this.logger?.log("clear-context-map", { ctx });
        this.contextMap.delete(ctx.id);
        this.logger?.log("tick-call", { ctx });
        this.tick();
      });
  }
}
