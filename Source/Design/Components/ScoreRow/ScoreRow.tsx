import { CharacterColor, CharacterId } from '@/Core';
import { Character } from '../Character';
import styles from './ScoreRow.module.css';

export interface ScoreRowProps {
  playerName: string;
  character: CharacterId;
  color: CharacterColor;
  score: number;
  rank?: number;
  /** Its place in the standings, so the rows ripple rather than popping at once. */
  index?: number;
}

/**
 * One player in the standings.
 *
 * The character holds still here: these rows are re-ordered as the scores land,
 * so a sway on top of that movement is noise rather than character.
 */
export function ScoreRow({ playerName, character, color, score, rank, index }: ScoreRowProps) {
  return (
    <div class={styles.Root}>
      {rank != null && <span class={styles.Rank}>{rank}.</span>}
      <Character
        character={character}
        color={color}
        size="Small"
        moving={false}
        index={index}
      />
      <span class={styles.Name}>{playerName}</span>
      <span class={styles.Score}>{score}</span>
    </div>
  );
}
