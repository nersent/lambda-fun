export interface EventRecorderEntry<T extends string, K = any> {
  key: T;
  time: Date;
  data: K;
}

export type EventRecorderKeys<T extends string | Record<string, any>> =
  T extends Record<string, any> ? keyof T : T;

export type EventRecorderKeyValue<
  T extends string | Record<string, any>,
  K extends EventRecorderKeys<T>,
> = T extends Record<string, any> ? T[K] : any;

export type InferedEventRecorderEntry<
  T extends string | Record<string, any>,
  K extends EventRecorderKeys<T> = EventRecorderKeys<T>,
> = (T extends Record<string, any>
  ? {
      [P in K]: EventRecorderEntry<P, EventRecorderKeyValue<T, P>>;
    }
  : Record<K, EventRecorderEntry<K, any>>)[K];

export interface IEventRecorder<T extends string | Record<string, any>> {
  getEntries(): InferedEventRecorderEntry<T>[];
  log<N extends EventRecorderKeys<T>>(
    key: N,
    data: EventRecorderKeyValue<T, N>,
  ): void;
  print(): void;
}

export type EventRecorderEventMap<
  T extends string | Record<string, any>,
  K extends EventRecorderKeys<T> = EventRecorderKeys<T>,
> = {
  log: <N extends K>(key: N, data?: InferedEventRecorderEntry<N>) => void;
};

export interface EventRecorderOptions {
  print?: boolean;
}
