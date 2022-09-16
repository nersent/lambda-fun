// import { downloadExample } from "./download";
// import { networkExample } from "./network";
// import { threadifyFnExample } from "./threadify-fn";
// import { threadifyWorkerExample } from "./threadify-worker";
// import { timeoutExample } from "./timeout";

import { ThreadManager } from "src/threads/thread-manager";
import { AsyncQueue } from "../src/queue/async-queue";

// const main = async () => {
//   // await networkExample();
//   // await timeoutExample();
//   // await threadifyFnExample();
//   await threadifyWorkerExample();
//   // await downloadExample();
// };

// main();

const main = async () => {
  const threadManager = new ThreadManager();
  const queue = new AsyncQueue(
    {
      threadManager,
      execute: async (ctx) => {
        console.log(ctx.data);
        return ctx.id;
      },
    },
    { verbose: false },
  );

  const id = queue.enqueue("hello world");

  console.log(id);
};

main();
