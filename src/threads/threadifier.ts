import { IThrottler } from "../throttler/throttler-types";
import { IRepeater } from "../repeater/repeater-types";
import { IQueue } from "../queue/queue-types";

export type ThreadifierOptions = {
  //   threads: number;
  //   repeaterOptions?: RepeaterExecuteOptions;
  //   throttler?: Throttler;
  //   queueOptions?: Partial<QueueOptions & { verbosePath?: string }>;
  //   printItemsOnError?: boolean;
  // } & (
  //   | {
  //       rejectOnError?: boolean;
  //     }
  //   | {
  //       exitProcessOnError?: boolean;
  //     }
  onError?: ThreadifierOnErrorOptions;
};

export type ThreadifierOnErrorOptions = { printItems?: boolean } & (
  | {
      reject?: boolean;
    }
  | {
      exitProcess?: boolean;
    }
);

export interface ThreadifierDelegates {
  queue?: IQueue;
  repeater?: IRepeater;
  throttler?: IThrottler;
}

export class Threadifier {
  protected isExecuting = false;

  constructor(
    protected readonly delegates: ThreadifierDelegates,
    public readonly options?: ThreadifierOptions,
  ) {}

  public async execute(...fns: ((...args: any[]) => any)[]) {
    if (this.isExecuting)
      throw new ThreadifierAlreadyRunning("Threadifier is already running");
    this.isExecuting = true;

    // if (fns.length === 0) return [];

    this.isExecuting = false;
  }
}

export class ThreadifierAlreadyRunning extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ThreadifierAlreadyRunning.prototype);
  }
}
