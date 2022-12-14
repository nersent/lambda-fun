import {
  createThreadManager,
  TaskTimeThrottler,
  ThreadPoolImpl,
  ThreadSchedulerImpl,
} from "../src";
import { delay } from "./utils";

export const useQueueThrottleExample = async () => {
  const threadManager = createThreadManager();
  const threadPool = new ThreadPoolImpl(threadManager);
  await threadPool.resize(4);
  const threadScheduler = new ThreadSchedulerImpl(threadPool);
  const taskQueue = threadScheduler.getTaskQueue();
  const throttlerLimit = 2;
  const throttler = new TaskTimeThrottler(taskQueue, {
    time: 2000,
    count: throttlerLimit,
  });
  throttler.init();

  interface ExampleEntry {
    text: string;
    time: number;
  }

  const exampleEntries: ExampleEntry[] = [
    { text: "a", time: 100 },
    { text: "b", time: 1 },
    { text: "c", time: 1 },
    { text: "d", time: 1000 },
    { text: "e", time: 150 },
    { text: "f", time: 70 },
    { text: "g", time: 30 },
    { text: "h", time: 1 },
    { text: "i", time: 2 },
    { text: "j", time: 5 },
    { text: "k", time: 1 },
    { text: "l", time: 1000 },
    { text: "m", time: 50 },
    { text: "n", time: 70 },
    { text: "o", time: 300 },
  ];

  let lastCallTime: number | undefined = undefined;
  let currentCall = 0;

  const fn = (data: ExampleEntry) => async () => {
    if (currentCall++ % throttlerLimit === 0) {
      console.log("------------------");
    }

    const lastCallTimeTxt =
      lastCallTime != null ? Date.now() - lastCallTime : -1;

    lastCallTime = Date.now();
    console.log(`[${data.text}]: called (${lastCallTimeTxt}ms)`);
    await delay(data.time);
    return `${data.text}_${data.time}`;
  };

  const items = await Promise.all(
    exampleEntries
      .map((entry) => threadScheduler.schedule(fn(entry)).setMetadata(entry))
      .map((task) => task.waitToResolve()),
  );
};
