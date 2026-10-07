/** Clock skew between this device and the host, in milliseconds. The host's `Date.now()` is not
 * comparable with a client's, so the skew is `receivedAt - hostNow`. Measured on receipt, which
 * folds one-way latency in: harmless for a countdown in tens of seconds. */
export interface ClockSync {
  offsetMs: number;
}

export function measureClockOffset(hostNow: number, receivedAt: number): number {
  return receivedAt - hostNow;
}

export function hostTimeToLocal(hostTimestamp: number, offsetMs: number): number {
  return hostTimestamp + offsetMs;
}
