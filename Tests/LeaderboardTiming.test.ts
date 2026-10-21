import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { GameConfig } from '../Source/Game';
import {
  FallbackPlaceMs,
  FallbackReorderDelayMs,
  FallbackWaveMs,
} from '../Source/Design/Components/Leaderboard/LeaderboardShow';
import { tokenReader } from './Stylesheet';

const tokens = readFileSync(new URL('../Source/Design/Tokens.css', import.meta.url), 'utf8');
const tokenMs = (name: string): number => Number(tokenReader(tokens)(name).replace('ms', ''));

describe('the standing list', () => {
  it('arrives on the same beat for the page as for the code that opens the phase', () => {
    // The page reads the tokens, the host measures the phase against `GameConfig`, and the design
    // falls back where no stylesheet was loaded: three copies, one number, and this is the only
    // thing that knows all three saw the same one.
    expect(tokenMs('--Duration-LeaderboardWave')).toBe(FallbackWaveMs);
    expect(GameConfig.timing.leaderboardWaveMs).toBe(FallbackWaveMs);
    expect(tokenMs('--Duration-LeaderboardPlace')).toBe(FallbackPlaceMs);
    expect(GameConfig.timing.leaderboardPlaceMs).toBe(FallbackPlaceMs);
    expect(tokenMs('--Delay-LeaderboardReorder')).toBe(FallbackReorderDelayMs);
    expect(GameConfig.timing.leaderboardReorderDelayMs).toBe(FallbackReorderDelayMs);
  });

  it('holds the list for the slide it gives its places', () => {
    // The slide is the page's own — no code walks it — so the token and the config are the two
    // copies of one number, and the phase has to hold the list long enough for the last place to
    // come to rest in its new order.
    expect(tokenMs('--Duration-LeaderboardReorder')).toBe(
      GameConfig.timing.leaderboardReorderMs
    );
  });
});
