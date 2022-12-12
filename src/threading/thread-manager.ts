import { EventEmitter, EventRegistry } from "@nersent/event-emitter";
import {
  ThreadManagerEvents,
  ThreadManager as IThreadManager,
} from "./thread-manager-types";
import { Thread } from "./thread-types";

export class ThreadManager
  extends EventRegistry<ThreadManagerEvents>
  implements IThreadManager
{
  protected readonly emitter = new EventEmitter<ThreadManagerEvents>(this);

  protected threads = new Map<number, Thread>();

  protected killedTreads = new Set<number>();

  constructor(
    private readonly createThreadsDelegate: (
      count: number,
    ) => Promise<Thread[]> | Thread[],
  ) {
    super();
  }

  public getThreads(): Thread[] {
    return [...this.threads.values()];
  }

  public getThread(threadId: number): Thread | undefined {
    return this.threads.get(threadId);
  }

  public hasThread(threadId: number): boolean {
    return this.threads.has(threadId);
  }

  public async createThreads(count: number = 1): Promise<Thread[]> {
    const threads = await this.createThreadsDelegate(count);
    for (const thread of threads) {
      this.threads.set(thread.getId(), thread);
    }
    await this.emitter.emitAsync("createdThreads", ...threads);
    return threads;
  }

  public async deleteThreads(...threadIds: (number | Thread)[]): Promise<void> {
    const threads: Thread[] = [];
    for (const threadId of threadIds) {
      if (typeof threadId !== "number") {
        threads.push(threadId);
        continue;
      }

      const thread = this.getThread(threadId);
      if (thread == null) {
        throw new Error(`Thread ${threadId} does not exist.`);
      }
      threads.push(thread);
    }
    await Promise.all(threads.map((thread) => thread.kill()));
    await this.emitter.emitAsync("deletedThreads", ...threads);
    for (const thread of threads) {
      this.threads.delete(thread.getId());
    }
  }

  public async clear(): Promise<void> {
    const threads = [...this.threads.values()];
    await Promise.all(threads.map((thread) => thread.kill()));
    await this.emitter.emitAsync("killedThreads", ...threads);
    this.threads.clear();
  }
}
