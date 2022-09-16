import { ObserverManager } from "../utils/observer-manager";
import { Thread } from "./thread";
import {
  IThread,
  IThreadManager,
  ThreadManagerObserverMap,
  ThreadStatus,
} from "./thread-types";

export class ThreadManager implements IThreadManager {
  private observerManager = new ObserverManager<ThreadManagerObserverMap>();

  private threadMap = new Map<string, IThread>();

  private _threadCount = 0;

  private get _threadMapCount() {
    return this.threadMap.size;
  }

  private get _threads() {
    return [...this.threadMap.values()];
  }

  public getThreads(): IThread[] {
    return this._threads;
  }

  public getThread(id: string): IThread | undefined {
    return this.threadMap.get(id);
  }

  public findExecutableThread(ctx: Record<string, any>): IThread | undefined {
    return this._threads.find((r) => r.isValidForExecution(ctx));
  }

  public addObserver(map: Partial<ThreadManagerObserverMap>) {
    this.observerManager.addFromMap(map);
  }

  public removeObserver(map: Partial<ThreadManagerObserverMap>) {
    this.observerManager.removeFromMap(map);
  }

  public getThreadsCount(): number {
    return this._threadCount;
  }

  public async setThreadsCount(count: number) {
    if (this._threadMapCount === count) {
      this._threads.map((r) => r.setStatus(ThreadStatus.Available));
    } else if (this._threadMapCount < count) {
      // Unmark killed threads
      this._threads.map((r) => r.setStatus(ThreadStatus.Available));
      // Initialize threads
      const additionalThreadsCount = count - this._threadMapCount;

      await Promise.all(
        Array.from({ length: additionalThreadsCount }).map(() => {
          this.createThread();
        }),
      );
    } else if (count === 0) {
      this._threads.map((r) => r.setStatus(ThreadStatus.Killed));
    } else {
      this._threads.map((r) => r.setStatus(ThreadStatus.Available));

      const executableThreads = this._threads.filter((r) => r.isExecutable());
      const executingThreads = this._threads.filter((r) => r.isExecuting());

      const killedExecutableThreads = executableThreads.slice(
        0,
        this._threads.length - count,
      );

      const killedExecutingThreads = executingThreads.slice(
        killedExecutableThreads.length,
        this._threads.length - count,
      );

      const killedThreads = [
        ...killedExecutableThreads,
        ...killedExecutingThreads,
      ];

      killedThreads.forEach((r) => r.setStatus(ThreadStatus.Killed));
    }

    this._threadCount = count;
  }

  public async createThread(): Promise<IThread> {
    const thread = new Thread();
    await this.observerManager.emitAsync("onThreadCreate", thread.getId());
    this.threadMap.set(thread.getId(), thread);
    return thread;
  }

  public async deleteThread(id: string) {
    await this.observerManager.emitAsync("onThreadDelete", id);
    this.threadMap.delete(id);
  }

  public async flush() {
    const threads = this._threads.filter((thread) => {
      return (
        thread.getStatus() === ThreadStatus.Killed && !thread.isExecuting()
      );
    });

    await Promise.all(
      threads.map((thread) => this.deleteThread(thread.getId())),
    );
  }
}
