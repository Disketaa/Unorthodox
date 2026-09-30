import { useEffect } from 'preact/hooks';
import { PlayerLook } from '@/Core';
import { saveLook } from '../LookStorage';

/**
 * Remembers the character this player is wearing, so a reload starts from it.
 *
 * It saves the look the host has confirmed rather than the one that was clicked.
 * The host may keep a character the player has already replaced, and saving the
 * click would make the next reload offer a character nobody in the room has.
 */
export function useRememberLook(look: PlayerLook | undefined): void {
  useEffect(() => {
    if (look !== undefined) {
      saveLook(look);
    }
  }, [look]);
}
