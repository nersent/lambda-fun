export interface IRepeater {
  execute<T>(fn: (...args: any[]) => T, options?: RepeaterExecuteOptions): any;
}

export type RepeaterExecuteOptions = {
  maxAttempts?: number;
  timeout?: number;
  onMaxAttemptsExceeded?: RepeaterOnMaxAttemptsExceededOptions;
};

export type RepeaterOnMaxAttemptsExceededOptions =
  | {
      returnUndefined?: boolean;
    }
  | {
      exitProcess?: boolean;
    };
