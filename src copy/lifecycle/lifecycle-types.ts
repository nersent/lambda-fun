import { PauseReason } from "./lifecycle-exceptions";

export type PausedResponse =
  | { isPaused: false }
  | {
      isPaused: true;
      reason: PauseReason;
    };

export type CanceledResponse =
  | { isCanceled: false }
  | {
      isCanceled: true;
      reason: any;
    };

export type LifecycleDataResponse<T> = {
  data: T;
  isPaused: false;
  isCanceled: false;
} & PausedResponse &
  CanceledResponse;
