import { Throttler } from "../../src/throttler/throttler";
import { threadify } from "../../src/threads/threadify";
import { delay } from "../../src/utils";
import { Repeater } from "../../src/repeater/repeater";

export const useThreadifyRetryAndThrottleExample = async () => {
  let tryCounter = 0;
  const res = await threadify(
    {
      threads: 1,
      throttler: new Throttler({ count: 1, time: 5000 }), // 2 executions per 500 miliseconds
      repeater: new Repeater({ maxAttempts: 3 }),
    },
    ...[500, 600, 700, 800].map((time, index) => {
      return async () => {
        if (time === 600 && ++tryCounter < 3) {
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
