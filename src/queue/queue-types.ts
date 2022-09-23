export interface IQueue {
  /**
   * Enqueues single function and returns the handle.
   */
  enqueue(
    data: any,
    // fn: (ctx: QueueExecutionContext) => Promise<any>,
    opts?: QueueEnqueueOptions,
  ): string;
  // /**
  //  * Enqueues an array of functions and returns an array of ids in the corresponding order.
  //  */
  // enqueueMany(...[fn: ((ctx: QueueExecutionContext) => Promise<any>)[]): string[];
  /**
   * Pauses one or multiple tasks. It does not pause running tasks.
   */
  pause(ids: string | string[], reason?: QueuePauseReason): Promise<void>;
  /**
   * Resumes one or multiple tasks.
   */
  resume(ids: string | string[], first?: boolean): Promise<void>;
  /**
   * Cancels one or multiple tasks.
   */
  cancel(ids: string | string[], reason?: QueueCancelReason): Promise<void>;
  /**
   * Processes the queue. You should at least call it once.
   */
  tick(): void;
  clear(): void;
  exists(id: string): boolean;
}

export type QueueEventMap = {
  enqueue: (data: any) => Promise<void> | void;
  pause: (id: string, reason?: QueuePauseReason) => Promise<void> | void;
  resume: (id: string) => Promise<void> | void;
  cancel: (id: string, reason?: QueueCancelReason) => Promise<void> | void;
  resolve: (e: QueueResolveEvent<any>) => Promise<void> | void;
  /**
   * Called when the queue is empty and there is no more items to process.
   */
  finish: () => void;
};

export type QueueResolveEvent<T> =
  | { id: string; queue: IQueue; isCanceled: boolean } & (
      | {
          data: T;
        }
      | {
          error?: any;
        }
      | {
          isCanceled: true;
          cancelReason: QueueCancelReason;
          error?: any;
        }
    );

export class QueueCancelReason<T = any> extends Error {
  public readonly reason: T | undefined;

  constructor(message: string, reason?: T) {
    super(message);
    this.reason = reason;
    Object.setPrototypeOf(this, QueueCancelReason.prototype);
  }
}

export class QueuePauseReason<T = any> extends QueueCancelReason<T> {}

export interface QueueExecutionContext {
  id: string;
  threadId: string;
}

export interface QueueEnqueueOptions {
  /**
   * If provided, the newly created task will have that id.
   */
  id?: string;
  first?: boolean;
  isPaused?: boolean;
}
