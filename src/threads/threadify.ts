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
  const threadifier = new Threadifier(options, {
    getWrappers: (ctx) => {
      return [
        options.throttler?.execute?.bind(options.throttler),
        options.repeater?.execute?.bind(options.repeater),
      ];
    },
  });

  return threadifier.execute(...entries);
};
