import { ThreadManager } from "../src/threads/thread-manager";
import { AsyncQueue } from "../src/queue/async-queue";
import { threadify, ThreadifyEntry } from "../src/threadify";
import { delay } from "../src/utils";
import axios, { CancelTokenSource } from "axios";

const main = async () => {
  const threadManager = new ThreadManager();

  await threadManager.setThreadsCount(1);

  interface Data {
    url: string;
    cancelToken: CancelTokenSource;
  }

  const queue = new AsyncQueue(
    {
      threadManager,
      execute: async ({ data }) => {
        // console.log(data);
        // return delay(data);
      },
    },
    { verbose: false },
  );

  queue.on("cancel", (id) => {
    console.log("cancel", id);
  });

  queue.once("finish", () => {
    console.log("finish");
  });

  const urls = [
    "http://ipv4.download.thinkbroadband.com/5MB.zip",
    "http://ipv4.download.thinkbroadband.com/5MB.zip",
  ];

  const ids = urls.map((url) =>
    queue.enqueue({ url, cancelToken: axios.CancelToken.source() } as Data),
  );

  setTimeout(() => {
    queue.cancel(ids[0]);
  }, 100);

  queue.tick();
};

process.on("exit", function () {
  console.log("exit");
});

main();
