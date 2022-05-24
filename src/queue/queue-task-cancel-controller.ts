export enum QueueTaskCancelStrategy {
  /**
   * Function would be resolved once the handler is resolved.
   */
  WaitUntilResolved,
  /**
   * Function would be resolved once the markAsCancel is called.
   */
  Callback,
}

export interface QueueTaskCancelControllerDelegates {
  onCancel: (err: any | undefined, taskId: string) => void;
}

export type QueueTaskCancelHandler = (
  resolve: () => void,
  reject: (err: any) => void,
) => Promise<void> | void;

export class QueueTaskCancelController {
  private _isCanceled = false;

  private strategy: QueueTaskCancelStrategy =
    QueueTaskCancelStrategy.WaitUntilResolved;

  private handler?: QueueTaskCancelHandler;

  constructor(
    private readonly taskId: string,
    private readonly delegates: QueueTaskCancelControllerDelegates,
  ) {}

  public setStrategy(strategy: QueueTaskCancelStrategy) {
    if (this._isCanceled) {
      throw new Error("Can't set cancel strategy, because task was canceled.");
    }
    this.strategy = strategy;
  }

  public getStrategy() {
    return this.strategy;
  }

  public isCanceled() {
    return this._isCanceled;
  }

  public setHandler(fn: QueueTaskCancelHandler) {
    if (this._isCanceled) {
      throw new Error("Can't set cancel handler, because task was canceled.");
    }
    if (this.strategy !== QueueTaskCancelStrategy.Callback) {
      throw new Error(
        "Can't set cancel handler, because current cancel strategy is not callback. You can set it using `setCancelStrategy` method.",
      );
    }
    this.handler = fn;
  }

  public cancel() {
    if (this._isCanceled) {
      throw new Error(`Task ${this.taskId} is already canceled`);
    }

    this._isCanceled = true;

    if (this.strategy === QueueTaskCancelStrategy.Callback) {
      if (this.handler == null) {
        throw new Error(
          `Cancel delegate not implemented for task ${this.taskId}`,
        );
      }

      this.handler(this.callOnCancelDelegate, this.callOnCancelDelegate);
    }
  }

  private callOnCancelDelegate = (err?: any) => {
    this.delegates.onCancel(err, this.taskId);
  };
}
