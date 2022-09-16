import { QueueTaskContext } from "./queue-task-context";

export interface Queue {
  /**
   * Enqueues a single data and returns task id.
   */
  enqueue<T, K>(
    handler: (data: T, ctx: QueueTaskContext) => Promise<K>,
    data: T,
    opts?: QueueEnqueueOptions,
  ): string;

  /**
   * Enqueues an array of data and returns an array of ids in the corresponding order.
   */
  enqueueArray<T, K>(
    handler: (data: T, ctx: QueueTaskContext) => Promise<K>,
    items: T[],
  ): string[];
  /**
   * Returns a promise that will resolve when task is complete.
   */
  subscribe<T>(id: string, tick?: boolean): Promise<QueueResponse<T>>;
  /**
   * Cancels a task. You should implement cancel delegate it in the task handler.
   */
  cancel(id: string): void;
  /**
   * Processes the queue. You should at least call it once.
   */
  tick(): void;
}

export interface QueueEnqueueOptions {
  /**
   * If provided, the newly created task will have that id.
   */
  id?: string;
}

export enum QueueResponseStatus {
  Resolved,
  Canceled,
}

export interface QueueResponse<T> {
  data: T;
  status: QueueResponseStatus;
}
