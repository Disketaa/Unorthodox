/** The show the standing list puts on: the places arrive, every figure is counted up to what the
 * round made it, and then the list slides into the order those figures put it in. The tokens
 * are read from the page rather than imported: the design may not read Game. */
import { useEffect, useState } from 'preact/hooks';
import type { PlayerId } from '@/Core';
import { playSound } from '../../Sounds';
import { tokenValue } from '../../TokenValues';
import { useCountRun } from '../ScoreCount';
import type { LeaderboardRow } from './Leaderboard';

const WaveToken = '--Duration-LeaderboardWave';
const PlaceToken = '--Duration-LeaderboardPlace';
const ReorderDelayToken = '--Delay-LeaderboardReorder';

/** What the timings fall back to where the page has not declared the tokens — a test runner and
 * a page that has not loaded `Tokens.css` both land here, and `Tests/LeaderboardTiming.test.ts`
 * holds these copies to the tokens so they cannot drift. */
export const FallbackWaveMs = 90;
export const FallbackPlaceMs = 300;
export const FallbackReorderDelayMs = 400;

function readMs(token: string, fallback: number): number {
  const declared = tokenValue(token);
  const value = Number.parseFloat(declared);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** How long between one place arriving and the next: the beat the wave is built on. */
export function leaderboardWaveMs(): number {
  return readMs(WaveToken, FallbackWaveMs);
}

/** How long a place takes to come up once the wave has reached it. */
export function leaderboardPlaceMs(): number {
  return readMs(PlaceToken, FallbackPlaceMs);
}

/** How long the new figures stand before the list is rearranged. */
export function leaderboardReorderDelayMs(): number {
  return readMs(ReorderDelayToken, FallbackReorderDelayMs);
}

/** How long after the list arrives the place in this position comes up. The wave is built from
 * the last place up, so the last place is first and the first place is last. */
export function arrivalMs(places: number, place: number, waveMs: number): number {
  return (places - place) * waveMs;
}

/** What the player had before the round was counted, which is what their standing climbs from. */
export function beforeScore(row: LeaderboardRow): number {
  return row.score - (row.round ?? 0);
}

/** The room in the order of one figure, highest first, with a tie held in the order the finished
 * list puts the two of them, so the same room always lines up the same way. */
function byFigure(
  rows: readonly LeaderboardRow[],
  figure: (row: LeaderboardRow) => number
): LeaderboardRow[] {
  const ordered = [...rows];
  return ordered.sort((left, right) => figure(right) - figure(left) || left.rank - right.rank);
}

/** The order the room stood in before the round was counted, which is the order the places
 * arrive in: the list comes up as the room left it, so a place that moved is seen to move
 * rather than found somewhere else. */
export function priorOrder(rows: readonly LeaderboardRow[]): LeaderboardRow[] {
  return byFigure(rows, beforeScore);
}

/** The order the round put the room in, which is what the list slides to once the figures are
 * in. */
export function finalOrder(rows: readonly LeaderboardRow[]): LeaderboardRow[] {
  return byFigure(rows, (row) => row.score);
}

/** Which place carries the count's sound: a room of a dozen counting at once is a dozen pops on
 * every beat, so the place the round paid most is the one whose count runs for the whole of it.
 * Nothing is heard where the round paid nobody. */
export function loudPlace(rows: readonly LeaderboardRow[]): PlayerId | undefined {
  let loudest: LeaderboardRow | undefined;
  rows.forEach((row) => {
    if ((row.round ?? 0) > (loudest?.round ?? 0)) loudest = row;
  });
  return loudest?.id;
}

/** Which of the three beats the show is on. One timer at a time rather than the whole run
 * scheduled at once, so a room held part-way through picks the show up where it stopped instead
 * of playing it from the top. */
export type ShowStage = 'Arrived' | 'Counting' | 'Ordered';

export function useShowStage(
  settleMs: number,
  countMs: number,
  paused: boolean,
  run: number
): ShowStage {
  const [stage, setStage] = useState<ShowStage>('Arrived');
  useEffect(() => {
    if (paused || stage === 'Ordered') return;
    const arrived = stage === 'Arrived';
    const waitMs = arrived ? settleMs : countMs + leaderboardReorderDelayMs();
    const timer = window.setTimeout(() => setStage(arrived ? 'Counting' : 'Ordered'), waitMs);
    return () => window.clearTimeout(timer);
  }, [stage, settleMs, countMs, paused, run]);
  return stage;
}

/** The note the scene opens on: one whoosh as the places come up, rather than a card for every
 * place that lands. Said only while the room is running, since a held room is a room that has
 * stopped. */
export function useSceneNote(paused: boolean, run: number): void {
  useEffect(() => {
    if (paused) return;
    playSound('Whoosh');
  }, [paused, run]);
}

/** What one row is read by: the place, the beat the show is on, and whether this row is the one
 * that carries the count's sound. */
export interface StandingSpec {
  row: LeaderboardRow;
  stage: ShowStage;
  countMs: number;
  silent: boolean;
  paused: boolean;
  run: number;
}

/** The figure a row is read at: what the player had until the count begins, and then their
 * standing counting up to what the round made it. The figure is the bar's as well as the
 * number's, so the bar grows with the standing. */
export function useStanding(spec: StandingSpec): number {
  const { row, stage, countMs, silent, paused, run } = spec;
  const before = beforeScore(row);
  const { value } = useCountRun({
    from: before,
    to: stage === 'Arrived' ? before : row.score,
    durationMs: countMs,
    silent,
    paused,
    run,
  });
  return value;
}
