import { delay } from "./utils";
import { threadify } from "../src/threading/threadify";
import { createThreadScheduler } from "../src/threading/threads/thread-scheduler-factory";

export const useThreadifyExample = async () => {
  const fn = async (message: string, time: number): Promise<void> => {
    await delay(time);
    console.log(message);
  };

  const factory = threadify(fn, await createThreadScheduler(1));

  await Promise.all([
    factory("a", 1000),
    factory("b", 1000),
    factory("c", 1000),
    factory("d", 1000),
  ]);
};
