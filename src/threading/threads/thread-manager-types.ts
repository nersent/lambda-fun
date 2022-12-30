import { IThread } from "./thread-types";

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IThreadManager<T = void> {
  getAll(): IThread<T>[];
  get(threadId: string): IThread<T> | undefined;
  add(thread: IThread<T>): IThreadManager<T>;
  remove(thread: IThread<T>): IThreadManager<T>;
  getRunnableThread(): IThread<T> | undefined;
  /**
   * Kills all threads and removes them.
   */
  killAll(): Promise<void>;
}
