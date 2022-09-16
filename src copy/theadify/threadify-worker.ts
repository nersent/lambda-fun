import { ThreadManagerImpl } from "../threads";

import { isMainThread, parentPort, Worker } from "worker_threads";
import { ThreadifyOptions } from "./threadify";
import { threadify } from "./threadify-fn";
import { QueueTaskContext } from "../queue/queue-task-context";

export type ThreadifyWorkerReqMessage<T> = {
  data: T;
};

export type ThreadifyWorkerResMessage<T> = {
  data?: T;
  error?: any;
};

export const registerWorkerHandler = <T, K>(fn: (data: T) => Promise<K>) => {
  if (isMainThread) return;
  if (parentPort == null) throw new Error("Parent port is undefined");

  parentPort.on("message", async ({ data }: ThreadifyWorkerReqMessage<T>) => {
    if (parentPort == null) throw new Error("Parent port is undefined");

    try {
      const res = await fn(data);
      parentPort.postMessage({ data: res } as ThreadifyWorkerResMessage<T>);
    } catch (error) {
      parentPort.postMessage({
        error: error instanceof Error ? error.stack : error,
      } as ThreadifyWorkerResMessage<T>);
    }
  });
};

export const threadifyWorker = <T, K>(
  path: string,
  threads: number,
  data: T[],
  options: ThreadifyOptions<T> = {},
) => {
  return new Promise<K[]>((resolve, reject) => {
    if (data.length === 0) return resolve([]);

    const workerMap = new Map<string, Worker>();
    const threadManager = new ThreadManagerImpl(threads, {
      onCreate: (threadId) => {
        workerMap.set(threadId, new Worker(path));
      },
      onDelete: (threadId) => {
        workerMap.delete(threadId);
      },
    });

    const handler = (data: T, ctx: QueueTaskContext) => {
      return new Promise<K>((resolve, reject) => {
        const threadId = ctx.getThreadId();
        const worker = workerMap.get(threadId);

        if (worker == null) {
          return reject(new Error(`Worker not found - thread id ${threadId}`));
        }

        worker.once("message", (data: ThreadifyWorkerResMessage<K>) => {
          if (data.error != null) {
            return reject(new Error(data.error));
          }
          resolve(data.data!);
        });

        worker.postMessage({ data } as ThreadifyWorkerReqMessage<T>);
      });
    };

    threadify(handler, threadManager, data, options)
      .then(resolve)
      .catch(reject);
  });
};
