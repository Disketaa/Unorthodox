import { describe, it, expect } from 'vitest';
import { GameConfig } from './GameConfig';
import { standingsDurationMs } from './Leaderboard';

describe('how long the standing list runs for a room', () => {
  it('takes longer to come up for a fuller room', () => {
    // The places arrive one after another from the last place up, so a room of a dozen is a longer
    // wave than a room of three. A length that did not grow with the room was the first places on
    // a full list being moved on before the last of them had come up.
    const timing = GameConfig.timing;
    expect(standingsDurationMs(12) - standingsDurationMs(12 - 1)).toBe(
      timing.leaderboardWaveMs
    );
  });

  it('counts every figure in one beat, however many places there are', () => {
    // Counting together rather than one place at a time is what makes the list one number climbing
    // in a dozen places at once. A length that grew per place was the room waiting out a count it
    // had already seen.
    const timing = GameConfig.timing;
    const rest =
      timing.scoreCountMs +
      timing.leaderboardReorderDelayMs +
      timing.leaderboardReorderMs +
      timing.leaderboardLingerMs;
    expect(standingsDurationMs(12)).toBe(
      (12 - 1) * timing.leaderboardWaveMs + timing.leaderboardPlaceMs + rest
    );
    expect(standingsDurationMs(12) - standingsDurationMs(3)).toBe(9 * timing.leaderboardWaveMs);
  });

  it('opens on the wave and ends with the list left standing', () => {
    // Both ends are part of the show rather than slack around it: the places arrive from the last
    // up before any of the figures is counted, and the rearranged list is left for the room to read
    // before the round is taken away. A tail the clock runs out during is a tail nobody saw, so it
    // has to be inside the length rather than after it.
    const timing = GameConfig.timing;
    expect(standingsDurationMs(3)).toBe(
      (3 - 1) * timing.leaderboardWaveMs +
        timing.leaderboardPlaceMs +
        timing.scoreCountMs +
        timing.leaderboardReorderDelayMs +
        timing.leaderboardReorderMs +
        timing.leaderboardLingerMs
    );
  });

  it('still gives a room of nobody a moment at the list', () => {
    // A phase that ran for literally nothing would move the room on the frame it arrived.
    expect(standingsDurationMs(0)).toBeGreaterThan(0);
  });
});
