import { TaskQueue } from "./task-queue-types";
import { Task, TaskResponse } from "./task-types";

export interface TaskTimeThrottlerOptions {
  time: number;
  count: number;
}

export class TaskTimeThrottler {
  private taskBatch: Task[] = [];

  private batchOldestResolvedTime: number | undefined = undefined;

  private timeout: NodeJS.Timeout | undefined = undefined;

  private _isInitialized = false;

  constructor(
    private readonly taskQueue: TaskQueue,
    private readonly options: TaskTimeThrottlerOptions,
  ) {}

  protected addListeners() {
    this.taskQueue.addListener("resolve", this.onTaskQueueResolve.bind(this));
    this.taskQueue.addListener("process", this.onTaskQueueProcess.bind(this));
    this.taskQueue.addListener("tick", this.onTaskQueueTick.bind(this));
  }

  protected removeListeners() {
    this.taskQueue.removeListener(
      "resolve",
      this.onTaskQueueResolve.bind(this),
    );
    this.taskQueue.removeListener(
      "process",
      this.onTaskQueueProcess.bind(this),
    );
    this.taskQueue.removeListener("tick", this.onTaskQueueTick.bind(this));
  }

  public init() {
    if (this._isInitialized) {
      throw new Error("TaskTimeThrottler is already initialized");
    }

    this._isInitialized = true;
    this.addListeners();
  }

  public destroy() {
    if (!this._isInitialized) {
      throw new Error("TaskTimeThrottler is not initialized");
    }

    this._isInitialized = false;
    this.removeListeners();
  }

  public isInitialized() {
    return this._isInitialized;
  }

  protected isFull() {
    return this.taskBatch.length >= this.options.count;
  }

  protected onTaskQueueResolve(res: TaskResponse) {
    const batchTask = this.taskBatch.find((r) => r === res.task);
    if (batchTask == null) {
      throw new Error("Task is not in batch");
    }
    const resolveTime = Date.now();
    if (
      this.batchOldestResolvedTime == null ||
      resolveTime > this.batchOldestResolvedTime
    ) {
      this.batchOldestResolvedTime = resolveTime;
    }
  }

  protected onTaskQueueProcess(task: Task) {
    // console.log("[throttler] onTaskQueueProcess");
    this.taskBatch.push(task);

    if (this.isFull()) {
      this.taskQueue.lock();
    }
  }

  protected onTaskQueueTick() {
    // console.log(`[throttler] task queue tick`);

    if (this.isFull()) {
      clearTimeout(this.timeout);

      const canProceed = this.freeBatch();
      // console.log(canProceed);

      if (!canProceed) {
        this.taskQueue.lock();

        if (this.batchOldestResolvedTime != null) {
          const now = Date.now();
          const delta = this.batchOldestResolvedTime + this.options.time - now;
          if (delta > 0) {
            this.timeout = setTimeout(() => {
              // console.log("[throttler] timeout");
              this.taskQueue.tick();
            }, delta);
          }
        }
      } else {
        this.batchOldestResolvedTime = undefined;
        this.taskQueue.unlock();
      }
    }
  }

  protected freeBatch(now: number = Date.now()) {
    // console.log("[request throttler] free batch");

    if (this.taskBatch.length === 0) {
      return true;
    }

    const resolvedTasks = this.taskBatch.filter((task) => task.isResolved());
    if (resolvedTasks.length === 0) return false;

    // console.log(this.taskBatch.map((r) => ({ r, isResolved: r.isResolved() })));
    // console.log(this.taskBatch.length, resolvedTasks.length);
    if (this.taskBatch.length === resolvedTasks.length) {
      if (this.batchOldestResolvedTime == null) {
        throw new Error("Batch oldest resolved time is not set");
      }

      const delta = now - this.batchOldestResolvedTime;

      if (delta >= this.options.time) {
        this.taskBatch = [];
        this.batchOldestResolvedTime = undefined;
        return true;
      }
    }

    return false;
  }
}
