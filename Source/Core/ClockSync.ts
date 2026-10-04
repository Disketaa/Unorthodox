/**
 * Clock skew between this device and the host, in milliseconds.
 *
 * The host stamps phase start times with its own `Date.now()`, which is not comparable with a
 * client's. Every state message carries the host's time, so the skew can be measured as
 * `receivedAt - hostNow`. A negative offset means the host's clock is ahead, so the phase
 * started further in the past here.
 *
 * The measurement is taken on receipt, which folds the one-way latency into the offset. That is
 * harmless for a countdown measured in tens of seconds.
 */
export interface ClockSync {
  offsetMs: number;
}

export function measureClockOffset(
  hostNow: number,
  receivedAt: number
): number {
  return receivedAt - hostNow;
}

export function hostTimeToLocal(
  hostTimestamp: number,
  offsetMs: number
): number {
  return hostTimestamp + offsetMs;
}
