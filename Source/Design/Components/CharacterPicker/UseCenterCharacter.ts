import { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';

/**
 * Keeps the chosen character in the middle of a scrolling row.
 *
 * Runs on the chosen character rather than on the drag, so a drag still feels
 * like a drag: the row only snaps into place when the answer actually changes,
 * whether that came from a click or from the host.
 */
export function useCenterCharacter(
  track: RefObject<HTMLDivElement>,
  character: string
): void {
  useEffect(() => {
    const element = track.current;
    if (!element) {
      return;
    }
    const chosen = element.querySelector(`[data-character="${character}"]`);
    if (chosen instanceof HTMLElement) {
      chosen.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [track, character]);
}
