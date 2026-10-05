import { useEffect, useRef } from 'preact/hooks';
import { PlayerLook } from '@/Core';
import { saveLook } from '../LookStorage';

/** Whether two looks are the same character in the same tint, however they arrived. */
function sameLook(one: PlayerLook, other: PlayerLook): boolean {
  return one.character === other.character && one.color === other.color;
}

/** Remembers the character this player is wearing, so the next room starts from it. It saves the
 * look the host has confirmed rather than the one clicked, and `report` carries it across
 * leaving a room without closing the tab. Only a real change is reported. */
export function useRememberLook(
  look: PlayerLook | undefined,
  report: (look: PlayerLook) => void,
): void {
  const reported = useRef<PlayerLook | undefined>(undefined);

  useEffect(() => {
    if (look === undefined) {
      return;
    }
    saveLook(look);
    const previous = reported.current;
    if (previous === undefined || !sameLook(previous, look)) {
      reported.current = look;
      report(look);
    }
  }, [look, report]);
}
