import { IRepeater } from "../repeater/repeater-types";
import { IThrottler } from "../throttler/throttler-types";
import {
  Threadifier,
  ThreadifierEntry,
  ThreadifierOptions,
} from "./threadifier";

export type ThreadifyOptions = ThreadifierOptions & {
  threads: number;
  repeater?: IRepeater;
  throttler?: IThrottler;
};

export const threadify = (
  options: ThreadifyOptions,
  ...entries: ThreadifierEntry[]
) => {
  const threadifier = new Threadifier(
    { threads: options.threads },
    {
      repeater: options.repeater,
      throttler: options.throttler,
    },
  );

  return threadifier.execute(...entries);
};
