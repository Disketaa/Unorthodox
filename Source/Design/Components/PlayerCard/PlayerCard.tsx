import { CharacterColor, CharacterId } from '@/Core';
import { useSwayMotion } from '@/Design/Primitives';
import { Character } from '../Character';
import styles from './PlayerCard.module.css';

/** This browser's own player as the card draws them: who they are and where they stand. */
export interface PlayerCardEntry {
  name: string;
  character: CharacterId;
  color: CharacterColor;
  score: number;
  /** Whether the host still has this player on the line. */
  isOnline?: boolean;
}

export interface PlayerCardProps {
  player: PlayerCardEntry;
  /** Whether this browser is the room's host. A prop rather than a fact read out of a roster:
   * the card draws one player and the room's order is not in it, so asking would be a question
   * its own contents answer. */
  isHost?: boolean;
}

/** This browser's own seat in the game: their face, their name and their score. One card and not
 * the roster: the answers and the scores are the room's, and the one thing a player looks for
 * in the corner of their eye is where they stand. */
export function PlayerCard({ player, isHost = false }: PlayerCardProps) {
  const crownRef = useSwayMotion();
  const offline = player.isOnline === false;
  const classes = [styles.Root, offline ? styles.Offline : ''].filter(Boolean).join(' ');

  return (
    <div class={classes}>
      <div class={styles.Details}>
        <span class={styles.NameRow}>
          <span class={styles.Name}>{player.name}</span>
          {isHost && (
            <span class={styles.Crown} ref={crownRef} aria-hidden="true">
              <span class={styles.CrownIcon} />
            </span>
          )}
        </span>
        <span class={styles.Score}>{player.score}</span>
      </div>
      <Character character={player.character} color={player.color} size="Small" />
    </div>
  );
}
