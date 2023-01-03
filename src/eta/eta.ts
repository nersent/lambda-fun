import { computeETA } from "./eta-utils";

export class ETA {
  private total = 0;

  private current = 0;

  private startTime: number | undefined = undefined;

  public start(): ETA {
    this.startTime = Date.now();
    return this;
  }

  public getTotal(): number {
    return this.total;
  }

  public getCurrent(): number {
    return this.current;
  }

  public setTotal(total: number): ETA {
    this.total = total;
    return this;
  }

  public setCurrent(current: number): ETA {
    this.current = current;
    return this;
  }

  /**
   * Returns elapsed time in seconds
   */
  public getElapsed(): number {
    if (this.startTime == null) {
      throw new Error("Start time is not set");
    }
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Returns estimated time arrival in seconds
   */
  public compute(): number {
    return computeETA(this.current, this.total, this.getElapsed());
  }
}
