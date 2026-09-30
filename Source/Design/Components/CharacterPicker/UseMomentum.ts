import { RefObject } from 'preact';
import { useCallback, useEffect, useRef } from 'preact/hooks';

/**
 * Share of the speed kept after one 60Hz frame. Lower means the coast is shorter.
 */
const FrictionPerFrame = 0.93;
/** Fastest flick worth honouring, in pixels per millisecond, so one wild throw cannot fly. */
const MaxVelocity = 2.2;
/** Below this, in pixels per millisecond, the coast has stopped reading as motion. */
const MinVelocity = 0.02;
/** A coast that runs longer than this has stopped being playful and become a nuisance. */
const MaxCoastMs = 1400;

export interface Momentum {
  /** Starts the coast with the speed the last movement had, in pixels per millisecond. */
  release: (velocity: number) => void;
  /** Drops any coast in progress, for when a new drag takes over. */
  stop: () => void;
}

/**
 * Lets a released flick keep travelling and slow out, rather than stopping dead.
 *
 * The decay is per unit of time rather than per frame, so the coast lasts the same
 * length whatever the display is refreshing at: applying a fixed share of the
 * speed every frame would make a 120Hz screen coast half as far as a 60Hz one.
 *
 * The row's scroll-snap catches the coast and pulls it onto a character, which is
 * where the playful part comes from: the throw decides how far it goes, the snap
 * decides where it lands.
 */
export function useMomentum(track: RefObject<HTMLDivElement>): Momentum {
  const frame = useRef(0);
  const speed = useRef(0);
  const lastAt = useRef(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current);
    speed.current = 0;
  }, []);

  const release = useCallback(
    (velocity: number) => {
      stop();
      const clamped = Math.max(-MaxVelocity, Math.min(MaxVelocity, velocity));
      if (Math.abs(clamped) < MinVelocity) {
        return;
      }
      speed.current = clamped;
      lastAt.current = performance.now();
      const startedAt = lastAt.current;
      const step = () => {
        const element = track.current;
        if (!element) return;
        const now = performance.now();
        const elapsed = Math.max(1, now - lastAt.current);
        lastAt.current = now;
        element.scrollLeft += speed.current * elapsed;
        speed.current *= Math.pow(FrictionPerFrame, elapsed / 16.667);
        if (Math.abs(speed.current) < MinVelocity || now - startedAt > MaxCoastMs) {
          return;
        }
        frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    },
    [track, stop]
  );

  useEffect(() => stop, [stop]);

  return { release, stop };
}