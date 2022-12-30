import { createTask } from "../src/threading/tasks/task-factory";
import {
  IThread,
  ThreadExecutionContext,
} from "src/threading/threads/thread-types";
import { TaskDelegate } from "../src/threading/tasks/task-types";
import { ResizableThreadPool } from "../src/threading/threads/resizable-thread-pool";
import { Thread } from "../src/threading/threads/thread";
import { createThread } from "../src/threading/threads/thread-factory";
import { ThreadScheduler } from "../src/threading/threads/thread-scheduler";
import { delay } from "./utils";

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

const fn =
  (data: ExampleEntry, dataIndex: number, poolSize: number) => async () => {
    if (currentCall++ % poolSize === 0) {
      console.log("------------------");
    }

    const lastCallTimeTxt =
      lastCallTime != null ? Date.now() - lastCallTime : -1;

    lastCallTime = Date.now();
    console.log(
      `[${data.text}; ${dataIndex + 1}]: called (${lastCallTimeTxt}ms)`,
    );
    await delay(data.time);
    return `${data.text}_${data.time}`;
  };

export const useTimeoutExample = async () => {
  const threadPool = new ResizableThreadPool<string>(() => createThread());
  await threadPool.resize(2);

  const threadScheduler = new ThreadScheduler<string>(
    (task, scheduler) => threadPool.getRunnableThread()?.lock(scheduler),
    (task, thread) => thread.unlock(),
  );

  const items = await Promise.all(
    exampleEntries.map((entry, index) =>
      threadScheduler.run(createTask(fn(entry, index, threadPool.getSize()))),
    ),
  );

  console.log(items);
};
