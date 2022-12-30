export class CanceledException extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, CanceledException.prototype);
  }
}
