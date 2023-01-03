export class IterationPerformance {
  private current = 0;

  private startTime = 0;

  public start(): IterationPerformance {
    this.startTime = Date.now();
    return this;
  }

  public getCurrent(): number {
    return this.current;
  }

  public setCurrent(current: number): IterationPerformance {
    this.current = current;
    return this;
  }

  /**
   * Returns elapsed time in seconds
   */
  public getElapsed(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Returns estimated iterations per minute
   */
  public computePerMinute(): number {
    return (this.current / this.getElapsed()) * 60;
  }
}
