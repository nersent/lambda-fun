import { threadify } from "../../src/threadify";
import { delay } from "../../src/utils";

export const useThreadifyMessageExample = async () => {
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

  const called: string[] = [];

  const resolved = await threadify(
    { threads: 2, queueOptions: { verbose: false } },
    ...items.map((data) => async () => {
      called.push(data.char);
      await delay(data.time);
      return data.char;
    }),
  );

  console.log("Called: ", called.join(""));
  console.log("\nResolved: ", resolved.join("")); // should be "acdb"
};
