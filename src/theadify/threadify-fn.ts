import { delay } from "../utils";
import { AsyncQueue } from "../queue";
import { QueueTaskContext } from "../queue/queue-task-context";
import { createThreadManager, ThreadManager } from "../threads";
import { ThreadifyOptions } from "./threadify";

export const threadify = <T, K>(
  fn: (data: T, ctx: QueueTaskContext) => Promise<K>,
  threads: number | ThreadManager,
  data: T[],
  options: ThreadifyOptions<T> = {},
) => {
  return new Promise<K[]>((resolve, reject) => {
    if (data.length === 0) return resolve([]);

    const resItems: K[] = [];
    let ids: string[] = [];

    const retryMap = new Map<string, number>();

    const threadManager: ThreadManager =
      typeof threads === "number" ? createThreadManager(threads) : threads;

    const queue = new AsyncQueue(
      threadManager,
      {
        onFinish: () => {
          if (resItems.length === data.length) {
            resolve(resItems);
          }
        },
        onResolve: async (error, e) => {
          if (error != null) {
            if (options.maxRetries == null || options.maxRetries <= 0)
              return reject(error);

            let currentRetry = retryMap.get(e.id);

            if (currentRetry == null) {
              retryMap.set(e.id, 0);
              currentRetry = 0;
            }

            if (++currentRetry <= options.maxRetries) {
              retryMap.set(e.id, currentRetry);
              const args = data[ids.indexOf(e.id)];

              if (options.retryTimeout != null)
                await delay(options.retryTimeout);

              queue.enqueue(fn, args, { id: e.id });

              if (options.retryTimeout != null) queue.tick();

              return;
            }

            return reject(error);
          }

          resItems.push(e.data);
          options?.onResolve?.(e.data);
        },
      },
      { debug: options.debug, printOnFinish: options.debug },
    );

    ids = queue.enqueueArray(fn, data);
    queue.tick();

    return;
  });
};
