import { delay } from "../utils";

export type TrierOptions = {
  maxTries: number;
  timeout?: number;
} & (
  | {
      returnUndefinedOnTriesExceeded?: boolean;
    }
  | {
      exitProcessOnTriesExceeded?: boolean;
    }
);

export class Trier {
  constructor(public readonly options: TrierOptions) {}

  public async execute(fn: (...args: any[]) => any) {
    let currentAttempt = 0;
    let result;
    let error;
    let success = false;

    while (currentAttempt < this.options.maxTries) {
      try {
        result = await fn();
        success = true;
        break;
      } catch (err) {
        error = err;
        currentAttempt++;
        if (this.options.timeout != null) {
          await delay(this.options.timeout);
        }
      }
    }

    if (error != null && !success) {
      if (
        "returnUndefinedOnTriesExceeded" in this.options &&
        this.options.returnUndefinedOnTriesExceeded
      ) {
        return undefined;
      }
      if (
        "exitProcessOnTriesExceeded" in this.options &&
        this.options.exitProcessOnTriesExceeded
      ) {
        console.error(error);
        process.exit();
      }
      throw error;
    }

    return result;
  }
}
