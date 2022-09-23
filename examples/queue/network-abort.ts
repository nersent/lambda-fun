import { ThreadManager } from "../../src/threads/thread-manager";
import { Queue } from "../../src/queue/queue";
import axios, { CancelTokenSource } from "axios";

export const useQueueNetworkAbortExample = async () => {
  const threadManager = new ThreadManager();

  await threadManager.setThreadsCount(1);

  interface Data {
    url: string;
    cancelTokenSource: CancelTokenSource;
  }

  const queue = new Queue(
    {
      threadManager,
      execute: async ({ data }: { data: Data }) => {
        try {
          const { status } = await axios.get(data.url, {
            cancelToken: data.cancelTokenSource.token,
          });

          return { url: data.url, status };
        } catch (error) {
          if (axios.isCancel(error)) {
            return undefined;
          }
          throw error;
        }
      },
    },
    { verbose: false },
  );

  queue.on("cancel", (id) => {
    console.log("Canceling", id);
    const data = queue.getContext(id)!.data as Data;
    data.cancelTokenSource.cancel();
  });

  queue.on("resolve", (e) => {
    if (e.isCanceled) return console.warn(`[${e.id}]: canceled`);
    if ("error" in e) return console.error(`[${e.id}]: rejected with`, e.error);
    if ("data" in e) return console.log(`[${e.id}]: resolved with`, e.data);
  });

  queue.once("finish", () => {
    console.log("finish");
  });

  const urls = [
    "http://ipv4.download.thinkbroadband.com/5MB.zip",
    "http://ipv4.download.thinkbroadband.com/5MB.zip",
  ];

  const ids = urls.map((url) =>
    queue.enqueue({
      url,
      cancelTokenSource: axios.CancelToken.source(),
    } as Data),
  );

  setTimeout(() => {
    const id = ids[0];
    if (queue.exists(id)) {
      queue.cancel(id);
    } else {
      console.log(`Cannot cancel ${id}. Not found`);
    }
  }, 100);

  queue.tick();
};
