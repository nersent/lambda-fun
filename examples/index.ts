import { useQueueNetworkAbortExample } from "./queue/network-abort";
import { useQueuePauseResumeExample } from "./queue/pause-resume";
import { useThreadifyMessageExample } from "./threadify/message";
import { useThreadifyRetryExample } from "./threadify/retry";
import { useThreadifyTimeoutExample } from "./threadify/timeout";
import { useThreadifyThrottleExample } from "./threadify/throttle";

const main = async () => {
  // await useQueueNetworkAbortExample();
  // await useQueuePauseResumeExample();
  // await useThreadifyMessageExample();
  // await useThreadifyTimeoutExample();
  // await useThreadifyRetryExample();
  await useThreadifyThrottleExample();
};

process.on("exit", function () {
  console.log("exit");
});

main();
