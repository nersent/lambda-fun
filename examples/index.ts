// import { useNetworkAbortExample } from "./example-network-abort";
// import { useQueueThrottleExample } from "./example-queue-throttle";
// import { xd } from "./xd";

import { useNetworkAbortExample } from "./example-network-abort";

const main = async () => {
  // await useTimeoutExample();
  // await useNetworkAbortExample();
  // await useQueueThrottleExample();
  // await xd();
  await useNetworkAbortExample();
};

process.on("exit", function () {
  console.log("exit");
});

main();
