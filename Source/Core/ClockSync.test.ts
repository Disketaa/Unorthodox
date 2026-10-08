import { describe, it, expect } from 'vitest';
import { measureClockOffset, tightenClockOffset, hostTimeToLocal } from './ClockSync';

describe('Clock sync', () => {
  it('measures a zero offset when the clocks agree', () => {
    expect(measureClockOffset(1_000_000, 1_000_000)).toBe(0);
  });

  it('measures a negative offset when the host clock runs ahead', () => {
    // The host stamped 5000ms ahead of us, so its timestamps need subtracting.
    expect(measureClockOffset(1_005_000, 1_000_000)).toBe(-5_000);
  });

  it('measures a positive offset when the host clock runs behind', () => {
    expect(measureClockOffset(995_000, 1_000_000)).toBe(5_000);
  });

  it('converts a host timestamp into a local one', () => {
    expect(hostTimeToLocal(1_000_000, -5_000)).toBe(995_000);
    expect(hostTimeToLocal(1_000_000, 0)).toBe(1_000_000);
  });
});

describe('Keeping the room on one clock', () => {
  it('keeps a shorter sample over a longer one, since the trip can only add time', () => {
    expect(tightenClockOffset(120, 80)).toBe(80);
  });

  it('keeps what it has when a later sample is worse, which is a client on a slow link', () => {
    expect(tightenClockOffset(40, 90)).toBe(40);
  });

  it('puts two clients on the same offset out of different latencies, which is the point', () => {
    // One way of the trip is 80ms for the first client and 300ms for the second, so a sample each
    // would leave them counting the same phase from two different starts. The first sample is taken
    // as it stands, since there is nothing yet to narrow it against.
    let near = measureClockOffset(1_000_000, 1_000_080);
    let far = measureClockOffset(1_000_000, 1_000_300);
    expect(near).not.toBe(far);

    // Their later messages come through at a truer 20ms, and both narrow onto it.
    const truth = measureClockOffset(1_010_000, 1_010_020);
    near = tightenClockOffset(near, truth);
    far = tightenClockOffset(far, truth);
    expect(near).toBe(far);
  });

  it('does not follow a longer sample back out, which would undo the narrowing', () => {
    const held = tightenClockOffset(40, 80);
    expect(tightenClockOffset(held, 400)).toBe(40);
  });
});

describe('Countdown after a late catch-up', () => {
  // The countdown formula, mirroring useCountdown without a DOM.
  function remaining(
    durationMs: number,
    startedAtHost: number,
    offsetMs: number,
    now: number
  ): number {
    return Math.max(0, durationMs - (now - hostTimeToLocal(startedAtHost, offsetMs)));
  }

  it('shows the same remaining time on both clocks once the offset is applied', () => {
    const duration = 60_000;
    // The host's clock runs 5s ahead of this device.
    const hostStartedAt = 1_000_000;
    const offset = measureClockOffset(1_005_000, 1_000_000);
    // Locally it is now 1020000, so the host's clock reads 1025000.
    const nowLocal = 1_020_000;

    // The host sees 25s elapsed, so 35s remain.
    expect(remaining(duration, hostStartedAt, 0, nowLocal + 5_000)).toBe(35_000);
    // The client, correcting for the skew, must agree.
    expect(remaining(duration, hostStartedAt, offset, nowLocal)).toBe(35_000);
  });

  it('would drift by the skew without the offset, which is the bug', () => {
    const duration = 60_000;
    const hostStartedAt = 1_000_000;
    const offset = measureClockOffset(1_005_000, 1_000_000);
    const nowLocal = 1_020_000;

    // Uncorrected, the client reads the host's start time against its own clock
    // and ends up 5s behind, the exact drift this removes.
    expect(remaining(duration, hostStartedAt, 0, nowLocal)).toBe(40_000);
    expect(remaining(duration, hostStartedAt, offset, nowLocal)).toBe(35_000);
  });

  it('never goes below zero once the phase is over', () => {
    const duration = 60_000;
    const startedAt = 1_000_000;
    const wellPast = startedAt + 120_000;
    expect(remaining(duration, startedAt, 0, wellPast)).toBe(0);
  });
});
