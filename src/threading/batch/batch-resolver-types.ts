import { ITask } from "../tasks/task-types";

// eslint-disable-next-line @typescript-eslint/naming-convention
/**
 * Resolves tasks in batches.
 */
export interface IBatchResolver<T> {
  getBatchSize(): number;
  enqueue(task: ITask<T, any>): void;
  getTasks(): ITask<T, any>[];
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IBatch<T> {
  getTasks(): ITask<T, any>[];
  getBatchResolver(): IBatchResolver<T>;
  getFailedTasks(): ITask<T, any>[];
  getSuccessfulTasks(): ITask<T, any>[];
}
