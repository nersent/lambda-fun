import { EventRegistryBase } from "@nersent/event-emitter";

import { Thread } from "./thread-types";

export type ThreadManagerEvents = {
  createdThreads: (...threads: Thread[]) => Promise<void> | void;
  deletedThreads: (...threads: Thread[]) => Promise<void> | void;
  killedThreads: (...threads: Thread[]) => Promise<void> | void;
};

export type ThreadManagerEventRegistry = EventRegistryBase<ThreadManagerEvents>;

/**
 * Manages the creation and deletion of threads.
 */
export interface ThreadManager extends ThreadManagerEventRegistry {
  getThreads(): Thread[];
  getThread(threadId: number): Thread | undefined;
  hasThread(threadId: number): boolean;
  createThreads(count?: number): Promise<Thread[]>;
  deleteThreads(...threadIds: (number | Thread)[]): Promise<void>;
  /**
   * Kills and deletes all threads.
   */
  clear(): Promise<void>;
}
