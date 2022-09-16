import { useMessageExample } from "./message";
import { useNetworkAbortExample } from "./network-abort";
import { useRetryExample } from "./retry";
import { useTimeoutExample } from "./timeout";

const main = async () => {
  // await useMessageExample();
  // await useNetworkAbortExample();
  // await useTimeoutExample();
  await useRetryExample();
};

process.on("exit", function () {
  console.log("exit");
});

main();
