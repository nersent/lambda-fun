export interface IRepeater {
  execute<T>(fn: (...args: any[]) => T): any;
}

export type RepeaterOptions = {
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
