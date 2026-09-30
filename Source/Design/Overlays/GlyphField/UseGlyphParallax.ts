import { useEffect, useRef } from 'preact/hooks';
import { startGlyphParallax } from './GlyphParallaxDriver';

/**
 * Turns scroll and pointer movement into one shared offset for the whole field.
 *
 * Written as a custom property on the root, so each mark can scale it by its own
 * depth in the stylesheet. That is the whole trick: one value here, parallax
 * everywhere, and no per-mark JavaScript at all.
 *
 * The hook only reports where the pointer is and where the page has scrolled.
 * All smoothing lives in the driver, on the animation frame, so that two fast
 * moves cannot produce two fast jumps.
 */
export function useGlyphParallax(): { current: HTMLDivElement | null } {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (node === null) {
      return;
    }

    const driver = startGlyphParallax(node);
    const onPointerMove = (event: PointerEvent) => {
      driver.aim({
        x: event.clientX - window.innerWidth / 2,
        y: event.clientY - window.innerHeight / 2,
      });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      driver.stop();
    };
  }, []);

  return ref;
}