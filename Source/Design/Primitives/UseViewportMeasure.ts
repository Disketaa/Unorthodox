import { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';

/** Runs a measurement now and again whenever the window is resized. A block centred in the
 * viewport is a fact about the room above it. The listener comes from the node's own document,
 * so measuring with no window never measures again rather than throwing. */
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
