import { registerWorkerHandler } from "../src";

let thrown = false;

registerWorkerHandler((n: number) => {
  return new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      if (n === 4 && !thrown) {
        thrown = true;
        return reject(new Error("Test error"));
      }
      resolve(n.toString());
    }, 100);
  });
});
