import { Thread, ThreadResponse, ThreadStatus } from "./thread-types";

/**
 * Thread implementation that accepts a function.
 */
export class FunctionThread<T extends (...args: any[]) => any>
  implements Thread
{
  protected _isInitialized: boolean = false;

  protected _isAlive: boolean = false;

  protected status: ThreadStatus = ThreadStatus.None;

  protected metadata: any | undefined = undefined;

  constructor(private readonly id: number) {}

  public getId(): number {
    return this.id;
  }

  public getStatus(): ThreadStatus {
    return this.status;
  }

  public async initialize(): Promise<void> {
    this._isInitialized = true;
    this._isAlive = true;
  }

  public async kill(): Promise<void> {
    this._isAlive = false;
  }

  public isInitialized(): boolean {
    return this._isInitialized;
  }

  public isAlive(): boolean {
    return this._isAlive && this._isInitialized;
  }

  public isRunning(): boolean {
    return this.getStatus() === ThreadStatus.Pending;
  }

  public async run<K>(fn: T): Promise<ThreadResponse<K>> {
    if (!this.isAlive()) {
      throw new Error("Thread is dead.");
    }
    if (this.isRunning()) {
      throw new Error("Cannot run on this thread while it is running.");
    }

    this.status = ThreadStatus.Pending;

    try {
      const res = await fn();
      this.status = ThreadStatus.Fulfilled;
      return { data: res };
    } catch (error) {
      this.status = ThreadStatus.Rejected;
      return { error };
    }
  }

  public setMetadata<K>(metadata?: K): FunctionThread<T> {
    this.metadata = metadata;
    return this;
  }

  public getMetadata<K>(): K | undefined {
    return this.metadata;
  }
}
