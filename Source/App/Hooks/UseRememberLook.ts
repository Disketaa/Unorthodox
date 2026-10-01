import { useEffect, useRef } from 'preact/hooks';
import { PlayerLook } from '@/Core';
import { saveLook } from '../LookStorage';

/** Whether two looks are the same character in the same tint, however they arrived. */
function sameLook(one: PlayerLook, other: PlayerLook): boolean {
  return one.character === other.character && one.color === other.color;
}

/**
 * Remembers the character this player is wearing, so the next room starts from it.
 *
 * It saves the look the host has confirmed rather than the one that was clicked.
 * The host may keep a character the player has already replaced, and saving the
 * click would make the next room offer a character nobody in the room has.
 *
 * `report` is what makes the choice survive leaving a room without closing the tab.
 * Storage alone is not enough for that: the look a new session starts from is held
 * in the app above this hook, and storage is only read once, when the page loads.
 * Saving and not reporting therefore keeps the choice across a reload but hands the
 * previous one back on the next room in the same tab.
 *
 * Only a real change is reported. A client is told its own look in every public
 * state, and each of those arrives as a fresh object, so comparing by identity would
 * report on every broadcast and push a new look into the app for a character that
 * has not changed.
 */
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
