import { resolve } from "path";
import { threadifyWorker } from "../src";

export const threadifyWorkerExample = async (threads = 2) => {
  const path = resolve("build/examples", "threadify-worker-process.js");

  const items = Array.from({ length: 10 }).map((r, index) => index);

  const res = await threadifyWorker(path, threads, items, {
    maxRetries: 1,
    retryTimeout: 200,
  });

  console.log(res);
};
