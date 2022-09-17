import "jest";
import { Thread } from "../thread";
import { ThreadExecutionStatus, ThreadStatus } from "../thread-types";

describe("Thread Impl", () => {
  describe("isExecuting", () => {
    it("returns true if thread is in execution mode", async () => {
      const instance = new Thread();
      instance["executionStatus"] = ThreadExecutionStatus.Pending;
      expect(instance.isExecuting()).toEqual(true);
    });

    it("returns false if thread is not in execution mode", async () => {
      const instance = new Thread();
      {
        instance["executionStatus"] = ThreadExecutionStatus.None;
        expect(instance.isExecuting()).toEqual(false);
      }
      {
        instance["executionStatus"] = ThreadExecutionStatus.Fulfilled;
        expect(instance.isExecuting()).toEqual(false);
      }
      {
        instance["executionStatus"] = ThreadExecutionStatus.Rejected;
        expect(instance.isExecuting()).toEqual(false);
      }
    });
  });

  describe("isExecutable", () => {
    it("returns true if thread is not in execution mode and is available", async () => {
      const instance = new Thread();
      instance.setStatus(ThreadStatus.Available);
      {
        instance["executionStatus"] = ThreadExecutionStatus.None;
        expect(instance.isExecutable()).toEqual(true);
      }
      {
        instance["executionStatus"] = ThreadExecutionStatus.Fulfilled;
        expect(instance.isExecutable()).toEqual(true);
      }
      {
        instance["executionStatus"] = ThreadExecutionStatus.Rejected;
        expect(instance.isExecutable()).toEqual(true);
      }
    });

    it("returns false if thread is not in execution mode and killed", async () => {
      const instance = new Thread();
      instance.setStatus(ThreadStatus.Killed);
      {
        instance["executionStatus"] = ThreadExecutionStatus.None;
        expect(instance.isExecutable()).toEqual(false);
      }
      {
        instance["executionStatus"] = ThreadExecutionStatus.Fulfilled;
        expect(instance.isExecutable()).toEqual(false);
      }
      {
        instance["executionStatus"] = ThreadExecutionStatus.Rejected;
        expect(instance.isExecutable()).toEqual(false);
      }
    });

    it("returns false if thread is in execution mode and available", async () => {
      const instance = new Thread();
      instance.setStatus(ThreadStatus.Available);
      instance["executionStatus"] = ThreadExecutionStatus.Pending;
      expect(instance.isExecutable()).toEqual(false);
    });

    it("returns false if thread is in execution mode and killed", async () => {
      const instance = new Thread();
      instance.setStatus(ThreadStatus.Killed);
      instance["executionStatus"] = ThreadExecutionStatus.Pending;
      expect(instance.isExecutable()).toEqual(false);
    });
  });
});
