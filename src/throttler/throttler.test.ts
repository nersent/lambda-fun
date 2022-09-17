import "jest";
import { Throttler } from "./throttler";

describe("Throttler", () => {
  describe("isLocked", () => {
    describe("all batch entries are marked as not finished", () => {
      it("returns true if batch length is the same as max calls", async () => {
        const instance = new Throttler({ count: 2, time: 100 });
        instance["currentBatch"] = [
          { startTime: 0, hasFinished: false },
          { startTime: 1, hasFinished: false },
        ];
        expect(instance.isLocked()).toEqual(true);
      });

      it("returns false if batch length is the same as max calls", async () => {
        const instance = new Throttler({ count: 2, time: 100 });
        instance["currentBatch"] = [{ startTime: 0, hasFinished: false }];
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
        ];
        instance["currentBatch"] = batch;
        instance["freeBatch"]();
        expect(instance["currentBatch"]).toStrictEqual(batch);
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
          ];
          instance["currentBatch"] = batch;
          instance["freeBatch"](10);
          expect(instance["currentBatch"].length).toEqual(0);
        });

        it("time is greater than the time in options", async () => {
          const instance = new Throttler({ count: 4, time: 10 });
          const batch = [
            { startTime: 12, hasFinished: true, endTime: 14 },
            { startTime: 14, hasFinished: true, endTime: 19 },
            { startTime: 15, hasFinished: true, endTime: 17 },
            { startTime: 17, hasFinished: true, endTime: 12 },
          ];
          instance["currentBatch"] = batch;
          instance["freeBatch"](20);
          expect(instance["currentBatch"].length).toEqual(0);
        });
      });
    });

    // describe("there are 3 out of 4 items", () => {
    //   it("all of items are finished and time is equal to the time in options", async () => {
    //     const instance = new Throttler({ count: 4, time: 10 });
    //     const batch = [
    //       { startTime: 0, hasFinished: true, endTime: 4 },
    //       { startTime: 4, hasFinished: true, endTime: 9 },
    //       { startTime: 5, hasFinished: true, endTime: 7 },
    //     ];
    //     instance["currentBatch"] = batch;
    //     instance["freeBatch"](10);
    //     expect(instance["currentBatch"].length).toEqual(0);
    //   });
    // });
  });
});
