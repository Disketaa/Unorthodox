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
  /**
   * Whether this browser is the room's host.
   *
   * A prop rather than a fact read out of a roster, because the card draws one player and the
   * room's own order is not in it: a card that had to be told which of its own players is the
   * host is a card asking a question its own contents answer.
   */
  isHost?: boolean;
}

/**
 * This browser's own seat in the game: their face, their name and their score.
 *
 * One card and not the roster. The bar this replaced drew every player in the room along the
 * top of the game, which is a thing nobody in a party game needs mid-round: the answers being
 * judged are the room's, the scores being added up are the room's, and the one thing a player
 * is looking for in the corner of their eye is where they themselves stand. Sixteen small seats
 * also took the height the theme bank needs, and every one of those seats had been re-measured
 * against the width of a screen so that it would fit.
 *
 * A plank rather than a square: the words run down the left with the face at the right end, so
 * the card is a strip along the top of the game and leaves the height to the theme bank. Drawn
 * there, and readable at a glance from further away than a caption is read — so the face, the
 * name and the score are all a step up from what the same three things are elsewhere in the
 * game.
 */
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