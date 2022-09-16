export interface Queue {
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
  pause(ids: string | string[], reason?: any): Promise<void>;
  /**
   * Resumes one or multiple tasks.
   */
  resume(ids: string | string[], reason?: any): Promise<void>;
  /**
   * Cancels one or multiple tasks.
   */
  cancel(ids: string | string[], reason?: any): Promise<void>;
  /**
   * Processes the queue. You should at least call it once.
   */
  tick(): void;
  addObserver(map: Partial<QueueObserverMap>): void;
  removeObserver(map: Partial<QueueObserverMap>): void;
}

export type QueueObserverMap = {
  onEnqueue: (ctx: QueueExecutionContext) => Promise<void> | void;
  onPause: (id: string, reason?: any) => Promise<void> | void;
  onResume: (id: string, reason?: any) => Promise<void> | void;
  onCancel: (id: string, reason?: any) => Promise<void> | void;
  onResolve: (e: QueueResolveEvent<any>) => Promise<void> | void;
  /**
   * Called when the queue is empty and there is no more items to process.
   */
  onFinish: () => void;
};

export type QueueResolveEvent<T> =
  | { contextId: string; queue: Queue } & (
      | {
          data: T;
        }
      | {
          error?: any;
        }
      | {
          isCanceled: boolean;
          cancelReason: QueueCancelReason;
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

export interface QueueExecutionContext {
  id: string;
  threadId: string;
}

export interface QueueEnqueueOptions {
  /**
   * If provided, the newly created task will have that id.
   */
  id?: string;
}
