import { ResizableThreadPool } from "./resizable-thread-pool";
import { createThread } from "./thread-factory";
import { ThreadScheduler } from "./thread-scheduler";

export const createThreadScheduler = async <T>(poolSize: number) => {
  const threadPool = new ResizableThreadPool<T>(() => createThread());
  await threadPool.resize(poolSize);

  const threadScheduler = new ThreadScheduler<T>(
    (task, scheduler) => threadPool.getRunnableThread()?.lock(scheduler),
    (task, thread) => thread.unlock(),
  );

  return threadScheduler;
};
