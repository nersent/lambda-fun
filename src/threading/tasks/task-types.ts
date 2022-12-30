import { ICancelToken } from "../../lifecycle/cancel-token-types";

export type TaskDelegate<T, C extends Record<string, any>> = (
  ctx: TaskExecutionContext<C>,
) => TaskResult<T>;

export type TaskResult<T> = Promise<T> | T;

/**
 * Task is a wrapper around a delegate function and optionally metadata.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ITask<T, C extends Record<string, any>> {
  getId(): string;
  // getCancellationToken()?:
  getStatus(): TaskStatus;
  getDelegate(): TaskDelegate<T, C>;
  getMetadata<M>(): M | undefined;
  setMetadata<M>(metadata?: M): ITask<T, C>;
  /**
   * Runs task. You should not call this method directly if you are using a thread pool/thread scheduler.
   */
  run(ctx?: C): Promise<T>;
  setCancelToken(token: ICancelToken): ITask<T, C>;
  getCancelToken(): ICancelToken | undefined;
}

export enum TaskStatus {
  None,
  Pending,
  Fulfilled,
  Rejected,
  Cancelled,
}

export type TaskExecutionContext<C extends Record<string, any>> = {
  taskId: string;
  taskMetadata?: any;
  cancelToken?: ICancelToken;
} & C;
