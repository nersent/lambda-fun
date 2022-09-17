import { Throttler } from "../../src/throttler/throttler";
import { threadify, ThreadifyEntry } from "../../src/threadify";
import { delay } from "../../src/utils";
import { Trier } from "../../src/trier/trier";

export const useThreadifyRetryAndThrottleExample = async () => {
  let tryCounter = 0;
  const res = await threadify(
    {
      threads: 1,
      throttler: new Throttler({ count: 2, time: 5000 }), // 2 executions per 500 miliseconds
      trier: new Trier({ maxTries: 3 }),
      queueOptions: { verbose: false, printSteps: true },
    },
    ...[500, 600, 700, 800].map<ThreadifyEntry>((time, index) => {
      return {
        fn: async () => {
          if (time === 600 && ++tryCounter < 3) {
            console.log(`Failed ${time}`);
            throw new Error("Test error");
          }
          console.log(time);
          await delay(time);
          return time;
        },
        time,
      };
    }),
  );
  console.log(res);
};
