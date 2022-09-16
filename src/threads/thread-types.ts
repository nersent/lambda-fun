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
  addObserver(observer: Partial<ThreadManagerObserverMap>): void;
  removeObserver(observer: Partial<ThreadManagerObserverMap>): void;
}

export type ThreadManagerObserverMap = {
  onThreadCreate: (id: string) => Promise<void> | void;
  onThreadDelete: (id: string) => Promise<void> | void;
};

export interface IThread {
  getId(): string;
  getStatus(): ThreadStatus;
  setStatus(status: ThreadStatus): void;
  getExecutionStatus(): ThreadExecutionStatus;
  isExecuting(): boolean;
  isExecutable(): boolean;
  isValidForExecution(ctx: Record<string, any>): boolean;
  execute(ctx: ThreadExecutionContext): Promise<ThreadExecutionResponse>;
}

export interface ThreadExecutionContext {
  fn: (...args: any[]) => any;
}

export type ThreadExecutionResponse =
  | {
      data: any;
    }
  | {
      error: any;
    };

export enum ThreadStatus {
  Available,
  Killed,
}

export enum ThreadExecutionStatus {
  /**
   * Thread is initialized and is ready to accept data.
   */
  None,
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
