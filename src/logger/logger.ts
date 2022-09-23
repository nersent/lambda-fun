import { Observable } from "../observable/observable";
import {
  LoggerEntry,
  LoggerEventMap,
  LoggerKeys,
  LoggerKeyValue,
  LoggerOptions,
  ILogger,
  InferedLoggerEntry,
} from "./logger-types";

export class Logger<T extends string | Record<string, any>>
  extends Observable<LoggerEventMap<T>>
  implements ILogger<T>
{
  protected entries: InferedLoggerEntry<T>[] = [];

  constructor(public readonly options?: LoggerOptions) {
    super();
  }

  public getEntries(): InferedLoggerEntry<T, LoggerKeys<T>>[] {
    return this.entries;
  }

  public log<N extends LoggerKeys<T>>(
    key: N,
    data?: LoggerKeyValue<T, N>,
  ): void {
    const entry: LoggerEntry<N, typeof data> = {
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
