import { ThreadManager } from "../threads/thread-manager";
import { Queue, QueueExecutionContext, QueueOptions } from "../queue/queue";
import { Throttler } from "../throttler/throttler";
import { Trier } from "../trier/trier";
import { Repeater } from "../repeater/repeater";

export type ThreadifyOptions = {
  threads: number;
  repeaterOptions?: any; // RepeaterExecuteOptions
  throttler?: Throttler;
  queueOptions?: Partial<QueueOptions & { verbosePath?: string }>;
  printItemsOnError?: boolean;
} & (
  | {
      rejectOnError?: boolean;
    }
  | {
      exitProcessOnError?: boolean;
    }
);

interface ThreadifyExecutionContext extends QueueExecutionContext {
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

    const repeater =
      options.repeaterOptions != null ? new Repeater() : undefined;

    const queue = new Queue(
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

    // const wrapFn = (fn: (...args: any[]) => any)  => {
    //   let wrappedFn = fn;
    //   if (options.throttler) {
    //     wrappedFn = () => options.throttler!.execute(() => fn());
    //   }
    //   if (repeater != null) {
    //     wrappedFn = () =>
    //       repeater.execute(() => copy(), options.repeaterOptions);
    //   }
    //   const copy = wrappedFn;
    //   return wrappedFn;
    // };
    const wrapFn =
      (fn: (...args: any[]) => any) =>
      (...args: any[]) => {
        // if (options.throttler != null && repeater != null) {
        //   return repeater.execute(
        //     () => options.throttler!.execute(() => fn(...args)),
        //     options.repeaterOptions,
        //   );
        // }
        if (options.throttler == null && repeater == null) {
          return fn(...args);
        }
        console.log(options, repeater);
        throw new Error("Unsupported edge case");
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
