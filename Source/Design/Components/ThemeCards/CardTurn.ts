/**
 * How far one card is turned, as a pure function of where it sits.
 *
 * The bank closes towards the middle of the viewport rather than towards the middle of
 * the row, which is what makes a card at the end of a wrapped row turn the same way as
 * one directly beside the centre. It also means the turn is a measurement rather than a
 * position: the row's own width changes with the window, so a card's distance from the
 * middle of the screen changes with it, and an angle written per position would be right
 * at exactly one width.
 *
 * The divisor is the viewport's half-size rather than the row's, so the outermost card
 * turns by the same amount on a phone and on a desktop: a card is turned by how far off
 * the middle of the screen it is, which is what the middle of the screen means.
 *
 * Offsets are signed — negative above the middle of the screen, negative left of it — and
 * the result is signed with them. So a card right of the middle is given a positive
 * `rotateY`, which brings its left edge towards the viewer, and a card below the middle a
 * positive `rotateX`, which tips its top edge back towards it.
 *
 * That is the bank facing in: the six close on the player the way a fan of cards is held
 * out in front of somebody, rather than leaning away from the middle as a ring of panels
 * turned towards the room would. A card exactly on the middle is unturned either way, so
 * only the outer four of the six show the difference.
 *
 * Both axes take the offset's sign here because the two rotations do not agree about
 * which way is positive in the first place: `rotateY` brings a card's near edge towards
 * the viewer and `rotateX` pushes its top edge away, so the vertical offset has to be
 * compared against the same convention rather than copied from the horizontal one.
 *
 * Held at the full angle once a card is a whole half-viewport out, rather than continuing
 * past it: there is nothing further out to aim at, and an unbounded turn is how a card
 * ends up edge-on and unreadable.
 */
export function turnFor(offset: number, halfViewport: number, maxDegrees: number): number {
  if (halfViewport <= 0) {
    return 0;
  }
  const share = Math.max(-1, Math.min(1, offset / halfViewport));
  const turn = share * maxDegrees;
  // The two zeroes a signed angle can produce are the same angle, and `-0` is not `0` to
  // a test or to a stylesheet reading the value back.
  return turn === 0 ? 0 : turn;
}
