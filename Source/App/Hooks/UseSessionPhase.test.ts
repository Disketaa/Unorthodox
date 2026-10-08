import { describe, it, expect } from 'vitest';
import { useSessionPhase } from './UseSessionPhase';
import { GameConfig } from '@/Game';
import type { PublicChoosingState } from '@/Game';

/** The bank as the host sends it, with the clock's own length and however much of it is
 * count-in. */
function choosing(
  durationMs: number,
  leadInMs: number,
  startedAt: number
): PublicChoosingState {
  return {
    phase: 'Choosing',
    players: [],
    turnPlayerId: null,
    pace: 'Standard',
    spent: [],
    paused: false,
    durationMs,
    startedAt,
    leadInMs,
  };
}

const countInMs = GameConfig.timing.startVeilMs + GameConfig.timing.startCountdownMs;

describe('the phase clock a screen is measured against', () => {
  it('is the whole clock where nothing runs before it', () => {
    const phase = useSessionPhase(choosing(20_000, 0, 1000), 0);
    expect(phase.durationMs).toBe(20_000);
    expect(phase.phaseStartedAt).toBe(1000);
  });

  it('starts at the end of the count-in, since that is when the bank can first be pressed', () => {
    // Without this the bank appears showing a bar three seconds short of full, and stays there.
    const phase = useSessionPhase(choosing(20_000 + countInMs, countInMs, 1000), 0);
    expect(phase.phaseStartedAt).toBe(1000 + countInMs);
    expect(phase.durationMs).toBe(20_000);
  });

  it('leaves the share of the bar drawn the same at the moment the room can see it', () => {
    const phase = useSessionPhase(choosing(20_000 + countInMs, countInMs, 1000), 0);
    // Measured from the start of its own clock the bar is the whole of its length, rather than
    // 86% of a clock that included time nobody was watching.
    expect(phase.phaseStartedAt - 1000).toBe(countInMs);
    expect(phase.durationMs).toBe(20_000);
  });

  it('copes with a host too old to have said it had a count-in', () => {
    const old = choosing(20_000, 0, 1000);
    delete old.leadInMs;
    const phase = useSessionPhase(old, 0);
    expect(phase.durationMs).toBe(20_000);
    expect(phase.phaseStartedAt).toBe(1000);
  });

  it('never reports a negative length for a phase whose clock is all count-in', () => {
    expect(useSessionPhase(choosing(100, countInMs, 1000), 0).durationMs).toBe(0);
  });
});
