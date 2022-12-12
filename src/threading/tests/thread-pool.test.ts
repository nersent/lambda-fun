import "jest";
import { FunctionThread } from "../function-thread";
import { ThreadManager } from "../thread-manager";
import { ThreadPool } from "../thread-pool";
import { ThreadStatus } from "../thread-types";

interface TestThreadData {
  id: number;
  status: ThreadStatus;
  isAlive?: boolean;
  isInitialized?: boolean;
  isDirty?: boolean;
}

const createThreadManager = (...items: TestThreadData[]) => {
  let currentId = 0;
  const threadManager = new ThreadManager((count: number) => {
    return Array.from({ length: count }).map((_, index) => {
      return new FunctionThread(index + currentId++);
    });
  });

  for (const item of items) {
    const thread = new FunctionThread(item.id);
    thread["status"] = item.status;
    thread["_isAlive"] = item.isAlive ?? true;
    thread["_isInitialized"] = item.isInitialized ?? true;
    threadManager["threads"].set(item.id, thread);
  }

  return threadManager;
};

const createThreadPool = (...items: TestThreadData[]) => {
  const threadManager = createThreadManager(...items);
  const threadPool = new ThreadPool(threadManager);

  for (const item of items) {
    if (item.isDirty) {
      const thread = threadManager.getThread(item.id);
      if (thread == null) {
        throw new Error(`Test thread ${item.id} not found`);
      }
      threadPool["dirtyThreads"].add(thread);
    }
  }

  return threadPool;
};

describe("ThreadPool", () => {
  describe("[private] findRunnableThread", () => {
    it("finds runnable thread", async () => {
      {
        const tp = new ThreadPool(
          createThreadManager(
            {
              id: 1,
              status: ThreadStatus.None,
              isDirty: false,
              isInitialized: true,
            },
            {
              id: 2,
              status: ThreadStatus.None,
              isDirty: false,
              isInitialized: true,
            },
          ),
        );
        expect(tp["findRunnableThread"]()?.getId()).toEqual(1);
      }
      {
        const tp = new ThreadPool(
          createThreadManager(
            {
              id: 1,
              status: ThreadStatus.Pending,
              isAlive: true,
              isInitialized: true,
            },
            {
              id: 2,
              status: ThreadStatus.None,
              isAlive: true,
              isInitialized: true,
            },
          ),
        );
        expect(tp["findRunnableThread"]()?.getId()).toEqual(2);
      }
      {
        const tp = new ThreadPool(
          createThreadManager(
            {
              id: 1,
              status: ThreadStatus.Rejected,
              isAlive: false,
              isInitialized: true,
            },
            {
              id: 2,
              status: ThreadStatus.None,
              isAlive: true,
              isInitialized: true,
            },
          ),
        );
        expect(tp["findRunnableThread"]()?.getId()).toEqual(2);
      }
      {
        const tp = new ThreadPool(
          createThreadManager(
            {
              id: 1,
              status: ThreadStatus.None,
              isAlive: false,
              isInitialized: true,
            },
            {
              id: 2,
              status: ThreadStatus.None,
              isAlive: true,
              isInitialized: true,
            },
          ),
        );
        expect(tp["findRunnableThread"]()?.getId()).toEqual(2);
      }
      {
        const tp = new ThreadPool(
          createThreadManager(
            {
              id: 1,
              status: ThreadStatus.Pending,
              isAlive: true,
              isInitialized: true,
            },
            {
              id: 2,
              status: ThreadStatus.Pending,
              isAlive: true,
              isInitialized: true,
            },
          ),
        );
        expect(tp["findRunnableThread"]()?.getId()).toEqual(undefined);
      }
      {
        const tp = new ThreadPool(
          createThreadManager(
            {
              id: 1,
              status: ThreadStatus.Pending,
              isAlive: true,
              isInitialized: true,
            },
            {
              id: 2,
              status: ThreadStatus.None,
              isAlive: false,
              isInitialized: true,
            },
          ),
        );
        expect(tp["findRunnableThread"]()?.getId()).toEqual(undefined);
      }
      {
        const tp = new ThreadPool(
          createThreadManager(
            {
              id: 1,
              status: ThreadStatus.Pending,
              isAlive: true,
              isInitialized: true,
            },
            {
              id: 2,
              status: ThreadStatus.Rejected,
              isAlive: true,
              isInitialized: true,
            },
          ),
        );
        expect(tp["findRunnableThread"]()?.getId()).toEqual(2);
      }
    });
  });

  describe("setSize", () => {
    describe("if count is more than thread manager count, then creates additional threads and marks as available", () => {
      it("supports all available threads", async () => {
        const tp = new ThreadPool(
          createThreadManager({
            id: 1,
            status: ThreadStatus.None,
            isAlive: true,
            isInitialized: true,
          }),
        );
        await tp.setSize(2);
        const dirtyThreads = tp["getDirtyThreads"]();
        expect(dirtyThreads.length).toEqual(0);
      });

      it("supports killed threads", async () => {
        const tp = new ThreadPool(
          createThreadManager(
            {
              id: 1,
              status: ThreadStatus.None,
              isAlive: true,
              isInitialized: true,
            },
            {
              id: 2,
              status: ThreadStatus.None,
              isAlive: false,
              isInitialized: true,
            },
          ),
        );
        await tp.setSize(3);
        const dirtyThreads = tp["getDirtyThreads"]();
        expect(dirtyThreads.length).toEqual(0);
      });
    });

    describe("if count is less than thread manager count, then marks threads as killed", () => {
      describe("are threads are not executing", () => {
        it("all threads are available", async () => {
          const tp = new ThreadPool(
            createThreadManager(
              {
                id: 1,
                status: ThreadStatus.None,
                isAlive: true,
                isInitialized: true,
              },
              {
                id: 2,
                status: ThreadStatus.None,
                isAlive: true,
                isInitialized: true,
              },
              {
                id: 3,
                status: ThreadStatus.None,
                isAlive: true,
                isInitialized: true,
              },
            ),
          );
          await tp.setSize(1);
          const dirtyThreads = tp["getDirtyThreads"]();
          expect(dirtyThreads.length).toEqual(2);
          expect(tp["isThreadDirty"](1)).toEqual(true);
          expect(tp["isThreadDirty"](2)).toEqual(true);
          expect(tp["isThreadDirty"](3)).toEqual(false);
        });
      });
    });
  });
});
