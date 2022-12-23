import { EventRegistryBase } from "@nersent/event-emitter";

import {
  CancelReason,
  PauseReason,
  ResumeReason,
} from "../lifecycle/lifecycle-exceptions";

import { TaskHandle } from "./task-queue-types";

export type TaskEvents = {
  run: () => Promise<void> | void;
  pause: (reason?: PauseReason) => Promise<void> | void;
  resume: (reason?: ResumeReason) => Promise<void> | void;
  cancel: (reason?: CancelReason) => Promise<void> | void;
  resolve: (data: any) => Promise<void> | void;
};

export type TaskEventRegistry = EventRegistryBase<TaskEvents>;

export type TaskCancelHandler = (
  task: Task,
  reason?: CancelReason,
) => Promise<void> | void;

export type TaskPauseHandler = (
  task: Task,
  reason?: PauseReason,
) => Promise<void> | void;

export type TaskResumeHandler = (
  task: Task,
  reason?: ResumeReason,
) => Promise<void> | void;

export interface Task {
  getHandle(): TaskHandle;
  getData<T>(): T;
  isRunning(): boolean;
  isResolved(): boolean;
  isPaused(): boolean;
  isCanceled(): boolean;
  isResumed(): boolean;
  cancel(reason?: CancelReason): Promise<void>;
  pause(reason?: PauseReason): Promise<void>;
  resume(reason?: ResumeReason): Promise<void>;
  getMetadata<T>(): T | undefined;
  setMetadata<T>(metadata?: T): Task;
  setCancelHandler(handler: TaskCancelHandler): Task;
  setPauseHandler(handler: TaskPauseHandler): Task;
  setResumeHandler(handler: TaskResumeHandler): Task;
  getCancelHandler(): TaskCancelHandler | undefined;
  getPauseHandler(): TaskPauseHandler | undefined;
  getResumeHandler(): TaskResumeHandler | undefined;
  waitToResolve(): Promise<TaskResponse>;
}

export type TaskResponse = { task: Task } & (
  | {
      error: any;
    }
  | {
      data: any;
    }
);
