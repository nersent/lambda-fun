import { makeId } from "../../utils/string";
import { Thread } from "./thread";

export const createThread = <T = void>(id: string = makeId(8)) => {
  return new Thread<T>(id);
};
