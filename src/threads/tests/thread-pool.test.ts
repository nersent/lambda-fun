import "jest";
import { FunctionThread } from "../function-thread";
import { ThreadManagerImpl } from "../thread-manager-impl";
import { ThreadPoolImpl } from "../thread-pool-impl";
import { ThreadStatus } from "../thread-types";

interface TestThreadData {
  id: number;
  status: ThreadStatus;
  isAlive?: boolean;
  isInitialized?: boolean;
}

const createThreadManager = (...items: TestThreadData[]) => {
  const threadManager = new ThreadManagerImpl((count, tm) => {
    return Array.from({ length: count }).map((_, index) => {
      return new FunctionThread(
        index + tm.getThreads().reverse()[0]!.getId() + 1,
      );
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
  const threadPool = new ThreadPoolImpl(threadManager);

  return threadPool;
};

describe("ThreadPool", () => {
  describe("[private] findRunnableThread", () => {
    it("finds runnable thread", async () => {
      {
        const tp = new ThreadPoolImpl(
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
          ),
        );
        expect(tp["getAvailableThread"]()?.getId()).toEqual(1);
      }
      {
        const tp = new ThreadPoolImpl(
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
        expect(tp["getAvailableThread"]()?.getId()).toEqual(2);
      }
      {
        const tp = new ThreadPoolImpl(
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
        expect(tp["getAvailableThread"]()?.getId()).toEqual(2);
      }
      {
        const tp = new ThreadPoolImpl(
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
        expect(tp["getAvailableThread"]()?.getId()).toEqual(2);
      }
      {
        const tp = new ThreadPoolImpl(
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
        expect(tp["getAvailableThread"]()?.getId()).toEqual(undefined);
      }
      {
        const tp = new ThreadPoolImpl(
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
        expect(tp["getAvailableThread"]()?.getId()).toEqual(undefined);
      }
      {
        const tp = new ThreadPoolImpl(
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
        expect(tp["getAvailableThread"]()?.getId()).toEqual(2);
      }
    });
  });

  describe("resize", () => {
    it("creates additional threads", async () => {
      const tp = createThreadPool({
        id: 1,
        status: ThreadStatus.None,
        isAlive: true,
        isInitialized: true,
      });
      await tp.resize(2);
      const threads = tp.getThreadManager().getThreads();
      expect(threads.length).toEqual(2);
      expect(threads[0].getId()).toEqual(1);
      expect(threads[1].getId()).toEqual(2);
    });

    it("kills threads", async () => {
      const tp = createThreadPool(
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
      );
      await tp.resize(1);
      const tm = tp.getThreadManager();
      const threads = tm.getThreads();
      expect(threads.length).toEqual(1);
      expect(tm.getThread(1)).toEqual(undefined);
      expect(tm.getThread(2)!.isAlive()).toEqual(true);
    });
  });
});
