import { useRef } from 'preact/hooks';

/** The class the fade hangs off, declared in `Design/Tokens/Tokens.css`. On the body rather than
 * on anything the screens own, because the marks and the paper are fixed layers of the document
 * and a fade on a screen would arrive without them. */
export const PageFadeClass = 'PageFade';

/** Fades the page in on every screen, the first one included. The class is applied while
 * rendering rather than in an effect, and that is the whole of it: the blink this replaces was
 * the effect's doing, painting a new screen fully lit before taking it back. */
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
