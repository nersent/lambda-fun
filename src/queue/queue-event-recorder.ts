export interface QueueEventEntry<T extends string> {
  key: T;
  time: Date;
  data?: any;
}

export class QueueEventRecorder<T extends string> {
  public readonly events: QueueEventEntry<T>[] = [];

  constructor(private readonly printWhenCreate?: boolean) {}

  public register<K extends T>(key: K, data?: any) {
    const event: QueueEventEntry<K> = {
      key: key,
      time: new Date(),
    };
    if (data !== undefined) {
      event.data = data;
    }
    if (this.printWhenCreate) {
      console.log(JSON.stringify(event, null, 2));
    }
    this.events.push(event);
  }

  public print() {
    console.log(JSON.stringify(this.events, null, 2));
  }
}
