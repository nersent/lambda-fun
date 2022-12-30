import {
  CancelReason,
  PauseReason,
  ResumeReason,
} from "../lifecycle/lifecycle-exceptions";

import { TaskHandle } from "./task-queue-types";
import {
  Task,
  TaskCancelHandler,
  TaskPauseHandler,
  TaskResponse,
  TaskResumeHandler,
} from "./task-types";

export interface TaskImplDelegates {
  isRunning: () => boolean;
  isResolved: () => boolean;
  onCancel?: (reason?: CancelReason<any>) => Promise<void> | void;
  onPause?: (reason?: PauseReason<any>) => Promise<void> | void;
  onResume?: (reason?: ResumeReason<any>) => Promise<void> | void;
  waitToResolve: () => Promise<TaskResponse>;
}

export class TaskImpl implements Task {
  protected cancelHandler: TaskCancelHandler | undefined;

  protected pauseHandler: TaskPauseHandler | undefined;

  protected resumeHandler: TaskResumeHandler | undefined;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _isPaused = false;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _isCanceled = false;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _isResumed = false;

  protected metadata: any | undefined = undefined;

  constructor(
    private readonly handle: TaskHandle,
    private readonly data: any,
    private readonly delegates: TaskImplDelegates,
  ) {}

  public getHandle(): string {
    return this.handle;
  }

  public isRunning(): boolean {
    return this.delegates.isRunning();
  }

  public getData<T>(): T {
    return this.data;
  }

  public isPaused(): boolean {
    return this._isPaused;
  }

  public isResolved(): boolean {
    return this.delegates.isResolved();
  }

  public isCanceled(): boolean {
    return this._isCanceled;
  }

  public isResumed(): boolean {
    return this._isResumed;
  }

  public async cancel(reason?: CancelReason<any> | undefined): Promise<void> {
    if (this.isCanceled()) {
      throw new Error("Task is already canceled");
    }
    if (this.cancelHandler == null) {
      throw new Error("No cancel handler defined");
    }
    this._isCanceled = true;
    await this.cancelHandler(this, reason);
    await this.delegates.onCancel?.(reason);
  }

  public async pause(reason?: PauseReason<any> | undefined): Promise<void> {
    if (this.isPaused()) {
      throw new Error("Task is already paused");
    }
    if (this.pauseHandler == null) {
      throw new Error("No pause handler defined");
    }
    this._isPaused = true;
    await this.pauseHandler(this, reason);
    await this.delegates.onPause?.(reason);
  }

  public async resume(reason?: ResumeReason<any> | undefined): Promise<void> {
    if (this.isResumed()) {
      throw new Error("Task is already resumed");
    }
    if (this.resumeHandler == null) {
      throw new Error("No resume handler defined");
    }
    this._isResumed = true;
    await this.resumeHandler(this, reason);
    await this.delegates.onResume?.(reason);
  }

  public waitToResolve(): Promise<TaskResponse> {
    return this.delegates.waitToResolve();
  }

  public setCancelHandler(handler: TaskCancelHandler): Task {
    this.cancelHandler = handler;
    return this;
  }

  public setPauseHandler(handler: TaskPauseHandler): Task {
    this.pauseHandler = handler;
    return this;
  }

  public setResumeHandler(handler: TaskResumeHandler): Task {
    this.resumeHandler = handler;
    return this;
  }

  public getCancelHandler(): TaskCancelHandler | undefined {
    return this.cancelHandler;
  }

  public getPauseHandler(): TaskPauseHandler | undefined {
    return this.pauseHandler;
  }

  public getResumeHandler(): TaskResumeHandler | undefined {
    return this.resumeHandler;
  }

  public setMetadata<T>(metadata?: T): Task {
    this.metadata = metadata;
    return this;
  }

  public getMetadata<T>(): T | undefined {
    return this.metadata;
  }
}
