import "jest";
import { wrapFunction } from "../function";

describe("Function", () => {
  describe("wrapFunction", () => {
    it("returns the original function if no wrappers are provided", () => {
      const originalFn = () => {};
      expect(wrapFunction(originalFn)).toBe(originalFn);
    });

    it("wrappers the original method using one wrapper", () => {
      const calls: any[] = [];

      const originalFn = (arg: string) => {
        calls.push(`${arg}-original`);
        return arg + "$";
      };

      const wrapper = (nextFn: (...args: any[]) => any, arg: string) => {
        calls.push(`${arg}-first`);
        return nextFn(arg + "$");
      };

      const fn = wrapFunction(originalFn, wrapper);
      const res = fn("_arg");

      expect(res).toBe("_arg$$");
      expect(calls[0]).toEqual("_arg-first");
      expect(calls[1]).toEqual("_arg$-original");
    });

    it("wrappers the original method using more than one wrapper in correct order", () => {
      const calls: any[] = [];

      const originalFn = (arg: string) => {
        calls.push(`${arg}-original`);
        return arg + "$";
      };

      const firstWrapper = (nextFn: (...args: any[]) => any, arg: string) => {
        calls.push(`${arg}-first`);
        return nextFn(arg + "$");
      };

      const secondWrapper = (nextFn: (...args: any[]) => any, arg: string) => {
        calls.push(`${arg}-second`);
        return nextFn(arg + "$");
      };

      const thirdWrapper = (nextFn: (...args: any[]) => any, arg: string) => {
        calls.push(`${arg}-third`);
        return nextFn(arg + "$");
      };

      const fn = wrapFunction(
        originalFn,
        firstWrapper,
        secondWrapper,
        thirdWrapper,
      );

      const res = fn("_arg");

      expect(res).toBe("_arg$$$$");
      expect(calls[0]).toEqual("_arg-third");
      expect(calls[1]).toEqual("_arg$-second");
      expect(calls[2]).toEqual("_arg$$-first");
      expect(calls[3]).toEqual("_arg$$$-original");
    });
  });
});
