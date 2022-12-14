import "jest";
import { FunctionThread } from "../function-thread";
import { ThreadStatus } from "../thread-types";

describe("Thread Impl", () => {
  describe("isRunning", () => {
    it("returns true if thread is running", async () => {
      const instance = new FunctionThread(1);
      instance["status"] = ThreadStatus.Pending;
      expect(instance.isRunning()).toEqual(true);
    });

    it("returns false if thread is not running", async () => {
      const instance = new FunctionThread(1);
      {
        instance["status"] = ThreadStatus.None;
        expect(instance.isRunning()).toEqual(false);
      }
      {
        instance["status"] = ThreadStatus.Fulfilled;
        expect(instance.isRunning()).toEqual(false);
      }
      {
        instance["status"] = ThreadStatus.Rejected;
        expect(instance.isRunning()).toEqual(false);
      }
    });
  });

  describe("isAlive", () => {
    it("returns true if thread is alive", async () => {
      const instance = new FunctionThread(1);
      instance["_isAlive"] = true;
      instance["_isInitialized"] = true;
      expect(instance.isAlive()).toEqual(true);
    });

    it("returns false if thread is dead", async () => {
      const instance = new FunctionThread(1);
      instance["_isAlive"] = false;
      instance["_isInitialized"] = true;
      expect(instance.isAlive()).toEqual(false);
    });

    it("returns false if thread is uninitialized", async () => {
      const instance = new FunctionThread(1);
      instance["_isAlive"] = true;
      instance["_isInitialized"] = false;
      expect(instance.isAlive()).toEqual(false);
    });
  });
});
