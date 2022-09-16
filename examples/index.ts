import { useMessageExample } from "./message";
import { useNetworkAbortExample } from "./network-abort";
import { useTimeoutExample } from "./timeout";

const main = async () => {
  // await useMessageExample();
  // await useNetworkAbortExample();
  await useTimeoutExample();
};

process.on("exit", function () {
  console.log("exit");
});

main();
