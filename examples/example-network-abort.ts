import axios, { CancelTokenSource } from "axios";
import {
  CancelReason,
  createThreadManager,
  Task,
  ThreadPoolImpl,
  ThreadSchedulerImpl,
} from "../src";

interface ExampleEntry {
  url: string;
  cancelTokenSource: CancelTokenSource;
}

const EXAMPLE_ENTRIES: ExampleEntry[] = [
  ...Array.from({ length: 10 }).map(
    () => "http://ipv4.download.thinkbroadband.com/5MB.zip",
  ),
].map((url) => ({
  url,
  cancelTokenSource: axios.CancelToken.source(),
}));

export const useNetworkAbortExample = async () => {
  const threadManager = createThreadManager();
  const threadPool = new ThreadPoolImpl(threadManager);
  await threadPool.resize(4);
  const threadScheduler = new ThreadSchedulerImpl(threadPool);

  let lastCallTime: number | undefined = undefined;

  const fn = (data: ExampleEntry) => async () => {
    try {
      const callTimeDelta = Date.now() - (lastCallTime ?? Date.now());
      lastCallTime = Date.now();
      console.log(`⬇️ Downloading ${data.url} (${callTimeDelta / 1000}ms)`);
      const { status } = await axios.get(data.url, {
        cancelToken: data.cancelTokenSource.token,
      });
      console.log(`✅ Downloaded ${data.url}`);
      return { url: data.url, status };
    } catch (error) {
      console.log(`❌ Canceled (catch) ${data.url}`);
      if (axios.isCancel(error)) {
        return undefined;
      }
      throw error;
    }
  };

  const cancelHandler = async (task: Task, reason?: CancelReason) => {
    const entry = task.getMetadata<ExampleEntry>()!;
    console.log(`❌ Canceled (handler) ${entry.url} because of ${reason}`);
    entry.cancelTokenSource.cancel();
  };

  const tasks = EXAMPLE_ENTRIES.map((entry, index) =>
    threadScheduler
      .schedule(fn(entry))
      .setCancelHandler(cancelHandler)
      .setMetadata({ ...entry, index }),
  );

  setTimeout(() => {
    const firstTask = tasks[0];
    if (firstTask.isResolved()) {
      console.log(`Cannot cancel ${firstTask.getHandle()}. Already resolved`);
      return;
    }
    firstTask.cancel(new CancelReason("Canceled by user"));
  }, 100);

  await Promise.all(tasks.map((task) => task.waitToResolve()));
};
