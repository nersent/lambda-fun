export class PauseReason<T = any> extends Error {
  public readonly reason: T | undefined;

  constructor(message: string, reason?: T) {
    super(message);
    this.reason = reason;
    Object.setPrototypeOf(this, PauseReason.prototype);
  }
}

export class CancelReason<T = any> extends Error {
  public readonly reason: T | undefined;

  constructor(message: string, reason?: T) {
    super(message);
    this.reason = reason;
    Object.setPrototypeOf(this, CancelReason.prototype);
  }
}

export class ResumeReason<T = any> extends Error {
  public readonly reason: T | undefined;

  constructor(message: string, reason?: T) {
    super(message);
    this.reason = reason;
    Object.setPrototypeOf(this, ResumeReason.prototype);
  }
}
