import axios from "axios";
import { createThreadPool } from "src/threading/threads/thread-pool-factory";
import { CancelTokenSource, createTask, createThreadScheduler } from "../src";
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
  cancelTokenSource: new CancelTokenSource(),
}));

let lastCallTime: number | undefined = undefined;

export const useNetworkAbortExample = async () => {
  const threadPool = await createThreadPool(2);
  const threadScheduler = createThreadScheduler(threadPool);

  setTimeout(() => {
    const firstTask = EXAMPLE_ENTRIES[0];
    firstTask.cancelTokenSource.cancel("test cancel");
  }, 200);

  const items = await Promise.all(
    EXAMPLE_ENTRIES.map((entry) =>
      threadScheduler
        .run(
          createTask(async (ctx): Promise<boolean> => {
            const axiosCancelTokenSource = axios.CancelToken.source();

            ctx.cancelToken?.throwIfRequested();
            // Axios has their own cancel token, so we can use it and wrap it in our own cancel token
            ctx.cancelToken?.once("requested", () => {
              axiosCancelTokenSource.cancel();
              console.log(`❌ Canceled (request) ${entry.url}`);
            });

            const callTimeDelta = Date.now() - (lastCallTime ?? Date.now());
            lastCallTime = Date.now();
            console.log(
              `⬇️ Downloading ${entry.url} (${callTimeDelta / 1000}ms)`,
            );
            const { status } = await axios.get(entry.url, {
              cancelToken: axiosCancelTokenSource.token,
            });
            console.log(`✅ Downloaded ${entry.url}`);
            return true;
          }).setCancelToken(entry.cancelTokenSource.getToken()),
        )
        .catch((e) => {
          if (axios.isCancel(e)) {
            console.log(`❌ Canceled (catch) ${entry.url}`);
            return false;
          }
          throw e;
        }),
    ),
  );

  const downloadedCount = items.filter((i) => i).length;

  console.log(`${downloadedCount}/${EXAMPLE_ENTRIES.length}`);
};
