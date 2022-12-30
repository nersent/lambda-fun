import { UnwrapPromise } from "src/utils/type-utils";
import { createTask } from "./tasks/task-factory";
import { ThreadScheduler } from "./threads/thread-scheduler";

export const threadify = <T extends (...args: any[]) => Promise<any>>(
  delegate: T,
  threadScheduler: ThreadScheduler<UnwrapPromise<ReturnType<T>>>,
): T => {
  const factory = async (...args: Parameters<T>) => {
    const task = createTask(() => delegate(...args));
    const res = await threadScheduler.run(task);
    return res as ReturnType<T>;
  };
  return factory as T;
};
