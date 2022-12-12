export enum ThreadStatus {
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

export interface Thread {
  getId(): number;
  getStatus(): ThreadStatus;
  isInitialized(): boolean;
  isAlive(): boolean;
  isRunning(): boolean;
  initialize(): Promise<void>;
  run<T>(data: any): Promise<ThreadResponse<T>>;
  kill: () => Promise<void>;
}

export type ThreadResponse<T> =
  | {
      data: T;
    }
  | {
      error: any;
    };
