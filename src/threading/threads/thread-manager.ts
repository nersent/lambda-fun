import { IThreadManager } from "./thread-manager-types";
import { IThread } from "./thread-types";

export class ThreadManager<T> implements IThreadManager<T> {
  private threadMap = new Map<string, IThread<T>>();

  public getAll(): IThread<T>[] {
    return [...this.threadMap.values()];
  }

  public get(threadId: string): IThread<T> | undefined {
    return this.threadMap.get(threadId);
  }

  public add(thread: IThread<T>): IThreadManager<T> {
    this.threadMap.set(thread.getId(), thread);
    return this;
  }

  public remove(thread: IThread<T>): IThreadManager<T> {
    const threadId = thread.getId();
    if (!this.threadMap.has(threadId)) {
      throw new Error(`Thread ${threadId} does not exist.`);
    }
    this.threadMap.delete(threadId);
    return this;
  }

  public async killAll(): Promise<void> {
    await Promise.all(this.getAll().map((thread) => thread.kill()));
    this.threadMap.clear();
  }

  public getRunnableThread(): IThread<T> | undefined {
    return this.getAll().find((r) => r.canRun());
  }
}
