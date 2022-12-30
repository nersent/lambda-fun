import { createTask } from "./tasks/task-factory";
import { ThreadScheduler } from "./threads/thread-scheduler";
import { createThreadScheduler } from "./threads/thread-scheduler-factory";

export const threadify = <T extends (...args: any[]) => Promise<any>>(
  delegate: T,
  threadScheduler: ThreadScheduler<ReturnType<T>>,
): T => {
  const factory = async (...args: Parameters<T>) => {
    const task = createTask(() => delegate(...args));
    const res = await threadScheduler.run(task);
    return res as ReturnType<T>;
  };
  return factory as T;
};
