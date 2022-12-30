export class PauseReason<T = any> extends Error {
  public readonly reason: T | undefined;

  constructor(message: string, reason?: T) {
    super(message);
    this.reason = reason;
    Object.setPrototypeOf(this, PauseReason.prototype);
  }
}

export class CanceledException extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, CanceledException.prototype);
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

export class AlreadyCancelledError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, AlreadyCancelledError.prototype);
  }
}

export type CancelReason<T> = any;
