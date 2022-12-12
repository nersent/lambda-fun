import { EventEmitter, EventRegistry } from "@nersent/event-emitter";

import { ThreadManager } from "./thread-manager-types";
import {
  ThreadPoolEvents,
  ThreadPool as IThreadPool,
} from "./thread-pool-types";
import { Thread, ThreadResponse, ThreadStatus } from "./thread-types";

export class ThreadPool
  extends EventRegistry<ThreadPoolEvents>
  implements IThreadPool
{
  protected readonly emitter = new EventEmitter<ThreadPoolEvents>(this);

  protected dirtyThreads = new Set<Thread>();

  private currentSize = 0;

  constructor(private readonly threadManager: ThreadManager) {
    super();
  }

  public getThreadManager(): ThreadManager {
    return this.threadManager;
  }

  protected getThreads() {
    return this.getThreadManager().getThreads();
  }

  protected getNonDirtyThreads(): Thread[] {
    return this.getThreads().filter((thread) => {
      return !this.dirtyThreads.has(thread);
    });
  }

  protected getDirtyThreads(): Thread[] {
    return [...this.dirtyThreads.values()];
  }

  protected getRunnableThreads(): Thread[] {
    const threads = this.getNonDirtyThreads();
    const aliveAndNonRunningThreads = threads.filter(
      (thread) => thread.isAlive() && !thread.isRunning(),
    );
    return aliveAndNonRunningThreads;
  }

  protected getRunningThreads(): Thread[] {
    return this.getThreads().filter((r) => r.isRunning());
  }

  public getSize(): number {
    return this.currentSize;
  }

  public async setSize(count: number): Promise<void> {
    const currentThreads = this.getThreads();

    const prevSize = this.currentSize;
    this.currentSize = count;
    const additionalSize = count - currentThreads.length;

    if (count == 0) {
      currentThreads.map((thread) => this.dirtyThreads.add(thread));
      this.emitter.emitAsync("resized", this.currentSize, prevSize);
      return;
    }

    if (currentThreads.length === count) {
      this.dirtyThreads.clear();
      return;
    }

    if (currentThreads.length < count) {
      this.dirtyThreads.clear();
      await this.threadManager.createThreads(additionalSize);
      this.emitter.emitAsync("resized", this.currentSize, prevSize);
      return;
    }

    this.dirtyThreads.clear();

    const runnableThreads = this.getRunnableThreads();
    const dirtyNonRunningThreads = runnableThreads.slice(0, additionalSize);

    const runningThreads = this.getRunningThreads();
    const dirtyRunningThreads = runningThreads.slice(
      dirtyNonRunningThreads.length,
      additionalSize,
    );

    const dirtyThreads = [...dirtyNonRunningThreads, ...dirtyRunningThreads];

    console.log(dirtyThreads);

    dirtyThreads.forEach((thread) => this.dirtyThreads.add(thread));

    this.emitter.emitAsync("resized", this.currentSize, prevSize);
  }

  protected isThreadDirty(id: number): boolean {
    const thread = this.getThreadManager().getThread(id);
    if (thread == null) {
      throw new Error(`Thread with id ${id} not found`);
    }
    return this.dirtyThreads.has(thread);
  }

  protected findRunnableThread(): Thread | undefined {
    const threads = this.getThreads();
    for (const thread of threads) {
      if (!thread.isAlive()) continue;
      if (thread.isRunning()) continue;
      if (this.dirtyThreads.has(thread)) continue;
      return thread;
    }
    return undefined;
  }

  public async run<T>(data: any): Promise<ThreadResponse<T> | undefined> {
    const thread = this.findRunnableThread();
    return thread?.run(data);
  }

  public async flush(): Promise<void> {
    const dirtyThreads = this.getDirtyThreads();
    await this.threadManager.deleteThreads(...dirtyThreads);
    await this.emitter.emitAsync("flushed", ...dirtyThreads);
  }
}
