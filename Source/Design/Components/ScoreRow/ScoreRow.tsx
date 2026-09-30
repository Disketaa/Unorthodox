import { CharacterColor, CharacterId } from '@/Core';
import { Character } from '../Character';
import styles from './ScoreRow.module.css';

export interface ScoreRowProps {
  playerName: string;
  character: CharacterId;
  color: CharacterColor;
  score: number;
  rank?: number;
}

export function ScoreRow({ playerName, character, color, score, rank }: ScoreRowProps) {
  return (
    <div class={styles.Root}>
      {rank != null && <span class={styles.Rank}>{rank}.</span>}
      <Character character={character} color={color} size="Small" />
      <span class={styles.Name}>{playerName}</span>
      <span class={styles.Score}>{score}</span>
    </div>
  );
}
