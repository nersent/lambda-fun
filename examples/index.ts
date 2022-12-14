import { useNetworkAbortExample } from "./example-network-abort";
import { useQueueThrottleExample } from "./example-queue-throttle";
import { useTimeoutExample } from "./example-timeout";

const main = async () => {
  // await useTimeoutExample();
  await useNetworkAbortExample();
  // await useQueueThrottleExample();
};

process.on("exit", function () {
  console.log("exit");
});

main();
