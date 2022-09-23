export interface IThrottler {
  execute<T>(fn: (...args: any[]) => T): Promise<Awaited<T>>;
}

export interface ThrottlerOptions {
  time: number;
  count: number;
}

export type ThrottlerEventMap = {
  resolve: (id: string, error?: any, data?: any) => void;
};
