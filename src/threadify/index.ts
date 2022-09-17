import { ThreadManager } from "../threads/thread-manager";
import {
  AsyncQueue,
  AsyncQueueExecutionContext,
  AsyncQueueOptions,
} from "../queue/async-queue";
import { Throttler } from "../throttler/throttler";
import { Trier } from "../trier/trier";

export type ThreadifyOptions = {
  threads: number;
  trier?: Trier;
  throttler?: Throttler;
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

    const handleError = (error: any) => {
      options?.printItemsOnError && console.log(items);

      if ("rejectOnError" in options && options.rejectOnError) {
        queue.clear();
        return reject(error);
      }

      if ("exitProcessOnError" in options && options.exitProcessOnError) {
        console.error(error);
        process.exit(1);
      }
    };

    queue.on("resolve", (e) => {
      if ("error" in e && !e.isCanceled) return handleError(e.error);
      if ("data" in e) items.push(e.data);
    });

    queue.on("finish", () => {
      resolve(items);
    });

    const wrapFn = (fn: (...args: any[]) => any) => {
      let wrappedFn = fn;
      if (options.trier) {
        wrappedFn = () => options.trier!.execute(() => fn());
      }
      if (options.throttler) {
        wrappedFn = () => options.throttler!.execute(() => fn());
      }
      return wrappedFn;
    };

    const normalizeEntry = (entry: ThreadifyEntry): ThreadifyEntry => {
      let fn: (...args: any[]) => any;
      let data: any = undefined;

      if (typeof entry === "function") {
        fn = entry;
      } else {
        const { fn: _fn, ..._data } = entry;
        fn = _fn;
        data = _data;
      }

      return { fn: wrapFn(fn), ...data };
    };

    entries.forEach((entry) => {
      queue.enqueue(normalizeEntry(entry));
    });

    queue.tick();
  });
};
