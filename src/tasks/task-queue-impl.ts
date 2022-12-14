import { EventEmitter, EventRegistry } from "@nersent/event-emitter";
import { makeId } from "../utils/string";
import { TaskImpl } from "./task-impl";
import {
  TaskQueue as ITaskQueue,
  TaskQueueEvents,
  TaskQueueHandler,
} from "./task-queue-types";
import { Task, TaskResponse } from "./task-types";

export interface TaskQueueImplDelegates {
  handleTask: TaskQueueHandler;
}

type TaskQueueInternalEvents = {
  resolve: (res: TaskResponse) => void;
};

export class TaskQueueImpl
  extends EventRegistry<TaskQueueEvents>
  implements ITaskQueue
{
  protected readonly emitter = new EventEmitter<TaskQueueEvents>(this);

  protected readonly internalEventRegistry =
    new EventRegistry<TaskQueueInternalEvents>();

  protected readonly internalEventEmitter =
    new EventEmitter<TaskQueueInternalEvents>(this.internalEventRegistry);

  private readonly taskQueue: Task[] = [];

  private readonly processedTasks: Task[] = [];

  private _isLocked = false;

  constructor(private readonly delegates: TaskQueueImplDelegates) {
    super();
  }

  public lock() {
    this._isLocked = true;
  }

  public unlock() {
    this._isLocked = false;
  }

  public isLocked() {
    return this._isLocked;
  }

  protected removeTaskFromQueues(task: Task) {
    let taskIndex = this.taskQueue.indexOf(task);
    if (taskIndex !== -1) {
      this.taskQueue.splice(taskIndex, 1);
      return;
    }
    taskIndex = this.processedTasks.indexOf(task);
    if (taskIndex !== -1) {
      this.processedTasks.splice(taskIndex, 1);
    }
  }

  protected createTask(data: any) {
    const handle = makeId();

    const task: Task = new TaskImpl(handle, data, {
      isRunning: () => {
        return this.processedTasks.includes(task);
      },
      isResolved: () => {
        return (
          !this.processedTasks.includes(task) && !this.taskQueue.includes(task)
        );
      },
      waitToResolve: () => {
        return new Promise<any>((resolve) => {
          const listener = (res: TaskResponse) => {
            if (res.task !== task) return;
            this.internalEventRegistry.removeListener("resolve", listener);
            resolve(res);
          };

          this.internalEventRegistry.addListener("resolve", listener);
          this.tick();
        });
      },
    });

    return task;
  }

  public enqueue(data: any): Task {
    const task = this.createTask(data);
    this.taskQueue.push(task);
    return task;
  }

  public getTasks(): Task[] {
    return [...this.taskQueue, ...this.processedTasks];
  }

  public isBusy() {
    return this.processedTasks.length > 0;
  }

  public tick() {
    this.emitter.emit("tick");

    if (this.isLocked()) {
      return;
    }

    if (this.taskQueue.length === 0) {
      this.emitter.emit("empty");
      return;
    }

    const taskQueueCopy = [...this.taskQueue];

    for (const task of taskQueueCopy) {
      const taskIndex = this.taskQueue.indexOf(task);

      if (taskIndex === -1) {
        throw new Error("Task index is invalid");
      }

      const handlerRes = this.delegates.handleTask(task);
      if (!handlerRes.accepted) break;

      this.taskQueue.splice(taskIndex, 1);
      this.processedTasks.push(task);

      this.processTask(task, handlerRes.resolver);

      if (this.isLocked()) {
        break;
      }
    }
  }

  protected async processTask(
    task: Task,
    resolver: (...args: any[]) => Promise<any> | any,
  ) {
    this.emitter.emit("process", task);
    let taskRes: TaskResponse | undefined = undefined;
    try {
      const data = await resolver();
      taskRes = { data, task };
    } catch (error) {
      taskRes = { error, task };
      throw error;
    } finally {
      if (taskRes == null) {
        throw new Error("Task response is invalid");
      }
      const processQueueIndex = this.processedTasks.indexOf(task);
      this.processedTasks.splice(processQueueIndex, 1);
      await this.emitter.emitAsync("resolve", taskRes);
      await this.internalEventEmitter.emitAsync("resolve", taskRes);
      this.tick();
    }
  }

  public run() {
    if (!this.isBusy()) return;
    return new Promise<void>((resolve) => {
      this.once("empty", () => resolve());
      this.tick();
    });
  }
}
