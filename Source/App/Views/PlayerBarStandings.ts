import type { PlayerId } from '@/Core';
import type { PublicReviewingState, PublicState } from '@/Game';
import type { PhaseViewProps } from './LobbyView';
import type { CountSubPhase } from '../Hooks/CountBoard';

/** The board the bar's marks are read off, and nothing else. Narrower than the room on purpose:
 * these look at the board and the mutes, and a test should not have to build a whole session to
 * prove what the bar does with a card. `PublicReviewingState` satisfies it as it stands. */
export interface BarBoard {
  groups: PublicReviewingState['groups'];
  /** Optional on the wire, since an older host sends none and that reads as nothing muted. */
  mutedGroupIds?: PublicReviewingState['mutedGroupIds'];
  pace: PublicReviewingState['pace'];
}

/** One seat's figure in the hexagon: its value, whether the figure is the card's addition
 * landing, and what the counter climbed from — the total minus that card, so the room watches
 * 20, 21, 22 rather than 0, 1, 2. */
export type Payout = { value: number; added: boolean; from?: number };

/** The board, where the room is in either half of the round. The one narrowing, in one place,
 * rather than one per reader. The count draws the same board, so a seat struck out for a muted
 * or shared answer stays struck while the room is told what that answer was worth. */
export function boardOf(view: PhaseViewProps['view']): BarBoard | undefined {
  const state = view.publicState;
  return state?.phase === 'Reviewing' || state?.phase === 'Scores' ? state : undefined;
}

/** Whether the room is counting the round. Read off the state the figures were read off, never
 * off the session's own phase: while they disagree at a phase boundary the bar would take the
 * round back out of a standing that already has it and show the room in the minus for a frame. */
export function isSettling(state: PublicState | undefined): boolean {
  return state?.phase === 'Scores';
}

/** The seats the round's enchantment reached, which the bar marks with a shine from the start of
 * the round: the room is told who was enchanted, and the bar says so on every screen. Only the
 * cards wait for the count. */
export function glintedSeats(state: PublicState | undefined): ReadonlySet<PlayerId> {
  return new Set(state?.affectedPlayerIds ?? []);
}

/** Every player's total, from whichever figure the phase carries. The round's two halves send
 * its own running figures and Final the whole thing; every other phase reads the standings,
 * which is what makes the bar climb to a number and stay rather than falling back to zero. */
export function readScores(state: PublicState | undefined): ReadonlyMap<PlayerId, number> {
  if (state?.phase === 'Reviewing') {
    return new Map((state.cumulative ?? []).map((row) => [row.id, row.score]));
  }
  if (state?.phase === 'Scores') {
    return new Map(state.cumulative.map((row) => [row.id, row.score]));
  }
  if (state?.phase === 'Final') {
    return new Map(state.scores.map((row) => [row.id, row.score]));
  }
  return new Map((state?.standings ?? []).map((row) => [row.id, row.score]));
}

/** Every player's total as of the last round that was settled, which is what the bar deals
 * itself by. The round in the room's hands is taken back out, so a row is not reordered under
 * the room while the cards are being paid: the order is taken once the leaderboard has been. */
export function settledTotals(
  state: PublicState | undefined,
  board: BarBoard | undefined
): ReadonlyMap<PlayerId, number> {
  return readShownScores(state, board, false, undefined);
}

/** What every seat is shown. During the review each seat stands at what it held before the
 * round, and the round's points arrive as the count reaches each card, off the same board the
 * figures are on. Wire totals include the round, so the round comes back out. */
export function readShownScores(
  state: PublicState | undefined,
  board: BarBoard | undefined,
  settled: boolean,
  payingIndex: number | undefined
): ReadonlyMap<PlayerId, number> {
  const totals = readScores(state);
  if (board === undefined || state === undefined) {
    return totals;
  }
  const before = beforeRound(totals, board.groups);
  // Nothing counted yet, so the round is worth nothing and every seat stands where it was.
  if (!settled) {
    return before;
  }
  const shown = payingIndex === undefined ? -1 : payingIndex;
  return shownRunning(before, board.groups.slice(0, shown + 1));
}

/** Where every seat stood coming into the round. A seat's own cards come back out of its total,
 * and not the whole board's worth, which no seat is on: taking the board off every seat left a
 * room with rounds behind it at a figure it never held. */
function beforeRound(
  totals: ReadonlyMap<PlayerId, number>,
  groups: BarBoard['groups']
): Map<PlayerId, number> {
  const earned = new Map<PlayerId, number>();
  for (const group of groups) {
    const card = group.score?.total ?? 0;
    for (const playerId of group.playerIds) {
      earned.set(playerId, (earned.get(playerId) ?? 0) + card);
    }
  }
  const before = new Map<PlayerId, number>();
  totals.forEach((total, id) => before.set(id, total - (earned.get(id) ?? 0)));
  return before;
}

/** What the bar would show if the count were through the first `count` cards. */
function shownRunning(
  before: ReadonlyMap<PlayerId, number>,
  groups: readonly { playerIds: readonly PlayerId[]; score?: { total: number } }[]
): ReadonlyMap<PlayerId, number> {
  const running = new Map(before);
  for (const group of groups) {
    const card = group.score?.total ?? 0;
    for (const playerId of group.playerIds) {
      running.set(playerId, (running.get(playerId) ?? 0) + card);
    }
  }
  return running;
}

/** What a seat stands for instead of a face once the count reaches its cards: nothing while the
 * count runs, the card's addition, then the standing — and a zero-point card still gets its
 * figure, off the same running totals the room reads beside it on the same frame. */
export function payoutsOf(
  board: BarBoard | undefined,
  payingIndex: number | undefined,
  totals: ReadonlyMap<PlayerId, number>,
  subPhase: CountSubPhase,
  finished: boolean
): Map<PlayerId, Payout> {
  const seats = new Map<PlayerId, Payout>();
  if (board === undefined || payingIndex === undefined || payingIndex < 0) {
    return seats;
  }
  board.groups.forEach((group, index) => {
    const card = group.score?.total ?? 0;
    for (const playerId of group.playerIds) {
      const seat = seatFigure(
        index,
        payingIndex,
        subPhase,
        finished,
        card,
        totals.get(playerId) ?? 0
      );
      if (seat === undefined) seats.delete(playerId);
      else seats.set(playerId, seat);
    }
  });
  return seats;
}

/** What one seat stands for on the card at `index`: ahead of the count the seat is a face,
 * behind it the standing, and on it nothing while the count runs, then the addition, the total. */
function seatFigure(
  index: number,
  payingIndex: number,
  subPhase: CountSubPhase,
  finished: boolean,
  card: number,
  total: number
): Payout | undefined {
  if (finished) return { value: total, added: false };
  if (index > payingIndex) return undefined;
  if (index < payingIndex) return { value: total, added: false };
  if (subPhase === 'counting') return undefined;
  if (subPhase === 'added') return { value: card, added: true };
  return { value: total, added: false, from: total - card };
}
