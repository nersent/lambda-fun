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
