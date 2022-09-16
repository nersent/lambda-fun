import { ThreadManager } from "../threads/thread-manager";
import {
  AsyncQueue,
  AsyncQueueExecutionContext,
  AsyncQueueOptions,
} from "../queue/async-queue";

export type ThreadifyOptions = {
  threads: number;
  maxTries?: number;
  retryTimeout?: number;
  timeLimit?: ThreadifyOptionsTimeLimit;
  queueOptions?: Partial<AsyncQueueOptions & { verbosePath?: string }>;
  printItemsOnError?: boolean;
} & (
  | {
      rejectOnError?: boolean;
    }
  | {
      exitProcessOnError?: boolean;
    }
);

export interface ThreadifyOptionsTimeLimit {
  time: number;
  count: number;
}

interface ThreadifyExecutionContext extends AsyncQueueExecutionContext {
  data: { fn: (...args: any[]) => Promise<any> };
}

export type ThreadifyEntry =
  | ((...args: any[]) => any)
  | ({
      fn: (...args: any[]) => any;
    } & Record<string, any>);

export const threadify = (
  options: ThreadifyOptions,
  ...entries: ThreadifyEntry[]
) => {
  if (entries.length === 0) return [] as any[];

  return new Promise<any[]>(async (resolve, reject) => {
    const threadManager = new ThreadManager();
    await threadManager.setThreadsCount(options.threads);

    const items: any[] = [];
    const tryCounter = new Map<string, number>();
    let timeouts: NodeJS.Timeout[] = [];

    const queue = new AsyncQueue(
      {
        threadManager,
        execute: ({ data: { fn } }: ThreadifyExecutionContext) => {
          return fn();
        },
      },
      options?.queueOptions,
    );

    const handleError = (error: any) => {
      options?.printItemsOnError && console.log(items);

      if ("rejectOnError" in options && options.rejectOnError) {
        queue.clear();
        reject(error);
      } else if (
        "exitProcessOnError" in options &&
        options.exitProcessOnError
      ) {
        console.error(error);
        process.exit(1);
      }
    };

    queue.on("resolve", (e) => {
      const ctx = queue.getContext(e.id)!;

      const currentTry = (tryCounter.get(ctx.id) ?? 0) + 1;
      tryCounter.set(ctx.id, currentTry);

      if (options.maxTries != null && "error" in e) {
        if (currentTry >= options.maxTries) {
          return handleError(
            new Error(`Max tries (${options.maxTries}) exceeded.`),
          );
        } else {
          if (options.retryTimeout != null && options.retryTimeout !== 0) {
            const timeout = setTimeout(() => {
              queue.enqueue(ctx.data, { id: ctx.id, first: true });
              queue.tick();
              timeouts = timeouts.filter((t) => t !== timeout);
            }, options.retryTimeout ?? 0);
            timeouts.push(timeout);
          } else {
            queue.enqueue(ctx.data, { id: ctx.id, first: true });
          }
          return;
        }
      }

      if ("error" in e && !e.isCanceled) {
        handleError(e.error);
      }

      if ("data" in e) {
        items.push(e.data);
      }
    });

    queue.on("finish", () => {
      if (timeouts.length === 0) {
        resolve(items);
      }
    });

    entries.forEach((entry) => {
      if (typeof entry === "function") {
        queue.enqueue({ fn: entry });
      } else {
        queue.enqueue(entry);
      }
    });

    queue.tick();
  });
};
