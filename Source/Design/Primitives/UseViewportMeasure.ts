import { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';

/**
 * Runs a measurement now and again whenever the window is resized.
 *
 * Both of the things in the game that measure themselves do it the same way — once on mount,
 * then on every `resize`, then not at all. A theme card's turn is a fact about where the
 * card is on the screen, and a block centred in the viewport is a fact about how much room
 * is above it; both change when the window does, and neither changes when anything else on
 * the page does. Measuring only on mount is right for a static layout and wrong for both of
 * these.
 *
 * The listener is taken from the node's own document rather than a global, so a card measured
 * in a document with no window — a test, a server render — simply never measures again
 * rather than throwing on a null.
 *
 * A hook and not a component, because the node it measures is one the caller already has and
 * a wrapper would be a box sized for nothing. That is the same reason the sway is a hook.
 */
export function useViewportMeasure(
  node: RefObject<HTMLElement | null>,
  measure: () => void,
): void {
  useEffect(() => {
    const element = node.current;
    if (element === null) {
      return;
    }
    measure();
    const viewport = element.ownerDocument.defaultView;
    viewport?.addEventListener('resize', measure);
    return () => viewport?.removeEventListener('resize', measure);
  }, [node, measure]);
}
