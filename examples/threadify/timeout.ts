import { threadify } from "../../src/threads/threadify";
import { delay } from "../../src/utils";

export const useThreadifyTimeoutExample = async () => {
  await threadify(
    { threads: 4 },
    ...[
      1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000,
    ].map((time, index) => {
      return () => {
        console.log(`[${index}]: ${time}`);
        return delay(time);
      };
    }),
  );
};
