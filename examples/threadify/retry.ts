import { Repeater } from "../../src/repeater/repeater";
import { threadify } from "../../src/threads/threadify";
import { delay } from "../../src/utils";

export const useThreadifyRetryExample = async () => {
  let tryCounter = 0;

  const res = await threadify(
    {
      threads: 1,
      repeater: new Repeater({ maxAttempts: 3 }),
      onError: {
        reject: true,
      },
    },
    ...[500, 600, 700, 800].map((time, index) => {
      return async () => {
        if (time === 700 && ++tryCounter < 2) {
          console.log(`Failed ${time}`);
          throw new Error("Test error");
        }
        console.log(time);
        await delay(time);
        return time;
      };
    }),
  );

  console.log(res);
};
