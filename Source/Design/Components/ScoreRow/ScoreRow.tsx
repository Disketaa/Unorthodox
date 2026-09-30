import styles from "./ScoreRow.module.css";

export interface ScoreRowProps {
  playerName: string;
  score: number;
  rank?: number;
}

export function ScoreRow({ playerName, score, rank }: ScoreRowProps) {
  return (
    <div class={styles.Root}>
      {rank != null && <span class={styles.Rank}>{rank}.</span>}
      <span class={styles.Name}>{playerName}</span>
      <span class={styles.Score}>{score}</span>
    </div>
  );
}