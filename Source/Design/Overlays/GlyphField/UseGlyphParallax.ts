import { useEffect, useRef } from 'preact/hooks';
import { startGlyphParallax } from './GlyphParallaxDriver';

/**
 * Turns page scroll into one shared offset for the whole field.
 *
 * Written as a custom property on the root, so each mark can scale it by its own
 * depth in the stylesheet. That is the whole trick: one value here, parallax
 * everywhere, and no per-mark JavaScript at all.
 *
 * Scroll is the only input. The pointer is not listened to at all, so neither a
 * mouse nor a finger dragging or panning the screen moves the field; a touch
 * that scrolls the page moves it exactly as much as a wheel does. All smoothing
 * lives in the driver, on the animation frame, so that two fast scrolls cannot
 * produce two fast jumps.
 */
export function useGlyphParallax(): { current: HTMLDivElement | null } {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (node === null) {
      return;
    }

    const driver = startGlyphParallax(node);
    return () => {
      driver.stop();
    };
  }, []);

  return ref;
}
