export interface ThreadManager {
  /**
   * Returns the number of total usable threads.
   */
  getCount(): number;
  /**
   * Sets the number of total usable threads.
   */
  setCount(count: number): void;
  getThread(id: string): Thread | undefined;
  getAvailableThread<T>(data: T): Thread | undefined;
  /**
   * Removes non running threads marked as killed.
   */
  flushThreads(): void;
  isAnyRunning(): boolean;
  /**
   * Returns the current state. Can be used for debugging.
   */
  getState(): any;
}

export interface ThreadManagerDelegates {
  onCreate?: (threadId: string) => void;
  onDelete?: (threadId: string) => void;
}

export interface Thread {
  getId(): string;
  getStatus(): ThreadStatus;
  /**
   * If thread is marked as killed, then it won't accept new data, but waits until it has resolved. Then it is removed.
   */
  isKilled(): boolean;
  markAsKilled(killed: boolean): void;
  /**
   * Indicates that thread is ready and can accept any data.
   */
  isReady(): boolean;
  /**
   * Marks thread as ready. Throws error if in pending status.
   */
  markAsReady(): void;
  /**
   * Indicates that thread is ready and can accept certain or any data.
   */
  accept<T>(data: T): boolean;
  /**
   * Indicates that handler function is running.
   */
  isRunning(): boolean;
  execute<T, K>(data: ThreadData<T, K>): Promise<K | null>;
}

export interface ThreadData<T, K> {
  data: T;
  handler: (data: T) => Promise<K>;
  onFinish?: (err?: any, res?: K) => void;
}

export enum ThreadStatus {
  /**
   * Thread is initialized and is ready to accept data.
   */
  Ready,
  /**
   * Initialied with data. The handler function is executing and neither has it finished nor rejected.
   */
  Pending,
  /**
   * When the handler function has finished successfully.
   */
  Fulfilled,
  /**
   * When the handler function has finished and threw an error.
   */
  Rejected,
}
