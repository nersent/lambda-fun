import { EventRegistryBase } from "@nersent/event-emitter";

import { ThreadManager } from "./thread-manager-types";
import { Thread, ThreadResponse } from "./thread-types";

export type ThreadPoolEvents = {
  resized: (currentSize: number, prevSize: number) => Promise<void> | void;
  flushed: (...threads: Thread[]) => Promise<void> | void;
};

export type ThreadPoolEventRegistry = EventRegistryBase<ThreadPoolEvents>;

/**
 * Manages a pool of threads.
 */
export interface ThreadPool extends ThreadPoolEventRegistry {
  getThreadManager(): ThreadManager;
  /**
   * Returns the number of total usable threads.
   */
  getSize(): number;
  /**
   * Creates or destroys threads to match the given size, then initializes them.
   */
  resize(count: number): Promise<void>;
  getAvailableThread(): Thread | undefined;
}
