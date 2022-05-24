import { Thread } from "../threads/thread-manager";
import { QueueTaskCancelController } from "./queue-task-cancel-controller";

export interface QueueTaskContextDelegates {
  // cancel: () =>
  // onCancel?: () => Promise<void> | void;
  // /**
  //  * This method is provided only if you called onCancel previously and have callback cancel strategy.
  //  */
  // readonly markAsCanceled?: (err?: any, data?: any) => void;
  // readonly setCancelStrategy: (strategy: QueueTaskCancelStrategy) => void;
  // readonly getThreadId: () => string;
}

export class QueueTaskContext {
  // private isCanceled = false;

  // private cancelStrategy: QueueTaskCancelStrategy =
  //   QueueTaskCancelStrategy.WaitUntilResolved;

  // private cancelHandler?: () => Promise<void> | void;

  // public readonly cancelController = new QueueTaskCancelController();

  constructor(
    private readonly id: string,
    private readonly thread: Thread,
    public readonly cancelController: QueueTaskCancelController,
    private readonly delegates: QueueTaskContextDelegates,
  ) {}

  public getId() {
    return this.id;
  }

  public getThreadId() {
    return this.thread.getId();
  }

  // public setCancelStrategy(strategy: QueueTaskCancelStrategy) {
  //   if (this.isCanceled) {
  //     throw new Error("Can't set cancel strategy, because task was canceled.");
  //   }
  //   this.cancelStrategy = strategy;
  // }

  // public getCancelStrategy() {
  //   return this.cancelStrategy;
  // }
}
