import { ThreadPool } from "../../src/threads/thread-pool";
import { Queue } from "../../src/queue/queue";
import { delay } from "../../src/utils";

export const useQueuePauseResumeExample = async () => {
  const threadPool = new ThreadPool();

  await threadPool.setPoolSize(1);

  interface QueueEntry {
    text: string;
    time: number;
    isPaused?: boolean;
  }

  const queue = new Queue(
    {
      threadPool,
      execute: async ({ data }: { data: QueueEntry }) => {
        console.log(`[${data.text}]: called`);
        await delay(data.time);
        return `${data.text}_${data.time}`;
      },
    },
    { verbose: false, printSteps: true },
  );

  queue.on("resolve", (e) => {
    if (e.isCanceled) return console.warn(`[${e.id}]: canceled`);
    if ("error" in e) return console.error(`[${e.id}]: rejected with`, e.error);
    if ("data" in e) {
      console.log(`[${e.id}]: resolved with`, e.data);
      if (e.id === "d") {
        queue.resume("a", true); // true
      }
    }
  });

  queue.once("finish", () => {
    console.log("finish");
  });

  const entries: QueueEntry[] = [
    { text: "a", time: 1000, isPaused: true },
    { text: "b", time: 1000 },
    { text: "c", time: 1000 },
    { text: "d", time: 1000 },
    { text: "e", time: 1000 },
  ];

  const ids = entries.map((entry) =>
    queue.enqueue(entry, { id: entry.text, isPaused: entry.isPaused }),
  );

  queue.tick();
};
