import { delay } from "./utils";
import {
  createThreadManager,
  ThreadPoolImpl,
  ThreadSchedulerImpl,
} from "../src";

export const useTimeoutExample = async () => {
  const threadManager = createThreadManager();
  const threadPool = new ThreadPoolImpl(threadManager);
  await threadPool.resize(4);
  const threadScheduler = new ThreadSchedulerImpl(threadPool);

  interface ExampleEntry {
    text: string;
    time: number;
  }

  const exampleEntries: ExampleEntry[] = [
    { text: "a", time: 1000 },
    { text: "b", time: 1000 },
    { text: "c", time: 1000 },
    { text: "d", time: 1000 },
    { text: "e", time: 1000 },
    { text: "f", time: 1000 },
    { text: "g", time: 1000 },
    { text: "h", time: 1000 },
    { text: "i", time: 1000 },
    { text: "j", time: 1000 },
    { text: "k", time: 1000 },
    { text: "l", time: 1000 },
    { text: "m", time: 1000 },
    { text: "n", time: 1000 },
    { text: "o", time: 1000 },
  ];

  let lastCallTime: number | undefined = undefined;
  let currentCall = 0;

  const fn = (data: ExampleEntry) => async () => {
    if (currentCall++ % threadPool.getSize() === 0) {
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
      .map((entry) => threadScheduler.schedule(fn(entry)))
      .map((task) => task.waitToResolve().then((res) => (res as any)["data"])),
  );

  console.log(items);
};
