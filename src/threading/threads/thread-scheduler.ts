import { EventEmitter, EventRegistry } from "@nersent/event-emitter";

import { ITask } from "../tasks/task-types";

import { IThreadScheduler } from "./thread-scheduler-types";
import { IThread, ThreadExecutionContext } from "./thread-types";

export type ThreadSchedulerInternalEvents<T> = {
  tick: () => void;
  empty: () => void;
  resolve: (
    task: ITask<T, ThreadExecutionContext<T>>,
    error: any,
    data: T,
  ) => void;
};

export type ThreadSchedulerGetThreadDelegate<T> = (
  task: ITask<T, ThreadExecutionContext<T>>,
  threadScheduler: IThreadScheduler<T>,
) => IThread<T> | undefined;

export type ThreadSchedulerOnResolveDelegate<T> = (
  task: ITask<T, ThreadExecutionContext<T>>,
  thread: IThread<T>,
) => void;

/**
 * Implements FIFO-queue-based thread scheduler.
 */
export class ThreadScheduler<T = void> implements IThreadScheduler<T> {
  protected readonly internalEventRegistry = new EventRegistry<
    ThreadSchedulerInternalEvents<T>
  >();

  protected readonly internalEventEmitter = new EventEmitter<
    ThreadSchedulerInternalEvents<T>
  >(this.internalEventRegistry);

  private readonly taskQueue: ITask<T, ThreadExecutionContext<T>>[] = [];

  private readonly processedTasks = new Map<
    ITask<T, ThreadExecutionContext<T>>,
    IThread<T>
  >();

  private readonly processedThreads = new Map<
    IThread<T>,
    ITask<T, ThreadExecutionContext<T>>
  >();

  constructor(
    /**
     * Should return a thread if available and lock it for task processing or should return undefined if no thread is available.
     */
    private readonly getThreadDelegate: ThreadSchedulerGetThreadDelegate<T>,
    /**
     * Should release thread.
     */
    private readonly onResolveDelegate: ThreadSchedulerOnResolveDelegate<T>,
  ) {}

  protected enqueueTask(task: ITask<T, ThreadExecutionContext<T>>): void {
    this.taskQueue.push(task);
  }

  protected isEmpty(): boolean {
    return this.taskQueue.length === 0 && this.processedTasks.size === 0;
  }

  public getThreadByTask(task: ITask<T, ThreadExecutionContext<T>>) {
    return this.processedTasks.get(task);
  }

  public getTaskByThread(thread: IThread<T>) {
    return this.processedThreads.get(thread);
  }

  protected tick(): void {
    this.internalEventEmitter.emit("tick");

    if (this.isEmpty()) {
      this.internalEventEmitter.emit("tick");
      return;
    }

    const taskQueueCopy = [...this.taskQueue];

    for (const task of taskQueueCopy) {
      const taskIndex = this.taskQueue.indexOf(task);

      if (taskIndex === -1) {
        throw new Error("Task index is invalid");
      }

      const thread = this.getThreadDelegate(task, this);
      if (thread == null) break;

      this.taskQueue.splice(taskIndex, 1);
      this.processedTasks.set(task, thread);
      this.processedThreads.set(thread, task);
      this.handleTask(task);
    }
  }

  protected async handleTask(task: ITask<T, ThreadExecutionContext<T>>) {
    const thread = this.getThreadByTask(task);
    if (thread == null)
      throw new Error(`Thread for task ${task.getId()} is not found`);
    let res: any = undefined;
    let error: any = undefined;
    try {
      res = await thread.run(task);
    } catch (e) {
      error = e;
    }
    this.processedTasks.delete(task);
    this.processedThreads.delete(thread);
    this.onResolveDelegate(task, thread);
    this.internalEventEmitter.emit("resolve", task, error, res);
    this.tick();
  }

  protected waitForTaskToFinish(taskId: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const listener: ThreadSchedulerInternalEvents<T>["resolve"] = (
        task,
        error,
        data,
      ) => {
        if (task.getId() !== taskId) return;
        this.internalEventRegistry.removeListener("resolve", listener);
        if (error != null) return reject(error);
        return resolve(data);
      };

      this.internalEventRegistry.addListener("resolve", listener);
    });
  }

  public run(task: ITask<T, ThreadExecutionContext<T>>): Promise<T> {
    this.enqueueTask(task);
    const promise = this.waitForTaskToFinish(task.getId());
    this.tick();
    return promise;
  }
}
