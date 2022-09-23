import EventEmitter from "events";

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

// export class Xd extends EventEmitter {}

// export class Observable<T extends ObservableEventMap> {
//   public readonly listeners = new Map<keyof T, Set<T[keyof T]>>();

//   public addListener<K extends keyof T, L extends T[K]>(key: K, listener: L) {
//     const set = this.listeners.get(key) ?? new Set();
//     this.listeners.set(key, set.add(listener));
//   }

//   public removeListener<K extends keyof T, L extends T[K]>(
//     key: K,
//     listener: L,
//   ) {
//     const set = this.listeners.get(key);
//     if (set != null) {
//       set.delete(listener);
//     }
//   }

//   public getListeners<K extends keyof T>(key: K) {
//     return [...(this.listeners.get(key)?.entries() ?? [])].map(
//       ([listener]) => listener,
//     );
//   }

//   public on<K extends keyof T, L extends T[K]>(event: K, listener: L) {
//     this.addListener(event, listener);
//   }

//   public once<K extends keyof T, L extends T[K]>(event: K, listener: L) {
//     const onceListener = (...args: any[]) => {
//       this.removeListener(event, onceListener as any);
//       listener(...args);
//     };

//     this.addListener(event, onceListener as any);
//   }

//   public off<K extends keyof T, L extends T[K]>(event: K, listener: L) {
//     this.removeListener(event, listener);
//   }

//   public emit<K extends keyof T>(key: K, ...args: Parameters<T[K]>) {
//     this.getListeners(key).forEach((listener) => listener(...args));
//   }

//   public async emitAsync<K extends keyof T>(key: K, ...args: Parameters<T[K]>) {
//     await Promise.all(
//       this.getListeners(key).map((listener) => listener(...args)),
//     );
//   }
// }
