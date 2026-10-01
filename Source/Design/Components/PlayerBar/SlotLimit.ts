/** The token the slot count is declared in, read from the page rather than imported. */
const SlotsToken = '--Layout-PlayerBarSlots';

/**
 * What the bar falls back to when the page has not declared the token.
 *
 * A test runner and a page that has not loaded `Tokens.css` both land here, and a bar
 * that drew one slot instead of sixteen would be a worse answer than a stale number.
 * `Scripts/PlayerBarLayout.test.ts` holds the two to each other.
 */
export const FallbackSlots = 16;

/**
 * How many slots the bar holds.
 *
 * Read off the document because the count is a design decision rather than a game's:
 * `GameConfig.limits` is about who may sit in a room, and Design may not read Game. The
 * token is the same one the stylesheet would use, so editing it moves the bar.
 */
export function slotLimit(): number {
  const declared = getComputedStyle(document.documentElement).getPropertyValue(SlotsToken);
  const value = Number.parseInt(declared, 10);
  return Number.isFinite(value) && value > 0 ? value : FallbackSlots;
}