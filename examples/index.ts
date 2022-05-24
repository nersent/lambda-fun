import { downloadExample } from "./download";
import { networkExample } from "./network";
import { threadifyFnExample } from "./threadify-fn";
import { threadifyWorkerExample } from "./threadify-worker";
import { timeoutExample } from "./timeout";

const main = async () => {
  // await networkExample();
  // await timeoutExample();
  // await threadifyFnExample();
  await threadifyWorkerExample();
  // await downloadExample();
};

main();
