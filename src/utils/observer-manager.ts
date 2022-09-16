export class ObserverManager<
  LISTENERS_MAP extends Record<string, (...args: any[]) => any>,
> {
  private listeners = new Map<
    keyof LISTENERS_MAP,
    Set<LISTENERS_MAP[keyof LISTENERS_MAP]>
  >();

  public add<T extends keyof LISTENERS_MAP, K extends LISTENERS_MAP[T]>(
    key: T,
    listener: K,
  ) {
    const set = this.listeners.get(key) ?? new Set();
    this.listeners.set(key, set.add(listener));
  }

  public addFromMap<T extends Partial<LISTENERS_MAP>>(map: T) {
    Object.entries(map).forEach(([key, listener]) => {
      this.add(key as keyof LISTENERS_MAP, listener as any);
    });
  }

  public remove<T extends keyof LISTENERS_MAP, K extends LISTENERS_MAP[T]>(
    key: T,
    listener: K,
  ) {
    const set = this.listeners.get(key);
    if (set != null) {
      set.delete(listener);
    }
  }

  public removeFromMap<T extends Partial<LISTENERS_MAP>>(map: T) {
    Object.entries(map).forEach(([key, listener]) => {
      this.remove(key as keyof LISTENERS_MAP, listener as any);
    });
  }

  public getListeners<T extends keyof LISTENERS_MAP>(key: T) {
    return [...(this.listeners.get(key)?.entries() ?? [])].map(
      ([listener]) => listener,
    );
  }

  public emit<T extends keyof LISTENERS_MAP>(
    key: T,
    ...args: Parameters<LISTENERS_MAP[T]>
  ) {
    this.getListeners(key).forEach((listener) => listener(...args));
  }

  public async emitAsync<T extends keyof LISTENERS_MAP>(
    key: T,
    ...args: Parameters<LISTENERS_MAP[T]>
  ) {
    await Promise.all(
      this.getListeners(key).map((listener) => listener(...args)),
    );
  }
}
