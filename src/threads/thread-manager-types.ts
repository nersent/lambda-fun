import { IThread } from "./thread-types";

export interface IThreadManager {
  /**
   * Returns the number of total usable threads.
   */
  getThreadsCount(): number;
  /**
   * Sets the number of total usable threads.
   */
  setThreadsCount(count: number): Promise<void>;
  getThreads(): IThread[];
  getThread(id: string): IThread | undefined;
  createThread(): Promise<IThread> | IThread;
  deleteThread(id: string): Promise<void> | void;
  /**
   * Returns a thread that can be executed.
   */
  findExecutableThread(ctx: Record<string, any>): IThread | undefined;
  /**
   * Removes non running threads marked with killed status.
   */
  flush(): Promise<void>;
}

export type ThreadManagerEventMap = {
  createThread: (id: string) => Promise<void> | void;
  deleteThread: (id: string) => Promise<void> | void;
};
