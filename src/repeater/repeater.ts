import { delay } from "../utils";
import { IRepeater, RepeaterOptions } from "./repeater-types";

export class Repeater implements IRepeater {
  public currentAttempt = 0;

  constructor(public readonly options?: RepeaterOptions) {}

  public async execute<T>(fn: (...args: any[]) => T) {
    const maxAttempts = this.options?.maxAttempts ?? 1;
    if (maxAttempts <= 0) return;

    let currentAttempt = 0;
    this.currentAttempt = currentAttempt;

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
        this.currentAttempt = currentAttempt;
        if (this.options?.timeout != null) {
          await delay(this.options.timeout);
        }
      }
    }

    if (currentAttempt > maxAttempts) {
      if (error != null && !success) {
        if (this.options?.onMaxAttemptsExceeded != null) {
          if (
            "returnUndefined" in this.options.onMaxAttemptsExceeded &&
            this.options.onMaxAttemptsExceeded.returnUndefined
          ) {
            return undefined;
          }
          if (
            "exitProcess" in this.options.onMaxAttemptsExceeded &&
            this.options.onMaxAttemptsExceeded.exitProcess
          ) {
            console.error("Max attempts exceeded");
            console.error(error);
            process.exit();
          }
        }
        throw error;
      }
    }

    return result;
  }
}
