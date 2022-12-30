import { RepeaterMaxAttemptsExceededException } from "./repeater-exceptions";

export interface RepeaterOptions {
  maxAttempts: number;
}

export interface RepeaterExecutionContext {
  currentAttempt: number;
  maxAttempts: number;
  lastError?: any;
}

export const repeat = async <
  T extends (ctx: RepeaterExecutionContext) => Promise<any>,
>(
  delegate: T,
  options: RepeaterOptions,
): Promise<ReturnType<T>> => {
  let currentAttempt = 1;
  let lastError: any = undefined;

  while (currentAttempt <= options.maxAttempts) {
    try {
      const res = await delegate({
        currentAttempt,
        maxAttempts: options.maxAttempts,
        lastError,
      });
      return res;
    } catch (error) {
      if (currentAttempt++ >= options.maxAttempts) {
        throw new RepeaterMaxAttemptsExceededException(
          `Max attempts exceeded (${options.maxAttempts})`,
          error,
        );
      }
      lastError = error;
    }
  }
  throw new Error("Repeatify failed");
};
