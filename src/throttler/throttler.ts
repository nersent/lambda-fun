import { makeId } from "../utils";
import { QueueEventRecorder } from "../queue/queue-event-recorder";
import { Observable } from "../utils/observable";

export interface ThrottlerOptions {
  time: number;
  count: number;
}

export type ThrottlerObserverMap = {
  resolve: (id: string, error?: any, data?: any) => void;
};

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

export type ThrottlerEventRecorderType =
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

export class Throttler extends Observable<ThrottlerObserverMap> {
  private queue: ThrottlerQueueEntry[] = [];

  private batch: ThrottlerBatchEntry[] = [];

  private batchLongestEndTime: number | undefined = undefined;

  private timeout: NodeJS.Timeout | undefined = undefined;

  private recorder: QueueEventRecorder<ThrottlerEventRecorderType> | undefined =
    undefined;

  constructor(public readonly options: ThrottlerOptions) {
    super();
  }

  public isLocked() {
    return this.batch.length >= this.options.count;
  }

  private freeBatch(now: number = Date.now()) {
    this.recorder?.register("free-batch", {
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

      this.recorder?.register("reset-batch-request", {
        now,
        delta,
        optionsTime: this.options.time,
        batch: this.batch,
      });

      if (delta >= this.options.time) {
        this.recorder?.register("reset-batch", {
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

  private enqueue(fn: (...args: any[]) => any, data: any) {
    const id = makeId();
    this.queue.push({ id, fn, data } as any);
    return id;
  }

  private tick() {
    this.recorder?.register("tick");

    while (true) {
      if (this.isLocked()) {
        clearTimeout(this.timeout);

        const canProceed = this.freeBatch();
        this.recorder?.register("tick-is-locked", {
          canProceed,
          batchLongestEndTime: this.batchLongestEndTime,
        });

        if (!canProceed) {
          if (this.batchLongestEndTime != null) {
            const now = Date.now();
            const delta = this.batchLongestEndTime + this.options.time - now;
            this.recorder?.register("set-timeout", {
              now,
              delta,
              optionsTime: this.options.time,
            });
            if (delta > 0) {
              this.timeout = setTimeout(() => {
                this.recorder?.register("timeout-fired", { delta });
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
        this.recorder?.register("tick-queue-empty");
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
    this.recorder?.register("execute-batch-entry", { batchEntry });

    batchEntry.startTime = Date.now();

    this.recorder?.register("before-execution", {
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

    this.recorder?.register("after-execution", { batchEntry, queueEntry });

    batchEntry.endTime = Date.now();
    batchEntry.hasFinished = true;
    if (
      this.batchLongestEndTime == null ||
      batchEntry.endTime > this.batchLongestEndTime
    ) {
      this.batchLongestEndTime = batchEntry.endTime;
    }

    this.recorder?.register("resolve", {
      batchEntry,
      queueEntry,
      queue: this.queue,
    });
    this.tick();
    this.emit("resolve", batchEntry.id, error, res);
  }

  public async execute(fn: (...args: any[]) => any, data: any) {
    const id = this.enqueue(fn, data);

    const promise = new Promise<any>(async (resolve, reject) => {
      const clear = () => {
        this.recorder?.register("handler-clear", { id, data });
        this.removeListener("resolve", onResolve);
      };

      const onResolve = (eventId: string, error?: any, data?: any) => {
        if (eventId !== id) return;
        this.recorder?.register("handler-resolved", { id, error, data });
        clear();
        if (error != null) return reject(error);
        resolve(data);
      };

      this.addListener("resolve", onResolve);
    });

    this.recorder?.register("execute-tick-call", { id, data });
    this.tick();

    return await promise;
  }
}
