import {
  AsyncQueueEntry,
  AsyncQueueProcessedEntry,
} from "src/queue/async-queue-types";

import { AsyncQueue } from "../queue/async-queue";

import { ThreadPool as IThreadPool } from "./thread-pool-types";
import { ThreadPool } from "./thread-pool";
import {
  ThreadScheduler as IThreadScheduler,
  TaskHandle,
} from "./thread-scheduler-types";
import { Thread } from "./thread-types";
import { TaskController } from "./task-controller-types";

interface TaskQueueProcessedEntry extends AsyncQueueProcessedEntry {
  thread: Thread;
}

export class ThreadScheduler implements IThreadScheduler {
  private readonly taskQueue: AsyncQueue;

  constructor(private readonly threadPool: IThreadPool) {
    this.taskQueue = new AsyncQueue({
      acceptEntry: this.acceptQueueTask.bind(this),
      processEntry: this.processQueueTask.bind(this),
    });
  }

  public getThreadPool(): IThreadPool {
    return this.threadPool;
  }

  public getTasks() {
    return null as any;
  }

  private acceptQueueTask(
    entry: AsyncQueueEntry,
  ): boolean | Partial<TaskQueueProcessedEntry> {
    const thread = this.threadPool.getAvailableThread();
    if (thread == null) return false;
    this.threadPool.getThreadManager().reserveThread(thread, entry.id);
    return { thread };
  }

  private async processQueueTask(entry: AsyncQueueProcessedEntry) {
    const { thread } = entry as TaskQueueProcessedEntry;
    await thread.run(entry.data);
    this.threadPool.getThreadManager().releaseThread(thread);
  }

  public schedule(data: any, run = true): TaskHandle {
    const handle = this.taskQueue.enqueue(data);
    if (run) this.run();
    return handle;
  }

  public createTaskController(handle: string): TaskController {
    return null as any;
  }

  public run(): Promise<void> | void {
    if (!this.taskQueue.isBusy()) return;
    return new Promise<void>((resolve) => {
      this.taskQueue.once("empty", () => resolve());
      this.taskQueue.tick();
    });
  }
}
