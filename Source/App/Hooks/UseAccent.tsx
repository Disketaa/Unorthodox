import { useEffect, useState } from 'preact/hooks';
import { PlayerLook, type CharacterColor } from '@/Core';
import { loadAccent, saveAccent } from '../AccentStorage';

/** The accent this device is wearing, and the way a new character sets it. Held above the room
 * because it is not the room's business: read at load and kept after leaving. Seeded from
 * storage, not the character, so someone else's decision cannot repaint this interface. */
export function useAccent(): {
  accent: CharacterColor;
  onLook: (look: PlayerLook) => void;
} {
  const [accent, setAccent] = useState<CharacterColor>(loadAccent);
  useEffect(() => saveAccent(accent), [accent]);
  return {
    accent,
    onLook: (look: PlayerLook) => {
      setAccent(look.color);
    },
  };
}