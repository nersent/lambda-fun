import { Throttler } from "../../src/throttler/throttler";
import { threadify } from "../../src/threads/threadify";
import { delay } from "../../src/utils";

export const useThreadifyThrottleExample = async () => {
  const res = await threadify(
    {
      threads: 10,
      throttler: new Throttler({ count: 1, time: 3000 }), // max 1 execution per 1 second
    },
    ...[500, 600, 700, 800].map((time, index) => {
      return async () => {
        console.log(time);
        await delay(time);
        return time;
      };
    }),
  );
  console.log(res);
};
