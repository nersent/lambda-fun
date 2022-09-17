import { threadify, ThreadifyEntry } from "../../src/threadify";
import { delay } from "../../src/utils";

export const useThreadifyTimeoutExample = async () => {
  await threadify(
    { threads: 4, queueOptions: { verbose: false } },
    ...[
      1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000,
    ].map<ThreadifyEntry>((time, index) => {
      // you can return just a function, but also an object, then you can view it in verbose logs
      return {
        fn: () => {
          console.log(`[${index}]: ${time}`);
          return delay(time);
        },
        time,
      };
      // or
      // return () => ...
    }),
  );
};
