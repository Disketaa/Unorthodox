import { CharacterColor, CharacterId, PlayerId } from '@/Core';
import { slotLimit } from './SlotLimit';
import { PlayerBarSlot } from './PlayerBarSlot';
import { slotsFor } from './PlayerBarSlots';
import styles from './PlayerBar.module.css';

/** One player as the bar draws them: who they are, and whether they are still here. */
export interface PlayerBarEntry {
  id: PlayerId;
  character: CharacterId;
  color: CharacterColor;
  /** Whether the host still has this player on the line. */
  isOnline?: boolean;
}

export interface PlayerBarProps {
  /** The room's roster, in the order the room holds it. */
  players: readonly PlayerBarEntry[];
  /** This browser's own player, filled in the accent so a full bar is still findable. */
  ownPlayerId?: PlayerId | null;
}

/** Every player in the room along the top of the game, one hexagon each. The same bar for every
 * phase, so a face does not move between writing and the scores; the host is the roster's first
 * player, which is where the room puts them, so the bar asks for no crown of its own. */
export function PlayerBar({ players, ownPlayerId = null }: PlayerBarProps) {
  const slots = slotsFor(players, ownPlayerId, slotLimit());

  return (
    <div class={styles.Root}>
      {slots.map((player, index) => (
        <PlayerBarSlot
          key={player.id}
          entry={player}
          index={index}
          isSelf={player.id === ownPlayerId}
          isHost={index === 0}
        />
      ))}
    </div>
  );
}
