import { QueueExecutionContext, QueueResolveEvent } from "../queue/queue-types";
import { FunctionWrapper, wrapFunction } from "../utils/function";
import { Queue, QueueEntry } from "../queue/queue";
import { ThreadPool } from "./thread-pool";
import { Observable } from "../observable/observable";
import { IRepeater } from "../repeater/repeater-types";
import { IThrottler } from "../throttler/throttler-types";

export type ThreadifierOptions = {
  threads: number;
  onError?: ThreadifierOnErrorOptions;
};

export type ThreadifierOnErrorOptions = { printCurrentResponses?: boolean } & (
  | {
      reject?: boolean;
    }
  | {
      exitProcess?: boolean;
    }
  | { returnUndefined?: boolean }
);

export interface ThreadifierDelegates {
  repeater?: IRepeater;
  throttler?: IThrottler;
  // getWrappers?: (
  //   ctx: ThreadifierQueueExecutionContext,
  // ) => (FunctionWrapper | undefined)[];
}

export type ThreadifierEntry = (...args: any[]) => any;

export interface ThreadifierQueueEntry extends QueueEntry {
  data: ThreadifierEntry;
}

export interface ThreadifierQueueExecutionContext
  extends QueueExecutionContext {
  data: { fn: (...args: any[]) => Promise<any> };
}

export type ThreadifierEventMap = {
  resolve: (e: ThreadifierResolveEvent) => void;
};

export interface ThreadifierResolveEvent {
  data: any;
  current: number;
  total: number;
}

export class Threadifier extends Observable<ThreadifierEventMap> {
  protected isExecuting = false;

  protected readonly queue: Queue;

  protected readonly threadPool: ThreadPool;

  protected responses: any[] = [];

  protected current = 0;

  protected total = 0;

  constructor(
    public readonly options: ThreadifierOptions,
    protected readonly delegates: ThreadifierDelegates,
  ) {
    super();
    this.threadPool = this.createThreadPool();
    this.queue = this.createQueue(this.threadPool);
  }

  protected createThreadPool() {
    return new ThreadPool();
  }

  protected createQueue(threadPool: ThreadPool) {
    return new Queue({
      threadPool,
      execute: this.handleQueueExecution,
    });
  }

  protected handleQueueExecution = (ctx: ThreadifierQueueExecutionContext) => {
    const {
      data: { fn },
      threadId,
    } = ctx;
    return wrapFunction(
      fn,
      this.delegates.throttler?.execute?.bind(this.delegates.throttler),
      this.delegates.repeater?.execute?.bind(this.delegates.repeater),
    )({
      threadIndex: this.threadPool
        .getThreads()
        .findIndex((r) => r.getId() === threadId),
    });
    // return wrapFunction(fn, ...(this.delegates.getWrappers?.(ctx) ?? []))();
  };

  public async execute(...entries: ThreadifierEntry[]) {
    if (this.isExecuting) {
      throw new ThreadifierAlreadyRunning("Threadifier is already running");
    }

    if (entries.length === 0) return [];

    this.responses = [];
    this.current = 0;
    this.total = entries.length;

    if (this.threadPool.getPoolSize() !== this.options.threads) {
      await this.threadPool.setPoolSize(this.options.threads);
    }

    this.isExecuting = true;

    entries.forEach((fn) => {
      this.queue.enqueue({ fn });
    });

    const promise = new Promise<any[]>(async (resolve, reject) => {
      const clearListeners = () => {
        this.queue.off("resolve", onResolve);
        this.queue.off("finish", onFinish);
      };

      const handleError = (error: any) => {
        this.options.onError?.printCurrentResponses &&
          console.log(this.responses);

        if (
          this.options.onError == null ||
          ("reject" in this.options.onError && this.options.onError.reject)
        ) {
          this.queue.clear();
          clearListeners();
          reject(error);
          return false;
        }

        if (
          "returnUndefined" in this.options.onError &&
          this.options.onError.returnUndefined
        ) {
          return true;
        }

        if (
          "exitProcess" in this.options.onError &&
          this.options.onError.exitProcess
        ) {
          console.error(error);
          process.exit(1);
        }

        return false;
      };

      const onResolve = (e: QueueResolveEvent<any>) => {
        this.current++;
        if ("error" in e && !e.isCanceled) {
          const proceed = handleError(e.error);
          if (!proceed) return;
        }

        this.responses.push((e as any).data);
        this.emit("resolve", {
          data: (e as any).data,
          current: this.current,
          total: this.total,
        });
      };

      const onFinish = () => {
        this.isExecuting = false;
        clearListeners();
        resolve(this.responses);
        this.responses = [];
      };

      this.queue.on("resolve", onResolve);
      this.queue.on("finish", onFinish);
    });

    this.queue.tick();

    return promise;
  }
}

export class ThreadifierAlreadyRunning extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ThreadifierAlreadyRunning.prototype);
  }
}
