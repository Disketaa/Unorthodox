import { describe, it, expect } from 'vitest';
import { botAnswers } from './Bot';
import type { HostState } from '@/Game';

const Clock = 60_000;
const RoundStart = 1_000_000;

function writing(): HostState {
  return {
    phase: 'Writing',
    topic: 'a topic',
    durationMs: Clock,
    startedAt: RoundStart,
    answers: new Map(),
    players: new Map([
      ['bot1', { name: 'A', look: { character: 'Butterfly', color: 'Coral' }, isOnline: true }],
      ['bot2', { name: 'B', look: { character: 'Ghost', color: 'Sky' }, isOnline: true }],
      ['bot3', { name: 'C', look: { character: 'Daisy', color: 'Mint' }, isOnline: true }],
    ]),
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themes: [],
    themeMode: 'Random',
    themeRounds: new Map(),
    paused: false,
    pausedAt: undefined,
    theme: undefined,
  };
}

/** A fixed draw that steps by a step, so the spread is the whole range rather than whatever
 * `Math.random` happened to hand back on this run. */
function sequence(step: number): () => number {
  let value = 0;
  return () => {
    value += step;
    return value % 1;
  };
}

/** What share of the clock each answer sits at, which is the number the round scores. */
function shares(answers: readonly { at: number }[]): number[] {
  return answers.map((answer) => (answer.at - RoundStart) / Clock);
}

describe('when a bot answers', () => {
  it('answers inside the clock, and every bot somewhere different', () => {
    const distinct = shares(botAnswers(writing(), sequence(0.137)));
    expect(new Set(distinct).size).toBe(distinct.length);
    for (const share of distinct) {
      expect(share).toBeGreaterThan(0);
      expect(share).toBeLessThan(1);
    }
  });

  it('never answers at the very end of the clock', () => {
    // A bot answering on the last tick is scored exactly like somebody who ran out of time, and the
    // round would be charging for slowness that was the clock's doing rather than the bot's.
    for (const share of shares(botAnswers(writing(), sequence(0.317)))) {
      expect(share).toBeLessThanOrEqual(0.85);
    }
  });

  it('counts its delay from when the round began, not from whenever the pass ran', () => {
    // This runs again after every write to the room, so each pass is asked about the bots still
    // outstanding. Counted from now, every pass pushed the next bot further out by however long
    // the last one had taken, and the last bot in the room ended up answering after the clock — at
    // which point the round scores it at nothing and a room of bots reads as a room of zeros.
    const first = shares(botAnswers(writing(), sequence(0.4)));
    const second = shares(botAnswers(writing(), sequence(0.4)));
    expect(second).toEqual(first);
  });

  it('has a bot near the start and a bot much later, over a whole run', () => {
    let earliest = 1;
    let latest = 0;
    for (let run = 0; run < 40; run += 1) {
      for (const share of shares(botAnswers(writing(), Math.random))) {
        earliest = Math.min(earliest, share);
        latest = Math.max(latest, share);
      }
    }
    // The whole point of the spread: the speed scale is a curve, and a board of bots all on its top
    // end is a board testing nothing.
    expect(earliest).toBeLessThan(0.2);
    expect(latest).toBeGreaterThan(0.5);
  });

  it('scores across the curve rather than at one point of it', () => {
    // Not every bot on the same figure: the speed scale pays most for being early, so a spread
    // that barely moves the score is a spread that is not being felt.
    const scored = new Set<number>();
    for (let run = 0; run < 60; run += 1) {
      for (const share of shares(botAnswers(writing(), Math.random))) {
        scored.add(Math.round(20 * Math.pow(1 - share, 1.5)));
      }
    }
    expect(scored.size).toBeGreaterThanOrEqual(4);
  });
});
