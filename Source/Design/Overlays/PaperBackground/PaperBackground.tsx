import { useEffect, useRef } from 'preact/hooks';
import styles from './PaperBackground.module.css';

/** How often the texture jumps to a new offset. */
const ShiftIntervalMs = 300;

/** Largest offset in either direction, in pixels. Matches the CSS overscan. */
const MaxShiftPx = 60;

/** A random offset along one axis, the other left alone. */
function randomShift(): { x: number; y: number } {
  const shift = Math.round((Math.random() * 2 - 1) * MaxShiftPx);
  return Math.random() < 0.5 ? { x: shift, y: 0 } : { x: 0, y: shift };
}

/** A seamless paper texture laid over the whole app. Static and repositioned once a second.
 * Because it tiles, any offset stays seamless, and moving one axis keeps the drift the way
 * paper shifts under a lamp. Decorative, so it ignores pointers. */
export function PaperBackground() {
  const texture = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = texture.current;
    if (node === null) {
      return;
    }
    const shift = () => {
      const { x, y } = randomShift();
      // Custom properties rather than a style prop, so the value lives in the
      // stylesheet and the component keeps a closed API.
      node.style.setProperty('--Overlay-TextureX', `${x}px`);
      node.style.setProperty('--Overlay-TextureY', `${y}px`);
    };
    shift();
    const id = setInterval(shift, ShiftIntervalMs);
    return () => clearInterval(id);
  }, []);

  return (
    <div ref={texture} class={styles.Root} aria-hidden="true">
      <div class={styles.Texture} />
    </div>
  );
}
