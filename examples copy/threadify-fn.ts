import { threadify } from "../src";

export const threadifyFnExample = async (threads = 2) => {
  let thrown = false;

  const fn = (n: number) => {
    return new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if (n === 4 && !thrown) {
          thrown = true;
          return reject(new Error("Test error"));
        }
        resolve(n.toString());
      }, 100);
    });
  };

  const items = Array.from({ length: 10 }).map((r, index) => index);

  const res = await threadify(fn, threads, items, {
    maxRetries: 2,
    retryTimeout: 200,
  });

  console.log(res);
};
