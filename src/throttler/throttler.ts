import { QueueEventRecorder } from "../queue/queue-event-recorder";
import { Observable } from "../utils/observable";

// write a class that has a method called execute which accepts a function and throttles execution of that function based on the options passed to the constructor. The options passed to the constructor are: time frame and number of calls per that time frame
export interface ThrottlerOptions {
  time: number;
  count: number;
}

export type ThrottlerObserverMap = {
  lock: () => void;
  unlock: () => void;
};

interface ThrottlerBatchEntry {
  startTime: number;
  endTime?: number;
  hasFinished: boolean;
}

export type ThrottlerEventRecorderType =
  | "free-batch-call"
  | "free-batch-clear"
  | "set-unlock-timeout-undefined-unlock-time"
  | "set-unlock-timeout"
  | "unlock-timeout"
  | "before-execution"
  | "after-execution"
  | "before-resolve"
  | "handle-call"
  | "handle-remove-listeners";

export class Throttler extends Observable<ThrottlerObserverMap> {
  private currentBatch: ThrottlerBatchEntry[] = [];

  private unlockTime: number | undefined = undefined;

  private unlockTimeout: NodeJS.Timeout | undefined = undefined;

  private recorder = new QueueEventRecorder<ThrottlerEventRecorderType>(false);

  constructor(private readonly options: ThrottlerOptions) {
    super();
  }

  public isLocked() {
    return this.currentBatch.length >= this.options.count;
  }

  private freeBatch(now: number = Date.now()) {
    this.recorder?.register("free-batch-call");

    const finishedEntries = this.currentBatch.filter(
      (entry) => entry.hasFinished,
    );

    if (finishedEntries.length === 0) {
      return;
    }

    if (this.currentBatch.length === finishedEntries.length) {
      // descending order
      const sortedEntriesByEndTime = finishedEntries.sort(
        (a, b) => b.endTime! - a.endTime!,
      );

      // const oldestStartTimeEntry = finishedEntries[0];
      const latestEndTimeEntry = sortedEntriesByEndTime[0];

      this.unlockTime = latestEndTimeEntry.endTime! + this.options.time;

      if (now - latestEndTimeEntry.endTime! < this.options.time) {
        this.recorder?.register("free-batch-clear", {
          now,
          latestEndTimeEntry,
          unlockTime: this.unlockTime,
          time: this.options.time,
          batch: this.currentBatch,
        });
        this.currentBatch = [];
        this.unlockTime = undefined;
      }
    }
  }

  private setUnlockTimeout() {
    if (this.unlockTime != null) {
      const delta = this.unlockTime - Date.now();

      this.recorder?.register("set-unlock-timeout", {
        unlockTime: this.unlockTime,
        delta,
      });

      clearTimeout(this.unlockTimeout);
      this.unlockTimeout = setTimeout(() => {
        if (this.isLocked()) return;
        this.emit("unlock");
        this.recorder?.register("unlock-timeout");
      }, delta);
    } else {
      this.recorder?.register("set-unlock-timeout-undefined-unlock-time");
    }
  }

  public execute(fn: (...args: any[]) => any, data: any) {
    return new Promise<any>(async (resolve, reject) => {
      const removeListeners = () => {
        this.recorder.register("handle-remove-listeners", { data });
        this.removeListener("unlock", handle);
      };

      const handle = async () => {
        this.recorder?.register("handle-call", {
          data,
          isLocked: this.isLocked(),
        });

        if (this.isLocked()) {
          this.freeBatch();
          this.setUnlockTimeout();
          return;
        }

        const entry = {
          startTime: Date.now(),
          hasFinished: false,
        } as ThrottlerBatchEntry;

        this.currentBatch.push(entry);

        this.recorder?.register("before-execution", { data });
        const res = await fn();
        this.recorder?.register("after-execution", { data });
        removeListeners();

        entry.endTime = Date.now();
        entry.hasFinished = true;

        this.recorder?.register("before-resolve", {
          data,
          entry,
          entryIndex: this.currentBatch.indexOf(entry),
        });

        this.freeBatch();

        if (this.unlockTime == null) {
          handle();
        } else {
          this.setUnlockTimeout();
        }

        resolve(res);
      };

      this.on("unlock", handle);

      handle();
    });
    //   return new Promise<any>(async (resolve, reject) => {
    //     const now = Date.now();
    //     if (this.isLocked) {
    //       this.once("unlock", () => {
    //         // console.log("on unlock");
    //         console.log(data);
    //         resolve(data);
    //       });
    //     } else {
    //       if (this.startTime == null) {
    //         this.startTime = now;
    //       }
    //       console.log(data);
    //       if (++this.counter >= this.options.count) {
    //         this.lock();
    //         // console.log("lock");
    //       }
    //       resolve(data);
    //       // console.log("lock");
    //     }
    //   });
    // }
  }
}
