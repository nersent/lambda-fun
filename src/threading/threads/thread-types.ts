import { ITask, TaskResult } from "../tasks/task-types";

/**
 * Thread is a single unit of work that processes tasks.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IThread<T = void> {
  getId(): string;
  /**
   * Initializes thread.
   */
  initialize(): Promise<void> | void;
  isInitialized(): boolean;
  /**
   * Indicates that thread is initialized and not kilpled.
   */
  isAlive(): boolean;
  /**
   * Indicates that thread is currently processing a task.
   */
  isRunning(): boolean;
  canRun(): boolean;
  /**
   * Returns currently processed task or undefined if no task is being processed.
   */
  getTask(): ITask<T, ThreadExecutionContext<T>> | undefined;
  getMetadata<M>(): M | undefined;
  setMetadata<M>(metadata?: M): IThread<T>;
  /**
   * Processes task.
   */
  run(task: ITask<T, ThreadExecutionContext<T>>): Promise<T>;
  /**
   * Kills thread.
   */
  kill: () => Promise<void> | void;
  /**
   * Locks thread.
   */
  lock: <L>(handle?: L) => IThread<T>;
  unlock: () => IThread<T>;
  isLocked: () => boolean;
  getLockHandle: <L>() => L | undefined;
}

export type ThreadResponse<T> =
  | {
      data: T;
    }
  | {
      error: any;
    };

export type ThreadExecutionContext<T> = {
  thread: IThread<T>;
};
