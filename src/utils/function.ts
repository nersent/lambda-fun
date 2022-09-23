export type FunctionWrapper = (
  fn: (...args: any[]) => any,
  ...args: any[]
) => any;

export const wrapFunction = <T extends (...args: any[]) => any>(
  originalFn: T,
  ...wrappers: FunctionWrapper[]
): T => {
  if (wrappers.length === 0) return originalFn;

  const _wrappers = [originalFn, ...wrappers].reverse();

  return _wrappers.reduceRight((prevFn, nextFn) => {
    return (...args: any) => {
      return nextFn(prevFn, ...args);
    };
  }) as T;
};
