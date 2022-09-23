export type FunctionWrapper = (
  fn: (...args: any[]) => any,
  ...args: any[]
) => any;

export const wrapFunction = <T extends (...args: any[]) => any>(
  originalFn: T,
  ...wrappers: (FunctionWrapper | undefined)[]
): T => {
  if (wrappers == null || wrappers.length === 0) return originalFn;
  const _wrappers = [
    originalFn,
    ...wrappers.filter((r) => r != null),
  ] as FunctionWrapper[];

  return _wrappers.reduce((prevFn, nextFn) => {
    return (...args: any) => {
      return nextFn(prevFn, ...args);
    };
  }) as T;
};
