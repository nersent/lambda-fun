import { AsyncQueue, createThreadManager } from "../src";

export const timeoutExample = async (threads = 2) => {
  interface QueueItem {
    time: number;
    char: string;
  }

  const items: QueueItem[] = [
    { time: 1, char: "a" },
    { time: 70, char: "b" },
    { time: 40, char: "c" },
    { time: 1, char: "d" },
  ];

  const queue = new AsyncQueue(
    createThreadManager(threads),
    {},
    { debug: true, printOnFinish: true },
  );

  const called: string[] = [];

  const wrap = (item: QueueItem) => {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(item.char);
        called.push(item.char);
      }, item.time);
    });
  };

  setTimeout(() => {
    queue.tick();
  }, 50);

  const resolved = await Promise.all(
    items.map((item) => queue.subscribe(queue.enqueue(wrap, item), false)),
  );

  console.log("Resolved: ", resolved.map((r) => r.data).join(""));
  console.log("Called: ", called.join(""));
};
