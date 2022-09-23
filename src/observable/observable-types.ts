/**
 * An alternative to Node's EventEmitter that is more flexible and type-safe.
 */
export interface IObservable<T extends ObservableEventMap> {
  addListener<K extends keyof T, L extends T[K]>(key: K, listener: L): void;
  removeListener<K extends keyof T, L extends T[K]>(key: K, listener: L): void;
  getListeners<K extends keyof T>(key: K): T[keyof T][];
  on<K extends keyof T, L extends T[K]>(event: K, listener: L): void;
  once<K extends keyof T, L extends T[K]>(event: K, listener: L): void;
  off<K extends keyof T, L extends T[K]>(event: K, listener: L): void;
  emit<K extends keyof T>(
    key: K,
    ...args: Parameters<T[K]>
  ): ReturnType<T[K]>[];
  emitAsync<K extends keyof T>(
    key: K,
    ...args: Parameters<T[K]>
  ): Promise<Awaited<ReturnType<T[K]>>[]>;
}

export type ObservableEventMap = Record<
  string | symbol,
  (...args: any[]) => any
>;
