import { ThreadManagerImpl } from "./thread-manager-impl";

export const createThreadManager = (threads: number) => {
  return new ThreadManagerImpl(threads);
};
