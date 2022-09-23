import "jest";
import { Thread } from "../thread";
import { ThreadPool } from "../thread-pool";
import { IThread, ThreadExecutionStatus, ThreadStatus } from "../thread-types";

interface CreateThreadOptions {
  id: string;
  status: ThreadStatus;
  executionStatus: ThreadExecutionStatus;
}

const createThread = ({ id, status, executionStatus }: CreateThreadOptions) => {
  const thread = new Thread();
  thread["id"] = id;
  thread["status"] = status;
  thread["executionStatus"] = executionStatus;
  return thread;
};

const setThreadMap = (
  instance: ThreadPool,
  ...threads: CreateThreadOptions[]
) => {
  instance["threadMap"] = new Map<string, IThread>(
    threads.map((thread) => [thread["id"], createThread(thread)]),
  );
  instance["_poolSize"] = threads.length;
};

describe("ThreadPool Impl", () => {
  describe("findExecutableThread", () => {
    it("returns executable thread", async () => {
      const instance = new ThreadPool();
      {
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
          {
            id: "b",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
        );
        expect(instance.findExecutableThread({})?.getId()).toEqual("a");
      }
      {
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.Pending,
          },
          {
            id: "b",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
        );
        expect(instance.findExecutableThread({})?.getId()).toEqual("b");
      }
      {
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Killed,
            executionStatus: ThreadExecutionStatus.Rejected,
          },
          {
            id: "b",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
        );
        expect(instance.findExecutableThread({})?.getId()).toEqual("b");
      }
      {
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Killed,
            executionStatus: ThreadExecutionStatus.None,
          },
          {
            id: "b",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
        );
        expect(instance.findExecutableThread({})?.getId()).toEqual("b");
      }
      {
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.Pending,
          },
          {
            id: "b",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.Pending,
          },
        );
        expect(instance.findExecutableThread({})?.getId()).toEqual(undefined);
      }
      {
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.Pending,
          },
          {
            id: "b",
            status: ThreadStatus.Killed,
            executionStatus: ThreadExecutionStatus.None,
          },
        );
        expect(instance.findExecutableThread({})?.getId()).toEqual(undefined);
      }
      {
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.Pending,
          },
          {
            id: "b",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.Rejected,
          },
        );
        expect(instance.findExecutableThread({})?.getId()).toEqual("b");
      }
    });
  });

  describe("setThreadsCount", () => {
    describe("if count is more than thread manager count, then creates additional threads and marks as available", () => {
      it("supports all available threads", async () => {
        const instance = new ThreadPool();
        setThreadMap(instance, {
          id: "a",
          status: ThreadStatus.Available,
          executionStatus: ThreadExecutionStatus.None,
        });
        await instance.setPoolSize(2);
        expect(instance["_threads"][0].getStatus()).toEqual(
          ThreadStatus.Available,
        );
        expect(instance["_threads"][1].getStatus()).toEqual(
          ThreadStatus.Available,
        );
      });

      it("supports killed threads", async () => {
        const instance = new ThreadPool();
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
          {
            id: "b",
            status: ThreadStatus.Killed,
            executionStatus: ThreadExecutionStatus.None,
          },
        );
        await instance.setPoolSize(3);
        expect(instance["_threads"][0].getStatus()).toEqual(
          ThreadStatus.Available,
        );
        expect(instance["_threads"][1].getStatus()).toEqual(
          ThreadStatus.Available,
        );
        expect(instance["_threads"][2].getStatus()).toEqual(
          ThreadStatus.Available,
        );
      });
    });

    describe("if count is less than thread manager count, then marks threads as killed", () => {
      describe("are threads are not executing", () => {
        it("all threads are available", async () => {
          const instance = new ThreadPool();
          setThreadMap(
            instance,
            {
              id: "a",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.None,
            },
            {
              id: "b",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.None,
            },
            {
              id: "c",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.None,
            },
          );
          await instance.setPoolSize(1);
          expect(instance["_threads"][0].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][1].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][2].getStatus()).toEqual(
            ThreadStatus.Available,
          );
        });

        it("first thread is killed", async () => {
          const instance = new ThreadPool();
          setThreadMap(
            instance,
            {
              id: "a",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.None,
            },
            {
              id: "b",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.None,
            },
            {
              id: "c",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.None,
            },
          );
          await instance.setPoolSize(1);
          expect(instance["_threads"][0].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][1].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][2].getStatus()).toEqual(
            ThreadStatus.Available,
          );
        });

        it("all threads are killed", async () => {
          const instance = new ThreadPool();
          setThreadMap(
            instance,
            {
              id: "a",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.None,
            },
            {
              id: "b",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.None,
            },
            {
              id: "c",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.None,
            },
          );
          await instance.setPoolSize(1);
          expect(instance["_threads"][0].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][1].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][2].getStatus()).toEqual(
            ThreadStatus.Available,
          );
        });

        it("only first thread is killed", async () => {
          const instance = new ThreadPool();
          setThreadMap(
            instance,
            {
              id: "a",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.None,
            },
            {
              id: "b",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.None,
            },
            {
              id: "c",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.None,
            },
          );
          await instance.setPoolSize(1);
          expect(instance["_threads"][0].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][1].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][2].getStatus()).toEqual(
            ThreadStatus.Available,
          );
        });
      });

      describe("every thread is pending", () => {
        it("first thread is available", async () => {
          const instance = new ThreadPool();
          setThreadMap(
            instance,
            {
              id: "a",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "b",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "c",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.Pending,
            },
          );
          await instance.setPoolSize(1);
          expect(instance["_threads"][0].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][1].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][2].getStatus()).toEqual(
            ThreadStatus.Available,
          );
        });

        it("first thread is killed", async () => {
          const instance = new ThreadPool();
          setThreadMap(
            instance,
            {
              id: "a",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "b",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "c",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.Pending,
            },
          );
          await instance.setPoolSize(1);
          expect(instance["_threads"][0].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][1].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][2].getStatus()).toEqual(
            ThreadStatus.Available,
          );
        });

        it("first and second threads are killed", async () => {
          const instance = new ThreadPool();
          setThreadMap(
            instance,
            {
              id: "a",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "b",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "c",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.Pending,
            },
          );
          await instance.setPoolSize(1);
          expect(instance["_threads"][0].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][1].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][2].getStatus()).toEqual(
            ThreadStatus.Available,
          );
        });

        it("every thread is killed", async () => {
          const instance = new ThreadPool();
          setThreadMap(
            instance,
            {
              id: "a",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "b",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "c",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.Pending,
            },
          );
          await instance.setPoolSize(1);
          expect(instance["_threads"][0].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][1].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][2].getStatus()).toEqual(
            ThreadStatus.Available,
          );
        });

        it("last thread is killed and rest is available", async () => {
          const instance = new ThreadPool();
          setThreadMap(
            instance,
            {
              id: "a",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "b",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "c",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.Pending,
            },
          );
          await instance.setPoolSize(1);
          expect(instance["_threads"][0].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][1].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][2].getStatus()).toEqual(
            ThreadStatus.Available,
          );
        });
      });

      describe("thread execution status is mixed", () => {
        it("first thread is pending and rest are free", async () => {
          const instance = new ThreadPool();
          setThreadMap(
            instance,
            {
              id: "a",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "b",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.None,
            },
            {
              id: "c",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.None,
            },
          );
          await instance.setPoolSize(1);
          expect(instance["_threads"][0].getStatus()).toEqual(
            ThreadStatus.Available,
          );
          expect(instance["_threads"][1].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][2].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
        });

        it("first thread is pending and killed and rest are free", async () => {
          const instance = new ThreadPool();
          setThreadMap(
            instance,
            {
              id: "a",
              status: ThreadStatus.Killed,
              executionStatus: ThreadExecutionStatus.Pending,
            },
            {
              id: "b",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.None,
            },
            {
              id: "c",
              status: ThreadStatus.Available,
              executionStatus: ThreadExecutionStatus.None,
            },
          );
          await instance.setPoolSize(1);
          expect(instance["_threads"][0].getStatus()).toEqual(
            ThreadStatus.Available,
          );
          expect(instance["_threads"][1].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
          expect(instance["_threads"][2].getStatus()).toEqual(
            ThreadStatus.Killed,
          );
        });
      });

      it("second thread is pending and rest are free", async () => {
        const instance = new ThreadPool();
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
          {
            id: "b",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.Pending,
          },
          {
            id: "c",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
        );
        await instance.setPoolSize(1);
        expect(instance["_threads"][0].getStatus()).toEqual(
          ThreadStatus.Killed,
        );
        expect(instance["_threads"][1].getStatus()).toEqual(
          ThreadStatus.Available,
        );
        expect(instance["_threads"][2].getStatus()).toEqual(
          ThreadStatus.Killed,
        );
      });

      it("second thread is pending and killed and rest are free", async () => {
        const instance = new ThreadPool();
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
          {
            id: "b",
            status: ThreadStatus.Killed,
            executionStatus: ThreadExecutionStatus.Pending,
          },
          {
            id: "c",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
        );
        await instance.setPoolSize(1);
        expect(instance["_threads"][0].getStatus()).toEqual(
          ThreadStatus.Killed,
        );
        expect(instance["_threads"][1].getStatus()).toEqual(
          ThreadStatus.Available,
        );
        expect(instance["_threads"][2].getStatus()).toEqual(
          ThreadStatus.Killed,
        );
      });

      it("last thread is pending and rest are free", async () => {
        const instance = new ThreadPool();
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
          {
            id: "b",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
          {
            id: "c",
            status: ThreadStatus.Killed,
            executionStatus: ThreadExecutionStatus.Pending,
          },
        );
        await instance.setPoolSize(1);
        expect(instance["_threads"][0].getStatus()).toEqual(
          ThreadStatus.Killed,
        );
        expect(instance["_threads"][1].getStatus()).toEqual(
          ThreadStatus.Killed,
        );
        expect(instance["_threads"][2].getStatus()).toEqual(
          ThreadStatus.Available,
        );
      });

      it("last thread is pending and killed and rest are free", async () => {
        const instance = new ThreadPool();
        setThreadMap(
          instance,
          {
            id: "a",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
          {
            id: "b",
            status: ThreadStatus.Available,
            executionStatus: ThreadExecutionStatus.None,
          },
          {
            id: "c",
            status: ThreadStatus.Killed,
            executionStatus: ThreadExecutionStatus.Pending,
          },
        );
        await instance.setPoolSize(1);
        expect(instance["_threads"][0].getStatus()).toEqual(
          ThreadStatus.Killed,
        );
        expect(instance["_threads"][1].getStatus()).toEqual(
          ThreadStatus.Killed,
        );
        expect(instance["_threads"][2].getStatus()).toEqual(
          ThreadStatus.Available,
        );
      });
    });

    it("if count is zero, then every thread is market as killed", async () => {
      const instance = new ThreadPool();
      setThreadMap(
        instance,
        {
          id: "a",
          status: ThreadStatus.Available,
          executionStatus: ThreadExecutionStatus.None,
        },
        {
          id: "b",
          status: ThreadStatus.Killed,
          executionStatus: ThreadExecutionStatus.None,
        },
        {
          id: "c",
          status: ThreadStatus.Killed,
          executionStatus: ThreadExecutionStatus.Pending,
        },
      );
      await instance.setPoolSize(0);
      expect(instance["_threads"][0].getStatus()).toEqual(ThreadStatus.Killed);
      expect(instance["_threads"][1].getStatus()).toEqual(ThreadStatus.Killed);
      expect(instance["_threads"][2].getStatus()).toEqual(ThreadStatus.Killed);
    });

    it("if count is the same as current count", async () => {
      const instance = new ThreadPool();
      setThreadMap(instance, {
        id: "a",
        status: ThreadStatus.Killed,
        executionStatus: ThreadExecutionStatus.Pending,
      });
      await instance.setPoolSize(1);
      expect(instance["_threads"][0].getStatus()).toEqual(
        ThreadStatus.Available,
      );
    });
  });

  describe("flush", () => {
    it("removed killed and not executing threads", async () => {
      const instance = new ThreadPool();
      setThreadMap(
        instance,
        {
          id: "a",
          status: ThreadStatus.Available,
          executionStatus: ThreadExecutionStatus.None,
        },
        {
          id: "b",
          status: ThreadStatus.Killed,
          executionStatus: ThreadExecutionStatus.Pending,
        },
        {
          id: "c",
          status: ThreadStatus.Available,
          executionStatus: ThreadExecutionStatus.Pending,
        },
        {
          id: "d",
          status: ThreadStatus.Killed,
          executionStatus: ThreadExecutionStatus.Fulfilled,
        },
        {
          id: "e",
          status: ThreadStatus.Killed,
          executionStatus: ThreadExecutionStatus.None,
        },
        {
          id: "f",
          status: ThreadStatus.Available,
          executionStatus: ThreadExecutionStatus.Rejected,
        },
      );
      await instance.flush();
      expect(instance.getThread("a")).not.toEqual(undefined);
      expect(instance.getThread("b")).not.toEqual(undefined);
      expect(instance.getThread("c")).not.toEqual(undefined);
      expect(instance.getThread("d")).toEqual(undefined);
      expect(instance.getThread("e")).toEqual(undefined);
      expect(instance.getThread("f")).not.toEqual(undefined);
    });
  });
});
