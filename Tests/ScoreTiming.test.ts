import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { GameConfig } from '../Source/Game';
import {
  FallbackScoreCountMs,
  FallbackScoreMarkHoldMs,
} from '../Source/Design/Components/ScoreTiming';
import { tokenReader } from './Stylesheet';

const tokens = readFileSync(new URL('../Source/Design/Tokens.css', import.meta.url), 'utf8');
const tokenMs = (name: string): number => Number(tokenReader(tokens)(name).replace('ms', ''));

/** The two lengths a card's count is measured against, however many places hold them. */
const CountMs = 375;
const MarkHoldMs = 160;

describe('the count on a card', () => {
  it('is the same length for the page as for the code that walks the board', () => {
    // The page reads the token, the host counts against `GameConfig`, and the design falls
    // back where no stylesheet was loaded: three copies, one number, and this is the only
    // thing that knows all three saw the same one.
    expect(tokenMs('--Duration-ScoreCount')).toBe(CountMs);
    expect(GameConfig.timing.scoreCountMs).toBe(CountMs);
    expect(FallbackScoreCountMs).toBe(CountMs);
  });

  it('holds its mark for the same minimum wherever the number is read from', () => {
    // The mark's floor is what guarantees the room gets to read what a step is adding, so it
    // is the one number the count, the card and the walk all have to agree on.
    expect(tokenMs('--Duration-ScoreMarkHold')).toBe(MarkHoldMs);
    expect(GameConfig.timing.scoreMarkHoldMs).toBe(MarkHoldMs);
    expect(FallbackScoreMarkHoldMs).toBe(MarkHoldMs);
  });
});
