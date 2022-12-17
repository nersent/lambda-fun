import { EventRegistryBase } from "@nersent/event-emitter";

import { Task, TaskResponse } from "./task-types";

export type TaskHandle = string;

export type TaskQueueEvents = {
  empty?: () => void;
  tick?: () => void;
  process: (task: Task) => Promise<void> | void;
  resolve?: (res: TaskResponse) => void;
};

export type TaskQueueEventRegistry = EventRegistryBase<TaskQueueEvents>;

export type TaskQueueHandler = (task: Task) => TaskQueueHandlerResponse;

export type TaskQueueHandlerResponse =
  | {
      accepted: false;
    }
  | {
      accepted: true;
      resolver: (...args: any[]) => Promise<any> | any;
    };

export interface TaskQueue extends TaskQueueEventRegistry {
  enqueue<T>(data: T): Task;
  getTasks(): Task[];
  isBusy(): boolean;
  lock(): void;
  unlock(): void;
  isLocked(): boolean;
  tick(): void;
  run(): Promise<void> | void;
}
