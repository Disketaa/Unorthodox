import { GameConfig } from './GameConfig';

/** How long the board spends on one card before moving to the next: the figure counting up, the
 * addition figure held, the pause, the total held, and the pause before the next card starts.
 * Every screen works it out from this one number, not from a copy of the sum of its own. */
export function countStepMs(): number {
  return (
    GameConfig.timing.scoreCountMs +
    GameConfig.timing.scoreAddedHoldMs +
    GameConfig.timing.scoreGapMs +
    GameConfig.timing.scoreTotalHoldMs +
    GameConfig.timing.scoreGapMs
  );
}

/** How long the count runs for a board of this many cards, and so how long the phase drawing it
 * has to last: the drama beat, one turn per card, and the board left standing. Where the room
 * is shown its places is a phase of its own, and its own length. */
export function scoresDurationMs(cards: number): number {
  return (
    GameConfig.timing.scoreDramaDelayMs +
    countStepMs() * Math.max(0, cards) +
    GameConfig.timing.scoreBoardLingerMs
  );
}
