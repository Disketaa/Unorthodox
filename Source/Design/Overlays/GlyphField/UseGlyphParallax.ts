import { useEffect, useRef } from 'preact/hooks';
import { startGlyphParallax } from './GlyphParallaxDriver';

/**
 * Turns page scroll into one shared offset for the whole field.
 *
 * Written as a custom property on the root, so each mark scales it by its own depth in the
 * stylesheet: one value here, parallax everywhere, and no per-mark JavaScript at all.
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
