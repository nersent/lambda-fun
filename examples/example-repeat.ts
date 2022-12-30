import { delay } from "./utils";
import { repeat } from "../src";

export const useRepeatExample = async () => {
  await repeat(
    async (ctx) => {
      console.log(`Current attempt: ${ctx.currentAttempt}/${ctx.maxAttempts}`);
      if (ctx.currentAttempt === 0) {
        throw new Error("Forced error");
      }
      await delay(1000);
      console.log("Success");
    },
    {
      maxAttempts: 3,
    },
  );
};
