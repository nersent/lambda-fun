import { threadify, ThreadifyEntry } from "../../src/threadify";
import { delay } from "../../src/utils";

export const useThreadifyThrottleExample = async () => {
  const tryCounter = 0;

  const res = await threadify(
    {
      threads: 1,
      throttle: {
        time: 1000,
        count: 1,
      },
      // maxTries: 3,
      rejectOnError: true,
      queueOptions: { verbose: false, printSteps: true },
    },
    ...[500, 600, 700, 800].map<ThreadifyEntry>((time, index) => {
      return {
        fn: async () => {
          // if (time === 700 && ++tryCounter < 2) {
          //   console.log(`Failed ${time}`);
          //   throw new Error("Test error");
          // }
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
