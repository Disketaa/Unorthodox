import { useEffect, useState } from 'preact/hooks';
import { PlayerLook, type CharacterColor } from '@/Core';
import { loadAccent, saveAccent } from '../AccentStorage';

/** The accent this device is wearing, and the way a new character sets it. Held above the room
 * because it is not the room's business: read at load, before any session exists, and kept
 * after the room is left. A provider, so the join screen wears it too. Saved on every change,
 * so closing the tab from the lobby keeps the colour. Seeded from storage, not the character:
 * the host may keep a character this player replaced, and following the confirmed look would
 * let someone else's decision repaint this interface. */
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