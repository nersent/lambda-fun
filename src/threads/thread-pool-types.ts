import { IThread } from "./thread-types";

export interface IThreadPool {
  /**
   * Returns the number of total usable threads.
   */
  getPoolSize(): number;
  /**
   * Sets the number of total usable threads.
   */
  setPoolSize(count: number): Promise<void>;
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

export type ThreadPoolEventMap = {
  createThread: (id: string) => Promise<void> | void;
  deleteThread: (id: string) => Promise<void> | void;
};
