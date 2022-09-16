import { threadify, ThreadifyEntry } from "../src/threadify";
import { delay } from "../src/utils";

export const useRetryExample = async () => {
  let tryCounter = 0;
  const res = await threadify(
    {
      threads: 1,
      maxTries: 3,
      rejectOnError: true,
      // exitProcessOnError: true,
      queueOptions: { verbose: false, printSteps: true },
    },
    ...[500, 600, 700, 800].map<ThreadifyEntry>((time, index) => {
      // you can return just a function, but also an object, then you can view it in verbose logs
      return {
        fn: async () => {
          if (time === 700 && ++tryCounter < 2) {
            console.log(`Failed ${time}`);
            throw new Error("Test error");
          }
          console.log(time);
          // console.log(`[${index}]: ${time}`);
          await delay(time);
          return time;
        },
        time,
      };
      // or
      // return () => ...
    }),
  );
  console.log(res);
};
