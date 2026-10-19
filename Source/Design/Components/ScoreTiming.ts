/** The tokens a card's count is measured in, read from the page rather than imported: the design
 * may not read Game, and `GameConfig.timing` holds the same two numbers for the code that walks
 * the board. */
const ScoreCountToken = '--Duration-ScoreCount';
const ScoreMarkHoldToken = '--Duration-ScoreMarkHold';

/** What the count falls back to where the page has not declared the tokens — a test runner and a
 * page that has not loaded `Tokens.css` both land here, and `Tests/ScoreTiming.test.ts` holds
 * these copies to the tokens so they cannot drift. */
export const FallbackScoreCountMs = 375;
export const FallbackScoreMarkHoldMs = 160;

function readMs(token: string, fallback: number): number {
  const declared = getComputedStyle(document.documentElement).getPropertyValue(token);
  const value = Number.parseFloat(declared);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** How long one card's count is given across every line it pays: the budget the lines divide
 * between themselves, so a count is over inside the card's own turn on the board. */
export function scoreCountMs(): number {
  return readMs(ScoreCountToken, FallbackScoreCountMs);
}

/** How long the mark stands in the figure's place at the very least: the one moment a card says
 * what it is adding, and the room is not rushed through it however the line is sized. */
export function scoreMarkHoldMs(): number {
  return readMs(ScoreMarkHoldToken, FallbackScoreMarkHoldMs);
}
