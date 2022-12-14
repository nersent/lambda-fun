import { Task } from "../tasks/task-types";

export interface ThreadScheduler {
  schedule(data: any): Task;
  run(): Promise<void> | void;
}
