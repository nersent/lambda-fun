import { IObservable, ObservableEventMap } from "./observable-types";

export class Observable<T extends ObservableEventMap>
  implements IObservable<T>
{
  protected readonly listeners = new Map<keyof T, Set<T[keyof T]>>();

  public addListener<K extends keyof T, L extends T[K]>(key: K, listener: L) {
    const set = this.listeners.get(key) ?? new Set();
    this.listeners.set(key, set.add(listener));
  }

  public removeListener<K extends keyof T, L extends T[K]>(
    key: K,
    listener: L,
  ) {
    const set = this.listeners.get(key);
    if (set != null) {
      set.delete(listener);
    }
  }

  public getListeners<K extends keyof T>(key: K) {
    return [...(this.listeners.get(key)?.entries() ?? [])].map(
      ([listener]) => listener,
    );
  }

  public on<K extends keyof T, L extends T[K]>(event: K, listener: L) {
    this.addListener(event, listener);
  }

  public once<K extends keyof T, L extends T[K]>(event: K, listener: L) {
    const onceListener = (...args: any[]) => {
      this.removeListener(event, onceListener as any);
      listener(...args);
    };

    this.addListener(event, onceListener as any);
  }

  public off<K extends keyof T, L extends T[K]>(event: K, listener: L) {
    this.removeListener(event, listener);
  }

  public emit<K extends keyof T>(
    key: K,
    ...args: Parameters<T[K]>
  ): ReturnType<T[K]>[] {
    return this.getListeners(key).map((listener) => listener(...args));
  }

  public async emitAsync<K extends keyof T>(
    key: K,
    ...args: Parameters<T[K]>
  ): Promise<Awaited<ReturnType<T[K]>>[]> {
    return Promise.all(
      this.getListeners(key).map((listener) => listener(...args)),
    );
  }
}
