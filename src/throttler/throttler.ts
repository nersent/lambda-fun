import { makeId } from "../utils";
import { Observable } from "../observable/observable";
import {
  IThrottler,
  ThrottlerEventMap,
  ThrottlerOptions,
} from "./throttler-types";
import { Logger } from "../logger/logger";

export interface ThrottlerQueueEntry {
  id: string;
  fn: (...args: any[]) => any;
}

export interface ThrottlerBatchEntry {
  id: string;
  startTime?: number;
  endTime?: number;
  hasFinished: boolean;
}

export type ThrottlerLogType =
  | "free-batch"
  | "reset-batch"
  | "handler-clear"
  | "handler-resolved"
  | "tick"
  | "tick-is-locked"
  | "tick-queue-empty"
  | "execute-batch-entry"
  | "before-execution"
  | "after-execution"
  | "resolve"
  | "set-timeout"
  | "timeout-fired"
  | "execute-tick-call"
  | "reset-batch-request";

export class Throttler
  extends Observable<ThrottlerEventMap>
  implements IThrottler
{
  private queue: ThrottlerQueueEntry[] = [];

  private batch: ThrottlerBatchEntry[] = [];

  private batchLongestEndTime: number | undefined = undefined;

  private timeout: NodeJS.Timeout | undefined = undefined;

  private logger: Logger<ThrottlerLogType> | undefined = undefined;

  constructor(public readonly options: ThrottlerOptions) {
    super();
  }

  public isLocked() {
    return this.batch.length >= this.options.count;
  }

  private freeBatch(now: number = Date.now()) {
    this.logger?.log("free-batch", {
      batch: this.batch,
      queue: this.queue,
      now,
      latestEndTime: this.batchLongestEndTime,
    });

    if (this.batch.length === 0) {
      return true;
    }

    const finishedEntries = this.batch.filter((entry) => entry.hasFinished);
    if (finishedEntries.length === 0) return false;

    if (this.batch.length === finishedEntries.length) {
      if (this.batchLongestEndTime == null) {
        throw new Error("Batch latest end time is undefined");
      }

      const delta = now - this.batchLongestEndTime;

      this.logger?.log("reset-batch-request", {
        now,
        delta,
        optionsTime: this.options.time,
        batch: this.batch,
      });

      if (delta >= this.options.time) {
        this.logger?.log("reset-batch", {
          now,
          delta,
          optionsTime: this.options.time,
          batch: this.batch,
        });
        this.batch = [];
        this.batchLongestEndTime = undefined;
        return true;
      }
    }

    return false;
  }

  private enqueue(fn: (...args: any[]) => any) {
    const id = makeId();
    this.queue.push({ id, fn });
    return id;
  }

  private tick() {
    this.logger?.log("tick");

    while (true) {
      if (this.isLocked()) {
        clearTimeout(this.timeout);

        const canProceed = this.freeBatch();
        this.logger?.log("tick-is-locked", {
          canProceed,
          batchLongestEndTime: this.batchLongestEndTime,
        });

        if (!canProceed) {
          if (this.batchLongestEndTime != null) {
            const now = Date.now();
            const delta = this.batchLongestEndTime + this.options.time - now;
            this.logger?.log("set-timeout", {
              now,
              delta,
              optionsTime: this.options.time,
            });
            if (delta > 0) {
              this.timeout = setTimeout(() => {
                this.logger?.log("timeout-fired", { delta });
                this.tick();
              }, delta);
            }
          }
          return;
        } else {
          this.batchLongestEndTime = undefined;
        }
      }

      const queueEntry = this.queue.shift();
      if (queueEntry == null) {
        this.logger?.log("tick-queue-empty");
        return;
      }

      const batchEntry: ThrottlerBatchEntry = {
        id: queueEntry.id,
        hasFinished: false,
      };

      this.batch.push(batchEntry);
      this.executeBatchEntry(batchEntry, queueEntry);
    }
  }

  private async executeBatchEntry(
    batchEntry: ThrottlerBatchEntry,
    queueEntry: ThrottlerQueueEntry,
  ) {
    this.logger?.log("execute-batch-entry", { batchEntry });

    batchEntry.startTime = Date.now();

    this.logger?.log("before-execution", {
      batchEntry,
      queueEntry,
      batch: this.batch,
      queue: this.queue,
    });

    let res: any = undefined;
    let error: any = undefined;

    try {
      res = await queueEntry.fn();
    } catch (e) {
      error = e;
    }

    this.logger?.log("after-execution", { batchEntry, queueEntry });

    batchEntry.endTime = Date.now();
    batchEntry.hasFinished = true;
    if (
      this.batchLongestEndTime == null ||
      batchEntry.endTime > this.batchLongestEndTime
    ) {
      this.batchLongestEndTime = batchEntry.endTime;
    }

    this.logger?.log("resolve", {
      batchEntry,
      queueEntry,
      queue: this.queue,
    });
    this.tick();
    this.emit("resolve", batchEntry.id, error, res);
  }

  public async execute<T>(fn: (...args: any[]) => T): Promise<Awaited<T>> {
    const id = this.enqueue(fn);

    const promise = new Promise<any>(async (resolve, reject) => {
      const clear = () => {
        this.logger?.log("handler-clear", { id });
        this.removeListener("resolve", onResolve);
      };

      const onResolve = (eventId: string, error?: any, res?: any) => {
        if (eventId !== id) return;
        this.logger?.log("handler-resolved", { id, error, res });
        clear();
        if (error != null) return reject(error);
        resolve(res);
      };

      this.addListener("resolve", onResolve);
    });

    this.logger?.log("execute-tick-call", { id });
    this.tick();

    return await promise;
  }
}
