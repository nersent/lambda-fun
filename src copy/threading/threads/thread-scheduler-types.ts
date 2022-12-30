import { ITask } from "../tasks/task-types";

import { IThread, ThreadExecutionContext } from "./thread-types";

/**
 * Schedules tasks to threads
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IThreadScheduler<T> {
  getThreadByTask(
    task: ITask<T, ThreadExecutionContext<T>>,
  ): IThread<T> | undefined;
  getTaskByThread(
    thread: IThread<T>,
  ): ITask<T, ThreadExecutionContext<T>> | undefined;
  /**
   * Schedules a task and returns a promise that resolves when task is completed.
   */
  run(task: ITask<T, ThreadExecutionContext<T>>): Promise<T>;
}
