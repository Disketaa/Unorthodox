import { useEffect, useRef } from 'preact/hooks';
import styles from './TextureOverlay.module.css';

/** How often the texture jumps to a new offset. */
const ShiftIntervalMs = 300;

/** Largest offset in either direction, in pixels. Matches the CSS overscan. */
const MaxShiftPx = 60;

/** The same movement over something smaller: a bar is a fraction of the page, and a shift meant
 * for the whole window would walk the stone out from under it. */
const LocalMaxShiftPx = 16;

/** A random offset along one axis, the other left alone. */
function randomShift(max: number): { x: number; y: number } {
  const shift = Math.round((Math.random() * 2 - 1) * max);
  return Math.random() < 0.5 ? { x: shift, y: 0 } : { x: 0, y: shift };
}

/** Which texture is laid over the page. */
export type TextureOverlayVariant = 'Paper' | 'Stone';

/** Where the texture is laid. */
export type TextureOverlayPlacement = 'Page' | 'Local';

export interface TextureOverlayProps {
  /** The texture laid over the app. */
  variant: TextureOverlayVariant;
  /** Whether the texture is over the whole page or over the thing it is put on. */
  placement?: TextureOverlayPlacement;
}

/** A texture laid over the app, drifting the way paper shifts under a lamp. One overlay for
 * every texture the page wears, so a second one is a line here rather than a second copy of the
 * movement. Because the textures tile, any offset stays seamless. */
export function TextureOverlay({ variant, placement = 'Page' }: TextureOverlayProps) {
  const texture = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = texture.current;
    if (node === null) {
      return;
    }
    const shift = () => {
      const { x, y } = randomShift(placement === 'Page' ? MaxShiftPx : LocalMaxShiftPx);
      // Custom properties rather than a style prop, so the value lives in the
      // stylesheet and the component keeps a closed API.
      node.style.setProperty('--Overlay-TextureX', `${x}px`);
      node.style.setProperty('--Overlay-TextureY', `${y}px`);
    };
    shift();
    // Paced by this device's own clock rather than by the timer: a run whose timers are sped up
    // would otherwise shift the stone hundreds of times a second, and the drift is meant to be
    // something the eye barely catches.
    let shiftedAt = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      if (now - shiftedAt < ShiftIntervalMs) return;
      shiftedAt = now;
      shift();
    }, ShiftIntervalMs);
    return () => clearInterval(id);
  }, [placement]);

  return (
    <div
      ref={texture}
      class={`${styles.Root} ${styles[variant]} ${styles[placement]}`}
      aria-hidden="true"
    >
      <div class={styles.Texture} />
    </div>
  );
}
