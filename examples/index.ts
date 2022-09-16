import { useMessageExample } from "./message";
import { useNetworkAbortExample } from "./network-abort";
import { usePauseResumeExample } from "./pause-resume";
import { useRetryExample } from "./retry";
import { useTimeoutExample } from "./timeout";

const main = async () => {
  // await useMessageExample();
  // await useNetworkAbortExample();
  // await useTimeoutExample();
  // await useRetryExample();
  await usePauseResumeExample();
};

process.on("exit", function () {
  console.log("exit");
});

main();
