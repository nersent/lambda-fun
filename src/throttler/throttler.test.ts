import "jest";
import { delay } from "../utils";
import { Throttler, ThrottlerBatchEntry } from "./throttler";

describe("Throttler", () => {
  describe("isLocked", () => {
    describe("all batch entries are marked as not finished", () => {
      it("returns true if batch length is the same as max calls", async () => {
        const instance = new Throttler({ count: 2, time: 100 });
        instance["batch"] = [
          { startTime: 0, hasFinished: false },
          { startTime: 1, hasFinished: false },
        ] as ThrottlerBatchEntry[];
        expect(instance.isLocked()).toEqual(true);
      });

      it("returns false if batch length is the same as max calls", async () => {
        const instance = new Throttler({ count: 2, time: 100 });
        instance["batch"] = [
          { startTime: 0, hasFinished: false },
        ] as ThrottlerBatchEntry[];
        expect(instance.isLocked()).toEqual(false);
      });
    });
  });

  describe("#freeBatch", () => {
    describe("all batch entries are marked as not finished", () => {
      it("doesn't clear batch", async () => {
        const instance = new Throttler({ count: 4, time: 2 });
        const batch = [
          { startTime: 0, hasFinished: false },
          { startTime: 1, hasFinished: false },
          { startTime: 2, hasFinished: false },
          { startTime: 3, hasFinished: false },
        ] as ThrottlerBatchEntry[];
        instance["batch"] = batch;
        instance["freeBatch"]();
        expect(instance["batch"]).toStrictEqual(batch);
      });
    });

    describe("all batch entries are finished", () => {
      describe("time has passed", () => {
        it("time is equal to the time in options", async () => {
          const instance = new Throttler({ count: 4, time: 10 });
          const batch = [
            { startTime: 0, hasFinished: true, endTime: 4 },
            { startTime: 4, hasFinished: true, endTime: 9 },
            { startTime: 5, hasFinished: true, endTime: 7 },
            { startTime: 7, hasFinished: true, endTime: 2 },
          ] as ThrottlerBatchEntry[];
          instance["batch"] = batch;
          instance["batchLongestEndTime"] = 9;
          instance["freeBatch"](20);
          expect(instance["batch"].length).toEqual(0);
        });

        it("time is greater than the time in options", async () => {
          const instance = new Throttler({ count: 4, time: 10 });
          const batch = [
            { startTime: 12, hasFinished: true, endTime: 14 },
            { startTime: 14, hasFinished: true, endTime: 19 },
            { startTime: 15, hasFinished: true, endTime: 17 },
            { startTime: 17, hasFinished: true, endTime: 12 },
          ] as ThrottlerBatchEntry[];
          instance["batch"] = batch;
          instance["batchLongestEndTime"] = 9;
          instance["freeBatch"](30);
          expect(instance["batch"].length).toEqual(0);
        });
      });
    });
  });

  describe("execute", () => {
    describe("edge cases", () => {
      interface Item {
        id: number;
        time: number;
      }

      const getExecuteTest = (throttler: Throttler, items: Item[]) => {
        interface Call {
          id: number;
          time: number;
        }

        const calls: Call[] = [];
        let callCounter = 0;

        const fn = (item: Item) => async () => {
          callCounter++;

          if (callCounter > throttler.options.count) {
            throw new Error("Too many calls");
          }

          calls.push({ id: item.id, time: Date.now() });
          await delay(item.time);
          callCounter--;
          return item.id;
        };

        const test = async () => {
          await Promise.all(
            items.map((item) => throttler.execute(fn(item), item)),
          );

          expect(calls.map((r) => r.id)).toStrictEqual(
            items.map((item) => item.id),
          );
        };

        return { test };
      };

      it("should throttle execution with one per time", async () => {
        const items: Item[] = [
          { id: 1, time: 10 },
          { id: 2, time: 10 },
          { id: 3, time: 10 },
          { id: 4, time: 10 },
        ];

        const throttler = new Throttler({ time: 10, count: 1 });

        const { test } = getExecuteTest(throttler, items);
        await test();
      });

      it("should throttle execution with two per time", async () => {
        const items: Item[] = [
          { id: 1, time: 10 },
          { id: 2, time: 10 },
          { id: 3, time: 10 },
          { id: 4, time: 10 },
        ];

        const throttler = new Throttler({ time: 10, count: 2 });

        const { test } = getExecuteTest(throttler, items);
        await test();
      });

      it("should throttle execution with one per time and time limit", async () => {
        const items: Item[] = [
          { id: 1, time: 10 },
          { id: 2, time: 10 },
          { id: 3, time: 10 },
          { id: 4, time: 10 },
        ];

        const throttler = new Throttler({ time: 20, count: 1 });

        const { test } = getExecuteTest(throttler, items);
        await test();
      });

      it("should throttle execution with two per time and time limit", async () => {
        const items: Item[] = [
          { id: 1, time: 10 },
          { id: 2, time: 10 },
          { id: 3, time: 10 },
          { id: 4, time: 10 },
        ];

        const throttler = new Throttler({ time: 20, count: 2 });

        const { test } = getExecuteTest(throttler, items);
        await test();
      });

      it("should throttle execution with one per time and execution times less than time limit", async () => {
        const items: Item[] = [
          { id: 1, time: 0 },
          { id: 2, time: 0 },
          { id: 3, time: 0 },
          { id: 4, time: 0 },
        ];

        const throttler = new Throttler({ time: 20, count: 1 });

        const { test } = getExecuteTest(throttler, items);
        await test();
      });

      it("should throttle execution with two per time and execution times less than time limit", async () => {
        const items: Item[] = [
          { id: 1, time: 0 },
          { id: 2, time: 0 },
          { id: 3, time: 0 },
          { id: 4, time: 0 },
        ];

        const throttler = new Throttler({ time: 20, count: 2 });

        const { test } = getExecuteTest(throttler, items);
        await test();
      });

      it("should throttle execution with one per time and mixed execution time", async () => {
        const items: Item[] = [
          { id: 1, time: 0 },
          { id: 2, time: 50 },
          { id: 3, time: 20 },
          { id: 4, time: 0 },
        ];

        const throttler = new Throttler({ time: 20, count: 1 });

        const { test } = getExecuteTest(throttler, items);
        await test();
      });

      it("should throttle execution with two per time and mixed execution time", async () => {
        const items: Item[] = [
          { id: 1, time: 0 },
          { id: 2, time: 50 },
          { id: 3, time: 20 },
          { id: 4, time: 0 },
        ];

        const throttler = new Throttler({ time: 20, count: 2 });

        const { test } = getExecuteTest(throttler, items);
        await test();
      });
    });
  });
});
