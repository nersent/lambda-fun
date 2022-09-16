import axios from "axios";

import {
  AsyncQueue,
  QueueTaskCancelStrategy,
  createThreadManager,
} from "../src";

export const networkExample = async (threads = 1) => {
  const process = async (threads: number, items: string[]) => {
    await new Promise<void>((resolve) => {
      const queue = new AsyncQueue(
        createThreadManager(threads),
        {
          onFinish: () => {
            resolve();
          },
          onResolve: (err, e) => {
            if (err) return console.error(`Task ${e.id} rejected with`, err);
            if (e.isCanceled) return console.warn(`Task ${e.id} was canceled`);
            console.log(e);
          },
        },
        { debug: true, printOnFinish: true },
      );

      const ids = queue.enqueueArray<string, any>(async (url, ctx) => {
        ctx.cancelController.setStrategy(QueueTaskCancelStrategy.Callback);

        const cancelTokenSource = axios.CancelToken.source();

        ctx.cancelController.setHandler((resolve) => {
          cancelTokenSource.cancel();

          setTimeout(() => {
            resolve();
          }, 2000);
        });

        try {
          console.log(url);
          const { status } = await axios.get(url, {
            cancelToken: cancelTokenSource.token,
          });

          console.log(status);

          return { url, status };
        } catch (error) {
          if (axios.isCancel(error)) {
            return undefined;
          }
          throw error;
        }
      }, items);

      queue.tick();

      setTimeout(() => {
        queue.cancel(ids[0]);
      }, 100);
    });
  };

  await process(threads, [
    "http://ipv4.download.thinkbroadband.com/5MB.zip",
    "http://ipv4.download.thinkbroadband.com/5MB.zip",
  ]);
};
