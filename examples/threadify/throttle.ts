import { Throttler } from "../../src/throttler/throttler";
import { threadify, ThreadifyEntry } from "../../src/threadify";
import { delay } from "../../src/utils";

export const useThreadifyThrottleExample = async () => {
  const res = await threadify(
    {
      threads: 10,
      throttler: new Throttler({ count: 1, time: 1000 }), // max 1 execution per 1 second
      queueOptions: { verbose: false, printSteps: true },
    },
    ...[500, 600, 700, 800].map<ThreadifyEntry>((time, index) => {
      return {
        fn: async () => {
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
