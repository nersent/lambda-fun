import { delay } from "../utils";
import { IRepeater, RepeaterExecuteOptions } from "./repeater-types";

export class Repeater implements IRepeater {
  public async execute<T>(
    fn: (...args: any[]) => T,
    options?: RepeaterExecuteOptions,
  ) {
    const maxAttempts = options?.maxAttempts ?? 1;
    if (maxAttempts <= 0) return;

    let currentAttempt = 0;
    let result;
    let error;
    let success = false;

    while (currentAttempt < maxAttempts) {
      try {
        result = await fn();
        success = true;
        break;
      } catch (err) {
        error = err;
        currentAttempt++;
        if (options?.timeout != null) {
          await delay(options.timeout);
        }
      }
    }

    if (error != null && !success) {
      if (options?.onMaxAttemptsExceeded != null) {
        if (
          "returnUndefined" in options.onMaxAttemptsExceeded &&
          options.onMaxAttemptsExceeded.returnUndefined
        ) {
          return undefined;
        }
        if (
          "exitProcess" in options.onMaxAttemptsExceeded &&
          options.onMaxAttemptsExceeded.exitProcess
        ) {
          console.error(error);
          process.exit();
        }
      }
      throw error;
    }

    return result;
  }
}
