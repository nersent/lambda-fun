import { ThreadManager } from "../threads/thread-manager";
import {
  AsyncQueue,
  AsyncQueueExecutionContext,
  AsyncQueueOptions,
} from "../queue/async-queue";

export interface ThreadifyOptions {
  threads: number;
  maxRetries?: number;
  retryTimeout?: number;
  queueOptions?: Partial<AsyncQueueOptions>;
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

    const queue = new AsyncQueue(
      {
        threadManager,
        execute: ({ data: { fn } }: ThreadifyExecutionContext) => {
          return fn();
        },
      },
      options?.queueOptions,
    );

    queue.on("resolve", (e) => {
      if ("data" in e) {
        items.push(e.data);
      }
    });

    queue.once("finish", () => {
      resolve(items);
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
