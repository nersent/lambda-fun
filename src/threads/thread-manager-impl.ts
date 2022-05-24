import { ThreadImpl } from "./thread-impl";
import {
  Thread,
  ThreadManager,
  ThreadManagerDelegates,
} from "./thread-manager";

export class ThreadManagerImpl implements ThreadManager {
  private readonly threadsMap: Thread[] = [];

  private threadCount = 0;

  constructor(
    threadCount: number,
    private readonly delegates?: ThreadManagerDelegates,
  ) {
    this.setCount(threadCount);
  }

  public getCount() {
    return this.threadCount;
  }

  protected createThread() {
    return new ThreadImpl();
  }

  public isAnyRunning() {
    return this.threadsMap.find((r) => r.isRunning()) != null;
  }

  public setCount(count: number) {
    if (count <= 0) {
      throw new Error("There must be at least one thread.");
    }

    if (this.threadsMap.length <= count) {
      // Unmark killed threads
      for (let i = 0; i < this.threadsMap.length; i++) {
        this.threadsMap[i].markAsKilled(false);
      }
      // Initialize threads
      const insertCount = count - this.threadsMap.length;
      for (let i = 0; i < insertCount; i++) {
        const thread = this.createThread();
        this.threadsMap.push(thread);
        this.delegates?.onCreate?.(thread.getId());
      }
    } else {
      // We want to mark ready threads as killed first
      const threads = [...this.threadsMap].sort((a, b) =>
        a.isReady() === b.isReady() ? 0 : a.isReady() ? -1 : 1,
      );

      const killedThreads = [...this.threadsMap]
        .filter((r) => r.isKilled())
        .sort((a, b) =>
          a.isRunning() === b.isRunning() ? 0 : a.isRunning() ? -1 : 1,
        );

      const readyThreadsCount = this.threadsMap.length - killedThreads.length;

      for (let i = 0; i < count - killedThreads.length; i++) {
        threads[i].markAsKilled(true);
      }

      // Revive threads
      for (let i = 0; i < count - readyThreadsCount; i++) {
        killedThreads[i].markAsKilled(false);
      }
    }

    this.threadCount = count;
  }

  public getThread(id: string) {
    return this.threadsMap.find((r) => r.getId() === id);
  }

  public getAvailableThread<T>(data: T) {
    return this.threadsMap.find((r) => r.accept(data));
  }

  public flushThreads() {
    this.threadsMap.forEach((thread, index) => {
      if (thread.isKilled() && !thread.isRunning()) {
        this.delegates?.onDelete?.(thread.getId());
        this.threadsMap.splice(index, 1);
      }
    });
  }

  public getState() {
    return this.threadsMap;
  }
}
