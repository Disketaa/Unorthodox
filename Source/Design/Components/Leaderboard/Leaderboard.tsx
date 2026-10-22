import { CharacterColor, CharacterId, PlayerId } from '@/Core';
import { useSwayMotion } from '@/Design/Primitives';
import { TextureOverlay } from '../../Overlays/TextureOverlay';
import { Character } from '../Character';
import characterStyles from '../Character/Character.module.css';
import { scoreCountMs } from '../ScoreTiming';
import {
  arrivalMs,
  finalOrder,
  leaderboardPlaceMs,
  leaderboardWaveMs,
  loudPlace,
  priorOrder,
  useSceneNote,
  useShowStage,
  useStanding,
  type ShowStage,
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

interface PlaceProps {
  row: LeaderboardRow;
  /** Which slot the row stands in, which it slides between when the list is rearranged. */
  at: number;
  /** How long into the show this place comes up, off the wave it is part of. */
  delay: number;
  /** The top standing in the room, which fills the track the rows are read against. */
  top: number;
  /** Which of the show's three beats the list is on. */
  stage: ShowStage;
  /** How long a standing takes to count up, read once for the list. */
  countMs: number;
  /** Whether this row is the one that carries the count's sound. */
  silent: boolean;
  paused: boolean;
  run: number;
}

interface PlacesProps {
  rows: readonly LeaderboardRow[];
  run: number;
  paused: boolean;
  noWinner: boolean;
}

/** One place: where the player stands, the player themselves, their name, and what they have.
 * The place leads the line and the player is drawn beside it rather than over it. The row rocks
 * in place once it has arrived, the way a room of characters does. */
function Place({ row, at, delay, top, stage, countMs, silent, paused, run }: PlaceProps) {
  const sway = useSwayMotion<HTMLLIElement>();
  const value = useStanding({ row, stage, countMs, silent, paused, run });
  const round = row.round ?? 0;
  const share = top > 0 ? value / top : 0;
  // The round's figure arrives with the count it belongs to; a line the round paid nothing has
  // nothing to count and nothing to say.
  const showsRound = stage !== 'Arrived' && round > 0;
  // The bar wears the player the figure is about while that figure is being counted, and is the
  // wash it was once the count is over.
  const counting = stage === 'Counting' && round > 0;
  // The row holds still while it arrives and rocks only once it is standing: the show's first beat
  // is the only one where the row is moving under its own steam.
  const idle = stage !== 'Arrived';
  return (
    <li
      ref={sway}
      class={`${styles.Row} ${characterStyles[row.color]} ${
        row.isSelf === true ? styles.Mine : ''
      } ${row.isWinner === true ? styles.Winner : ''} ${counting ? styles.Counting : ''} ${
        idle ? styles.Idle : ''
      } ${row.isOnline === false ? styles.Offline : ''} ${
        paused && !idle ? styles.Paused : ''
      }`}
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
        <Place
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
