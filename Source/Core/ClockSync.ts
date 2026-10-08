/** Clock skew between this device and the host, in milliseconds. The host's `Date.now()` is not
 * comparable with a client's, so the skew is `receivedAt - hostNow`. Measured on receipt, which
 * folds one-way latency in: harmless for a countdown in tens of seconds. */
export interface ClockSync {
  offsetMs: number;
}

export function measureClockOffset(hostNow: number, receivedAt: number): number {
  return receivedAt - hostNow;
}

/** The offset to keep, of one measured and one already held. The shortest sample wins, since
 * every sample carries at least one way of the trip and none less than zero. Taking the latest
 * instead leaves each client on its own latency, so two count one phase apart from each other. */
export function tightenClockOffset(previous: number, measured: number): number {
  return Math.min(previous, measured);
}

/** One device's narrowing of its skew against the host, over every message it has been sent. *
 * Held apart from the session that receives them, so the filter is one thing with one rule
 * rather than a pair of fields and a branch wherever a message lands. */
export class ClockFollow {
  private offsetMs = 0;
  private sampled = false;

  /** The offset to hold after a message stamped at `hostNow` and received at `receivedAt`. The *
   * first one is taken as it stands: there is nothing yet to narrow it against, and zero is the
   * absence of an offset rather than one. */
  read(hostNow: number, receivedAt: number): number {
    const measured = measureClockOffset(hostNow, receivedAt);
    if (this.sampled === false) {
      this.sampled = true;
      this.offsetMs = measured;
    } else {
      this.offsetMs = tightenClockOffset(this.offsetMs, measured);
    }
    return this.offsetMs;
  }

/** The offset held so far. Zero until a message arrives, which is as near the host as a device *
 * that has not heard from it can honestly say. */
  get offset(): number {
    return this.offsetMs;
  }
}

export function hostTimeToLocal(hostTimestamp: number, offsetMs: number): number {
  return hostTimestamp + offsetMs;
}
