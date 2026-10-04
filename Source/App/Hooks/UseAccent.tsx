import { useEffect, useState } from 'preact/hooks';
import { PlayerLook, type CharacterColor } from '@/Core';
import { loadAccent, saveAccent } from '../AccentStorage';

/**
 * The accent this device is wearing, and the way a new character sets it.
 *
 * Held above the room rather than inside it, because it is not the room's business: it is read
 * at load, before any session exists, and it stays put after the room is left. It is applied by
 * a provider rather than by a class, so the join screen and the gallery wear the same accent as
 * the game does.
 *
 * Saved on every change rather than on the way out, so closing the tab from the lobby still
 * keeps the colour.
 *
 * Seeded from storage rather than from the character, deliberately. The host may keep a
 * character the player has already replaced, so following the confirmed look would let someone
 * else's decision repaint this player's interface. What this player last chose for themselves
 * is what the interface wears.
 */
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