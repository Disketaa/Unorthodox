import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { GameConfig } from '../Source/Game';
import {
  FallbackFlyOutDelayMs,
  FallbackScoreCountMs,
} from '../Source/Design/Components/ScoreTiming';
import { tokenReader } from './Stylesheet';

const tokens = readFileSync(new URL('../Source/Design/Tokens.css', import.meta.url), 'utf8');
const tokenMs = (name: string): number => Number(tokenReader(tokens)(name).replace('ms', ''));

/** The two lengths a card's count is measured against, however many places hold them. */
const CountMs = 560;
const FlyOutDelayMs = 200;

describe('the count on a card', () => {
  it('is the same length for the page as for the code that walks the board', () => {
    // The page reads the token, the host counts against `GameConfig`, and the design falls
    // back where no stylesheet was loaded: three copies, one number, and this is the only
    // thing that knows all three saw the same one.
    expect(tokenMs('--Duration-ScoreCount')).toBe(CountMs);
    expect(GameConfig.timing.scoreCountMs).toBe(CountMs);
    expect(FallbackScoreCountMs).toBe(CountMs);
  });

  it('holds a counted card for the same beat wherever the number is read from', () => {
    // The room's beat with a counted figure before the card is taken away, and the same beat
    // before the note that says what it paid: the page holds the token, the design falls back
    // where no stylesheet was loaded, and this is the only thing that knows both saw the same.
    expect(tokenMs('--Delay-AnswerCardFlyOut')).toBe(FlyOutDelayMs);
    expect(FallbackFlyOutDelayMs).toBe(FlyOutDelayMs);
  });
});
