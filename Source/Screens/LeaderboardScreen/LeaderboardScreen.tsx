import { Leaderboard, type LeaderboardRow } from '@/Design/Components';
import styles from './LeaderboardScreen.module.css';

export interface LeaderboardScreenProps {
  rows: readonly LeaderboardRow[];
  /** Which run of the phase this is, so a room put back to the start of it watches the places
   * arrive again. */
  run?: number;
  /** Whether the room is held, which stands the wave where it is. */
  paused?: boolean;
}

/** Where the room stands after a round: the places, one row each, and what they have. The
 * figures are on the rows rather than above them, so a line reads as one thing. */
export function LeaderboardScreen({ rows, run = 0, paused = false }: LeaderboardScreenProps) {
  return (
    <div class={styles.Frame}>
      <Leaderboard rows={rows} run={run} paused={paused} />
    </div>
  );
}
