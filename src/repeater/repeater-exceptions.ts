export class RepeaterMaxAttemptsExceededException extends Error {
  constructor(message: string, public readonly parentError: any) {
    super(message);
    Object.setPrototypeOf(this, RepeaterMaxAttemptsExceededException.prototype);
  }
}
