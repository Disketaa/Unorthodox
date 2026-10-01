import { useRef } from 'preact/hooks';

/**
 * The class the fade hangs off, declared in `Design/Tokens/Tokens.css`.
 *
 * On the body rather than on anything the screens own, because the marks and the
 * paper are fixed layers of the document and a fade on a screen would arrive
 * without them.
 */
export const PageFadeClass = 'PageFade';

/**
 * Fades the page in on every screen, the first one included.
 *
 * The class is applied while rendering rather than in an effect, and that is the
 * whole of it. The blink this replaces was exactly the effect's doing: a new
 * screen was rendered and painted fully lit, and only then did the effect put the
 * class on and take the page back to nothing to fade it up from there. Applied
 * during the render, the browser's next paint is already the first frame of the
 * fade, whichever screen is on.
 *
 * Once per screen rather than once per render, because a screen re-renders as
 * often as its data changes — a countdown, a roster, a vote — and a fade on each
 * of those would have the page pulsing under the player's hands.
 *
 * The class is removed and put back rather than left on, because an animation only
 * runs when its name is newly applied: a body that kept the class would stay lit
 * for every page after the one it was added for. Reading a layout property between
 * the two is what tells the browser the change happened.
 */
export function usePageEnter(): void {
  const entered = useRef(false);
  if (entered.current) {
    return;
  }
  entered.current = true;

  document.body.classList.remove(PageFadeClass);
  void document.body.offsetHeight;
  document.body.classList.add(PageFadeClass);
}
