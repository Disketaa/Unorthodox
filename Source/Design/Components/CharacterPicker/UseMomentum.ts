import { RefObject } from 'preact';
import { useCallback, useEffect, useRef } from 'preact/hooks';

/** Share of the speed kept each frame once the pointer is let go. */
const Friction = 0.94;
/** Below this the flick has stopped reading as motion. */
const MinVelocity = 0.05;

export interface Momentum {
  /** Starts the coast with the speed the last movement had. */
  release: (velocity: number) => void;
  /** Drops any coast in progress, for when a new drag takes over. */
  stop: () => void;
}

/**
 * Lets a released flick keep travelling and slow out, rather than stopping dead.
 *
 * The row's scroll-snap catches the coast and pulls it onto a character, which is
 * where the playful part comes from: the throw decides how far it goes, the snap
 * decides where it lands.
 */
export function useMomentum(track: RefObject<HTMLDivElement>): Momentum {
  const frame = useRef(0);
  const velocity = useRef(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current);
  }, []);

  const release = useCallback(
    (speed: number) => {
      velocity.current = speed;
      const step = () => {
        const element = track.current;
        if (!element || Math.abs(velocity.current) < MinVelocity) return;
        element.scrollLeft += velocity.current;
        velocity.current *= Friction;
        frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    },
    [track]
  );

  useEffect(() => stop, [stop]);

  return { release, stop };
}
