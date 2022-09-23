import { Observable } from "../observable/observable";
import {
  EventRecorderEntry,
  EventRecorderEventMap,
  EventRecorderKeys,
  EventRecorderKeyValue,
  EventRecorderOptions,
  IEventRecorder,
  InferedEventRecorderEntry,
} from "./event-recorder-types";

export class EventRecorder<T extends string | Record<string, any>>
  extends Observable<EventRecorderEventMap<T>>
  implements IEventRecorder<T>
{
  protected entries: InferedEventRecorderEntry<T>[] = [];

  constructor(public readonly options?: EventRecorderOptions) {
    super();
  }

  public getEntries(): InferedEventRecorderEntry<T, EventRecorderKeys<T>>[] {
    return this.entries;
  }

  public log<N extends EventRecorderKeys<T>>(
    key: N,
    data: EventRecorderKeyValue<T, N>,
  ): void {
    const entry: EventRecorderEntry<N, typeof data> = {
      key: key,
      time: new Date(),
      data,
    };
    if (this.options?.print) {
      console.log(JSON.stringify(entry, null, 2));
    }
    this.entries.push(entry as any);
  }

  public print() {
    console.log(JSON.stringify(this.entries, null, 2));
  }
}
