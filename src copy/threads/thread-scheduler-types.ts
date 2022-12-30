import { Task } from "../tasks/task-types";

export interface ThreadScheduler {
  schedule<T>(data: T): Task;
  run(): Promise<void> | void;
}
