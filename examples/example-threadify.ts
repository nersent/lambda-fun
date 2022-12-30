import { threadify, createThreadScheduler, createThreadPool } from "../src";
import { delay } from "./utils";

export const useThreadifyExample = async () => {
  const fn = async (message: string, time: number): Promise<void> => {
    await delay(time);
    console.log(message);
  };

  const threadPool = await createThreadPool(2);
  const threadScheduler = createThreadScheduler(threadPool);
  const factory = threadify(fn, threadScheduler);

  await Promise.all([
    factory("a", 1000),
    factory("b", 1000),
    factory("c", 1000),
    factory("d", 1000),
  ]);
};
