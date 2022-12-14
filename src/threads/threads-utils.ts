import { FunctionThread } from "./function-thread";
import { ThreadManagerImpl } from "./thread-manager-impl";

export const createThreadManager = () => {
  let currentId = 0;

  return new ThreadManagerImpl((count: number) => {
    return Array.from({ length: count }).map(() => {
      const id = currentId++;
      return new FunctionThread(id);
    });
  });
};
