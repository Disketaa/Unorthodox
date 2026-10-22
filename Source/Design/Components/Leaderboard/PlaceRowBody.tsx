import { Character } from '../Character';
import { TextureOverlay } from '../../Overlays/TextureOverlay';
import characterStyles from '../Character/Character.module.css';
import styles from './Leaderboard.module.css';
import type { LeaderboardRow } from './Leaderboard';

export interface PlaceRowBodyProps {
  row: LeaderboardRow;
  at: number;
  delay: number;
  share: number;
  showsRound: boolean;
  round: number;
  value: number;
  sway: { current: HTMLLIElement | null };
  counting: boolean;
  idle: boolean;
  paused: boolean;
}

function rowClass(row: LeaderboardRow, counting: boolean, idle: boolean, paused: boolean) {
  return `${styles.Row} ${characterStyles[row.color]} ${
    row.isSelf === true ? styles.Mine : ''
  } ${row.isWinner === true ? styles.Winner : ''} ${counting ? styles.Counting : ''} ${
    idle ? styles.Idle : ''
  } ${row.isOnline === false ? styles.Offline : ''} ${paused && !idle ? styles.Paused : ''}`;
}

export function PlaceRowBody({
  row,
  at,
  delay,
  share,
  showsRound,
  round,
  value,
  sway,
  counting,
  idle,
  paused,
}: PlaceRowBodyProps) {
  return (
    <li
      ref={sway}
      class={rowClass(row, counting, idle, paused)}
      style={{ '--Place-Delay': `${delay}ms`, '--Place-Share': share, '--Row-At': at }}
    >
      <div class={styles.Track} aria-hidden="true">
        <div class={styles.Fill}>
          <TextureOverlay variant="Stone" placement="Local" />
        </div>
      </div>
      <span class={styles.Place} aria-hidden="true">
        {at + 1}
      </span>
      <span class={styles.Figure}>
        <Character character={row.character} color={row.color} size="Fill" />
      </span>
      <span class={styles.Name}>
        <span class={styles.NameText}>{row.name}</span>
        {showsRound && <span class={styles.Round}>(+{round})</span>}
      </span>
      <span class={styles.Score}>
        <span class={styles.Total}>{value}</span>
      </span>
    </li>
  );
}
