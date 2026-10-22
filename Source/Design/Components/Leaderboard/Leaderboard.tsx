import { CharacterColor, CharacterId, PlayerId } from '@/Core';
import { scoreCountMs } from '../ScoreTiming';
import { PlaceRow } from './PlaceRow';
import {
  arrivalMs,
  finalOrder,
  leaderboardPlaceMs,
  leaderboardWaveMs,
  loudPlace,
  priorOrder,
  useSceneNote,
  useShowStage,
} from './LeaderboardShow';
import styles from './Leaderboard.module.css';

export interface LeaderboardRow {
  /** Who this row is, so a row can be found again as the places move. */
  id: PlayerId;
  name: string;
  character: CharacterId;
  color: CharacterColor;
  /** What the player has over the rounds so far, which the standing counts up to. */
  score: number;
  /** What the round just paid them, which is added to the standing it is shown beside. */
  round?: number;
  /** The place the row stands in once the room has been rearranged, which breaks a tie. */
  rank: number;
  /** Whether this is the player looking at the screen, whose row is worn in their own colour. */
  isSelf?: boolean;
  /** Whether this is the room's winner, which only the board after the game is over names. The
   * row is worn in the room's own yellow rather than the player's colour, so every screen shows
   * the same winner in the same wash. */
  isWinner?: boolean;
  /** Whether the player is still in the room. One the host has lost keeps their line — the place
   * is still theirs — held back the way the bar holds back a seat that dropped. */
  isOnline?: boolean;
}

export interface LeaderboardProps {
  /** The room's places, in the order the room now stands. */
  rows: readonly LeaderboardRow[];
  /** Which run of the phase this is, so a room put back to the start of it watches the places
   * arrive again rather than finding them already standing there. */
  run?: number;
  /** Whether the room is held, which stands the show where it is. */
  paused?: boolean;
  /** Whether the game ended with nobody to name, in which case the whole list is washed in the
   * room's error pink rather than left as a grey table on the washed page. */
  noWinner?: boolean;
}

interface PlacesProps {
  rows: readonly LeaderboardRow[];
  run: number;
  paused: boolean;
  noWinner: boolean;
}

/** The list itself, running the show: the places arrive where the room left them, every figure
 * is counted up to what the round made it, and then the list slides into the order the figures
 * put it in. Every row is in the list from the start, at the slot it holds at that moment. */
function Places({ rows, run, paused, noWinner }: PlacesProps) {
  const places = rows.length;
  const countMs = scoreCountMs();
  const waveMs = leaderboardWaveMs();
  const settleMs = arrivalMs(places, 1, waveMs) + leaderboardPlaceMs();
  const prior = priorOrder(rows);
  const stage = useShowStage(settleMs, countMs, paused, run);
  const order = stage === 'Ordered' ? finalOrder(rows) : prior;
  const at = new Map(order.map((row, index) => [row.id, index]));
  const delays = new Map(
    prior.map((row, index) => [row.id, arrivalMs(places, index + 1, waveMs)])
  );
  useSceneNote(paused, run);
  // One of the rows counting at once is the one the room hears, rather than every row saying every
  // point of its own.
  const loud = loudPlace(rows);
  const top = Math.max(0, ...rows.map((row) => row.score));
  // The place column is as wide as the last place needs, so a table of six does not leave a
  // digit's worth of room standing between the place and the player.
  const placeWidth = `${String(places).length}ch`;
  return (
    <ol
      class={`${styles.Root} ${noWinner ? styles.NoWinner : ''}`}
      style={{ '--Row-Count': places, '--Place-Width': placeWidth }}
    >
      {rows.map((row) => (
        <PlaceRow
          key={row.id}
          row={row}
          at={at.get(row.id) ?? 0}
          delay={delays.get(row.id) ?? 0}
          top={top}
          stage={stage}
          countMs={countMs}
          silent={row.id !== loud}
          paused={paused}
          run={run}
        />
      ))}
    </ol>
  );
}

/** The room's places, one row each. The rows come up from the last place to the first, every
 * standing counts what the round added to it, and the list slides into the order that leaves
 * the room in. Keyed on the run. */
export function Leaderboard({
  rows,
  run = 0,
  paused = false,
  noWinner = false,
}: LeaderboardProps) {
  return <Places key={run} rows={rows} run={run} paused={paused} noWinner={noWinner} />;
}
