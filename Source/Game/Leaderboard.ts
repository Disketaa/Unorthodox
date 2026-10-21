/** How long the room is shown where it stands, worked out from the room rather than written
 * down: the places arrive in a wave, so a list for twelve takes longer to come up than one for
 * three. The phase table quotes a floor and the host reads the real length here. */
import { GameConfig } from './GameConfig';

/** How long the wave of places takes to arrive: one beat between each, and the last place's own
 * moment coming up. The list is built from the last place up, so a room of one has no wave. */
function waveMs(places: number): number {
  const timing = GameConfig.timing;
  return Math.max(0, places - 1) * timing.leaderboardWaveMs + timing.leaderboardPlaceMs;
}

/** How long the room stands at the list, for a room of this many places: every place arrives in
 * the wave, every figure is counted together over one count, and then the list slides into the
 * order those figures put it in. */
export function standingsDurationMs(places: number): number {
  const timing = GameConfig.timing;
  return (
    waveMs(places) +
    timing.scoreCountMs +
    timing.leaderboardReorderDelayMs +
    timing.leaderboardReorderMs +
    timing.leaderboardLingerMs
  );
}
