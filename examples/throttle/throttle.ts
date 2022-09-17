import { delay } from "../../src/utils";
import { Throttler } from "../../src/throttler/throttler";

export const useThrottleExample = async () => {
  const throttler = new Throttler({ time: 2000, count: 3 });

  const now = Date.now();

  const fn = (time: number, message: string) => async () => {
    console.log(
      `_______________________${message}, ${Math.floor(
        (Date.now() - now) / 1000,
      )}s`,
    );
    await delay(time);
  };

  interface Entry {
    message: string;
    time: number;
  }

  const entries: Entry[] = [
    { message: "a", time: 0 },
    { message: "b", time: 5000 },
    { message: "c", time: 0 },
    { message: "d", time: 100 },
  ];

  await Promise.all(
    entries.map((entry) =>
      throttler.execute(fn(entry.time, entry.message), entry.message),
    ),
  );
  // for (const entry of entries) {
  //   throttler.execute(fn(entry.time, entry.message), entry.message);
  // }
};
