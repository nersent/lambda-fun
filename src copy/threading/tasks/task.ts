import { ICancelToken } from "../../lifecycle/cancel-token-types";
import {
  ITask,
  TaskDelegate,
  TaskExecutionContext,
  TaskResult,
  TaskStatus,
} from "./task-types";

export class Task<
  T = void,
  C extends Record<string, any> = Record<string, never>,
> implements ITask<T, C>
{
  private metadata: any = undefined;

  protected status: TaskStatus = TaskStatus.None;

  private _cancelToken?: ICancelToken | undefined = undefined;

  constructor(
    private readonly delegate: TaskDelegate<T, C>,
    private readonly id: string,
  ) {}

  public getId(): string {
    return this.id;
  }

  public getDelegate(): TaskDelegate<T, C> {
    return this.delegate;
  }

  public getMetadata<M>(): M {
    return this.metadata;
  }

  public setMetadata<M>(metadata: M): Task<T, C> {
    this.metadata = metadata;
    return this;
  }

  public getStatus(): TaskStatus {
    return this.status;
  }

  public async run(ctx?: C): Promise<T> {
    this.status = TaskStatus.Pending;

    try {
      const executionContext: TaskExecutionContext<C> = {
        ...ctx,
        taskId: this.getId(),
        taskMetadata: this.getMetadata(),
        cancelToken: this.getCancelToken(),
      } as TaskExecutionContext<C>;
      const delegate = this.getDelegate();
      const delegateRes = await delegate(executionContext);
      this.status = TaskStatus.Fulfilled;
      return delegateRes;
    } catch (error) {
      this.status = TaskStatus.Rejected;
      throw error;
    }
  }

  public getCancelToken(): ICancelToken | undefined {
    return this._cancelToken;
  }

  public setCancelToken(token: ICancelToken): Task<T, C> {
    this._cancelToken = token;
    return this;
  }
}
