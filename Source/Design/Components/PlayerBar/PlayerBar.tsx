import { CharacterColor, CharacterId, PlayerId } from '@/Core';
import { slotLimit } from './SlotLimit';
import { PlayerBarSlot } from './PlayerBarSlot';
import { slotsFor } from './PlayerBarSlots';
import styles from './PlayerBar.module.css';

/** One player as the bar draws them: the room's roster entry and where they stand. */
export interface PlayerBarEntry {
  id: PlayerId;
  name: string;
  character: CharacterId;
  color: CharacterColor;
  score: number;
  /** Whether the host still has this player on the line. */
  isOnline?: boolean;
}

export interface PlayerBarProps {
  /** The room's roster, in the order the room holds it. */
  players: readonly PlayerBarEntry[];
  /** This browser's own player, ringed so a full bar is still findable. */
  ownPlayerId?: PlayerId | null;
}

/**
 * Every player in the room along the top of a game, each with their score.
 *
 * The same bar for every phase, so a player's face and their standing do not move
 * between writing and the scores. It holds as many slots as the token declares and
 * wraps onto a second row where the width runs out, rather than scrolling: a bar you
 * have to swipe is a bar nobody can find themselves in.
 */
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
        />
      ))}
    </div>
  );
}