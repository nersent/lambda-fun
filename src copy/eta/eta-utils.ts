export const computeETA = (
  current: number,
  total: number,
  elapsedSeconds: number,
) => {
  const speed = current / elapsedSeconds;
  const remaining = total - current;
  const eta = remaining / speed;
  return eta;
};
