import { describe, expect, it } from 'vitest';
import { SpeedTracker } from './MotionSample';

describe('SpeedTracker', () => {
  it('reads zero before there is any movement to measure', () => {
    const speed = new SpeedTracker();
    speed.reset(100, 0);
    expect(speed.velocity()).toBe(0);
  });

  it('measures how fast the pointer is travelling left', () => {
    const speed = new SpeedTracker();
    speed.reset(200, 0);
    speed.add(180, 100);
    expect(speed.velocity()).toBeCloseTo(0.2);
  });

  it('reports the opposite sign when the pointer travels right', () => {
    const speed = new SpeedTracker();
    speed.reset(100, 0);
    speed.add(140, 100);
    expect(speed.velocity()).toBeCloseTo(-0.4);
  });

  /**
   * A sharp flick can reach the row as two events a long way apart, because the
   * browser coalesces the ones in between. Measuring across that gap still gives
   * the speed the pointer actually had.
   */
  it('measures across a gap between coalesced events', () => {
    const speed = new SpeedTracker();
    speed.reset(300, 0);
    speed.add(40, 200);
    expect(speed.velocity()).toBeCloseTo(1.3);
  });

  it('ignores where the pointer was long ago, so a slow start is not a fast flick', () => {
    const speed = new SpeedTracker();
    speed.reset(300, 0);
    speed.add(280, 400);
    speed.add(276, 420);
    expect(speed.velocity()).toBeCloseTo(0.2);
  });

  it('never reports a division by zero when two samples share a timestamp', () => {
    const speed = new SpeedTracker();
    speed.reset(100, 50);
    speed.add(80, 50);
    expect(speed.velocity()).toBe(0);
  });
});
