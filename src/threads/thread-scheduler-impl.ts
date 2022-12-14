import { TaskQueue, TaskQueueHandlerResponse } from "../tasks/task-queue-types";
import { Task } from "../tasks/task-types";
import { ThreadPool } from "./thread-pool-types";
import { TaskQueueImpl } from "../tasks/task-queue-impl";
import { ThreadScheduler } from "./thread-scheduler-types";

export class ThreadSchedulerImpl implements ThreadScheduler {
  private readonly taskQueue: TaskQueue;

  constructor(private readonly threadPool: ThreadPool) {
    this.taskQueue = new TaskQueueImpl({
      handleTask: this.queueTaskHandler.bind(this),
    });
  }

  public getThreadPool(): ThreadPool {
    return this.threadPool;
  }

  public getTaskQueue(): TaskQueue {
    return this.taskQueue;
  }

  private queueTaskHandler = (task: Task): TaskQueueHandlerResponse => {
    const thread = this.threadPool.getAvailableThread();
    if (thread == null) return { accepted: false };
    const threadManager = this.threadPool.getThreadManager();
    threadManager.reserveThread(thread, task.getHandle());
    return {
      accepted: true,
      resolver: () =>
        thread.run(task.getData()).then((threadRes) => {
          threadManager.releaseThread(thread);
          if ("error" in threadRes) throw threadRes.error;
          return threadRes.data;
        }),
    };
  };

  public schedule(data: any): Task {
    const task = this.taskQueue.enqueue(data);
    return task;
  }

  public run(): Promise<void> | void {
    return this.taskQueue.run();
  }
}
