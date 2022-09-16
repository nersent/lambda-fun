import { makeId } from "../utils";
import {
  IThread,
  ThreadExecutionContext,
  ThreadExecutionResponse,
  ThreadExecutionStatus,
  ThreadStatus,
} from "./thread-types";

export class Thread implements IThread {
  private id = makeId();

  private status: ThreadStatus = ThreadStatus.Available;

  private executionStatus: ThreadExecutionStatus = ThreadExecutionStatus.None;

  private executionCtx: ThreadExecutionContext | undefined = undefined;

  public getId(): string {
    return this.id;
  }

  public getStatus(): ThreadStatus {
    return this.status;
  }

  public setStatus(status: ThreadStatus): void {
    this.status = status;
  }

  public getExecutionStatus(): ThreadExecutionStatus {
    return this.executionStatus;
  }

  public isExecuting() {
    return this.executionStatus === ThreadExecutionStatus.Pending;
  }

  public isExecutable(): boolean {
    return this.status === ThreadStatus.Available && !this.isExecuting();
  }

  public isValidForExecution(ctx: Record<string, any>): boolean {
    return this.isExecutable();
  }

  public async execute(
    ctx: ThreadExecutionContext,
  ): Promise<ThreadExecutionResponse> {
    this.executionCtx = ctx;
    this.executionStatus = ThreadExecutionStatus.Pending;

    try {
      const res = await ctx.fn();
      this.executionStatus = ThreadExecutionStatus.Fulfilled;
      this.executionCtx = undefined;
      return { data: res };
    } catch (error) {
      this.executionStatus = ThreadExecutionStatus.Rejected;
      this.executionCtx = undefined;
      return { error };
    }
  }
}
