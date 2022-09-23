export interface LoggerEntry<T extends string, K = any> {
  key: T;
  time: Date;
  data: K;
}

export type LoggerKeys<T extends string | Record<string, any>> =
  T extends Record<string, any> ? keyof T : T;

export type LoggerKeyValue<
  T extends string | Record<string, any>,
  K extends LoggerKeys<T>,
> = T extends Record<string, any> ? T[K] : any;

export type InferedLoggerEntry<
  T extends string | Record<string, any>,
  K extends LoggerKeys<T> = LoggerKeys<T>,
> = (T extends Record<string, any>
  ? {
      [P in K]: LoggerEntry<P, LoggerKeyValue<T, P>>;
    }
  : Record<K, LoggerEntry<K, any>>)[K];

export interface ILogger<T extends string | Record<string, any>> {
  getEntries(): InferedLoggerEntry<T>[];
  log<N extends LoggerKeys<T>>(key: N, data?: LoggerKeyValue<T, N>): void;
  print(): void;
}

export type LoggerEventMap<
  T extends string | Record<string, any>,
  K extends LoggerKeys<T> = LoggerKeys<T>,
> = {
  log: <N extends K>(key: N, data?: InferedLoggerEntry<N>) => void;
};

export interface LoggerOptions {
  print?: boolean;
}
