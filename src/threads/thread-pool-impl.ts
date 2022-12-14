import { EventEmitter, EventRegistry } from "@nersent/event-emitter";

import { ThreadManager } from "./thread-manager-types";
import { ThreadPool, ThreadPoolEvents } from "./thread-pool-types";
import { Thread } from "./thread-types";

export class ThreadPoolImpl
  extends EventRegistry<ThreadPoolEvents>
  implements ThreadPool
{
  protected readonly emitter = new EventEmitter<ThreadPoolEvents>(this);

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

  public getSize(): number {
    return this.currentSize;
  }

  private getAliveThreads() {
    return this.getThreads().filter((thread) => thread.isAlive());
  }

  public async resize(count: number): Promise<void> {
    const currentAliveThreads = this.getAliveThreads();

    if (currentAliveThreads.length === count) return;

    const prevSize = this.currentSize;
    this.currentSize = count;

    if (count <= 0) {
      await Promise.all(currentAliveThreads.map((thread) => thread.kill()));
      await this.threadManager.deleteThreads(...currentAliveThreads);
      this.emitter.emitAsync("resized", this.currentSize, prevSize);
      return;
    }

    if (currentAliveThreads.length < count) {
      const additionalSize = count - currentAliveThreads.length;
      const additionalThreads = await this.threadManager.createThreads(
        additionalSize,
      );
      await Promise.all(additionalThreads.map((thread) => thread.initialize()));
      this.emitter.emitAsync("resized", this.currentSize, prevSize);
      return;
    }

    const removalSize = currentAliveThreads.length - count;

    const threadsToKill = currentAliveThreads.slice(0, removalSize);

    await Promise.all(threadsToKill.map((thread) => thread.kill()));
    await this.threadManager.deleteThreads(...threadsToKill);

    this.emitter.emitAsync("resized", this.currentSize, prevSize);
  }

  public getAvailableThread(): Thread | undefined {
    const threads = this.getThreads();
    for (const thread of threads) {
      if (this.threadManager.isThreadReserved(thread)) continue;
      if (!thread.isAlive()) continue;
      if (thread.isRunning()) continue;
      return thread;
    }
    return undefined;
  }
}
