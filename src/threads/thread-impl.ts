import { makeId } from "../utils";
import { Thread, ThreadData, ThreadStatus } from "./thread-manager";

export class ThreadImpl implements Thread {
  private id = makeId();

  private status: ThreadStatus = ThreadStatus.Ready;

  private _isKilled = false;

  private data: any;

  private _isReady = true;

  public getId() {
    return this.id;
  }

  public getStatus() {
    return this.status;
  }

  public isKilled() {
    return this._isKilled;
  }

  public markAsKilled(killed: boolean) {
    this._isKilled = killed;
  }

  public isReady() {
    return this._isReady && !this.isKilled() && !this.isRunning();
  }

  public accept<T>(data: T) {
    return this.isReady();
  }

  public isRunning() {
    return this.status === ThreadStatus.Pending;
  }

  public markAsReady() {
    if (this.isKilled() || this.isRunning()) {
      throw new Error(`Thread ${this.id} is not ready.`);
    }
    this._isReady = true;
  }

  public async execute<T, K>({ data, handler, onFinish }: ThreadData<T, K>) {
    if (this.isRunning()) {
      throw new Error(`Thread ${this.id} is already running.`);
    }

    this.data = data;
    this.status = ThreadStatus.Pending;
    this._isReady = false;

    try {
      const res = await handler(data);
      this.status = ThreadStatus.Fulfilled;
      this.data = undefined;
      onFinish?.(null, res);
      return res;
    } catch (error) {
      this.status = ThreadStatus.Rejected;
      this.data = undefined;
      onFinish?.(error);
      return null;
    }
  }
}
