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
} from './PhaseFlow';
import type { PhaseName } from './PhaseFlow';

/** Every phase, in the order the table declares them. */
const phases: PhaseName[] = ['Lobby', 'Choosing', 'Writing', 'Reviewing', 'Scores', 'Final'];

describe('the phase table', () => {
  it('names a phase for every row, and nothing that is not a row', () => {
    expect(phases).toEqual(['Lobby', 'Choosing', 'Writing', 'Reviewing', 'Scores', 'Final']);
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
    expect(phases.filter(isTimedPhase)).toEqual(['Choosing', 'Writing', 'Reviewing', 'Scores']);
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
    expect(phaseDurationMs('Final', 'Standard')).toBe(0);
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
    // The round ends by choosing again rather than by ending the game.
    expect(phaseAfter('Scores')).toBe('Choosing');
    expect(phaseAfter('Final')).toBeNull();
  });

  it('cycles back to the first phase where the table runs out', () => {
    expect(phaseAfterCycling('Final')).toBe('Lobby');
    expect(phaseAfterCycling('Scores')).toBe('Choosing');
  });
});
