/** The page's tokens, kept once read: reading a custom property makes the browser recompute the
 * document's style, and a token is a fact about the stylesheet rather than about the frame. */
const values = new Map<string, string>();

/** Drops what was read, because a token may be declared again inside a media query: the screen
 * padding is, and the code that reads it is asking precisely because the window changed shape. */
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => values.clear());
}

/** A token's declared value, following any `var()` in it down to the literal it names. Read from
 * the page rather than imported: Design owns the tokens, but a test runner has no stylesheet. */
export function tokenValue(name: string): string {
  const kept = values.get(name);
  if (kept !== undefined) {
    return kept;
  }
  const view = getComputedStyle(document.documentElement);
  let value = view.getPropertyValue(name).trim();
  for (let depth = 0; value.startsWith('var(') && depth < 8; depth += 1) {
    // var(--x, fallback): the name is everything before the first comma.
    const raw = value.slice(4, -1).trim();
    const comma = raw.indexOf(',');
    const inner = comma === -1 ? raw : raw.slice(0, comma).trim();
    value = view.getPropertyValue(inner).trim();
  }
  // Do not cache an empty value: a read before the stylesheet applies would
  // otherwise poison the cache until the next resize.
  if (value !== '') {
    values.set(name, value);
  }
  return value;
}
