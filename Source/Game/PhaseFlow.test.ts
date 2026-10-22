import { describe, it, expect } from 'vitest';
import { GameConfig } from './GameConfig';
import {
  isPhaseName,
  isTimedPhase,
  PhaseFlow,
  phaseAfter,
  phaseAfterCycling,
  phaseDurationMs,
  phaseGraceMs,
  splashesOnArrival,
} from './PhaseFlow';
import type { PhaseName } from './PhaseFlow';

/** Every phase, in the order the table declares them. */
const phases: PhaseName[] = [
  'Lobby',
  'Choosing',
  'Writing',
  'Reviewing',
  'Scores',
  'Leaderboard',
  'Winning',
];

describe('the phase table', () => {
  it('names a phase for every row, and nothing that is not a row', () => {
    expect(phases).toEqual([
      'Lobby',
      'Choosing',
      'Writing',
      'Reviewing',
      'Scores',
      'Leaderboard',
      'Winning',
    ]);
    expect(isPhaseName('Choosing')).toBe(true);
    expect(isPhaseName('Connecting')).toBe(false);
  });

  it('has no row pointing at a phase that does not exist', () => {
    for (const phase of phases) {
      const next = PhaseFlow[phase].next;
      expect(next === null || isPhaseName(next)).toBe(true);
    }
  });

  it('times the phases a player waits through, and only those', () => {
    expect(phases.filter(isTimedPhase)).toEqual([
      'Choosing',
      'Writing',
      'Reviewing',
      'Scores',
      'Leaderboard',
      'Winning',
    ]);
  });

  it('gives every timed phase a wait the room can measure', () => {
    for (const phase of phases.filter(isTimedPhase)) {
      for (const pace of ['Standard', 'Fast'] as const) {
        expect(phaseDurationMs(phase, pace)).toBeGreaterThan(0);
      }
    }
  });

  it('reads each wait off the pace, so Fast is faster everywhere it applies', () => {
    expect(phaseDurationMs('Writing', 'Fast')).toBeLessThan(
      phaseDurationMs('Writing', 'Standard')
    );
    expect(phaseDurationMs('Reviewing', 'Fast')).toBeLessThan(
      phaseDurationMs('Reviewing', 'Standard')
    );
  });

  it('measures no wait at all for a phase nobody waits out', () => {
    expect(phaseDurationMs('Lobby', 'Standard')).toBe(0);
  });

  it('scores the scores table off the clock rather than off the pace', () => {
    expect(phaseDurationMs('Scores', 'Fast')).toBe(phaseDurationMs('Scores', 'Standard'));
  });

  it('grace only where a late answer is still worth taking', () => {
    expect(phaseGraceMs('Writing')).toBe(GameConfig.timing.graceMs);
    expect(phases.filter((phase) => phaseGraceMs(phase) !== 0)).toEqual(['Writing']);
  });

  it('walks a round in the order the game is played', () => {
    expect(phaseAfter('Lobby')).toBe('Choosing');
    expect(phaseAfter('Choosing')).toBe('Writing');
    expect(phaseAfter('Writing')).toBe('Reviewing');
    expect(phaseAfter('Reviewing')).toBe('Scores');
    // The round is counted, then the room is shown where it stands, and the show that names the
    // winner comes after the standings rather than in place of them.
    expect(phaseAfter('Scores')).toBe('Leaderboard');
    expect(phaseAfter('Leaderboard')).toBe('Choosing');
    expect(phaseAfter('Winning')).toBe('Leaderboard');
  });

  it('cycles back to the first phase where the table runs out', () => {
    expect(phaseAfterCycling('Winning')).toBe('Leaderboard');
    expect(phaseAfterCycling('Leaderboard')).toBe('Choosing');
  });
});

describe('the splash column', () => {
  it('splashes into the two phases the room arrives at with nothing done yet', () => {
    // Before a theme is chosen, and before anyone has voted. Both are moments nobody has acted
    // on, which is what a hand-off is.
    expect(phases.filter(splashesOnArrival)).toEqual(['Choosing', 'Reviewing']);
  });

  it('leaves the phases that have no such moment alone', () => {
    // Writing follows the theme being picked, which the room has already watched happen, and a
    // splash over the end of a round would cover the scores the room is still reading. The places
    // are read the same way: the room is looking at where it stands, and a splash over that
    // would cover the very thing the phase is for.
    expect(splashesOnArrival('Writing')).toBe(false);
    expect(splashesOnArrival('Scores')).toBe(false);
    expect(splashesOnArrival('Leaderboard')).toBe(false);
    expect(splashesOnArrival('Lobby')).toBe(false);
  });

  it('splashes nowhere for a name that is not a row', () => {
    // `Connecting` is this browser's own moment before the host has said anything, so there is
    // no row to ask and no phase to announce.
    expect(splashesOnArrival('Connecting')).toBe(false);
    expect(splashesOnArrival('Nonsense')).toBe(false);
  });
});
