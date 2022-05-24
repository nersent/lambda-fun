export interface ThreadifyOptions<T> {
  maxRetries?: number;
  retryTimeout?: number;
  onResolve?: (data: T) => void;
  debug?: boolean;
}
