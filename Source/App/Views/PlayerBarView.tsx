import { PlayerBar, type PlayerBarEntry } from '@/Design/Components';
import { lookFor } from '@/Screens';
import type { PlayerId } from '@/Core';
import { useReveal, type RevealState } from '../Hooks/UseReveal';
import { countBoard, countSubPhase, type CountBoard } from '../Hooks/CountBoard';
import type { PhaseViewProps } from './LobbyView';
import {
  boardOf,
  isSettling,
  readShownScores,
  payoutsOf,
  type BarBoard,
  type Payout,
} from './PlayerBarStandings';
import { payingSeats, struckWriters, seatPulses, usePresses } from './PlayerBarMarks';

export { readScores, readShownScores, payoutsOf } from './PlayerBarStandings';
export { struckWriters, seatPulses } from './PlayerBarMarks';
export type { BarBoard, Payout } from './PlayerBarStandings';

/** What every seat is marked with this frame, gathered in one place so the entries read off one
 * object rather than a dozen locals. */
type BarMarks = {
  settled: boolean;
  waitingOnTurn: boolean;
  scores: ReadonlyMap<PlayerId, number>;
  scoredNothing: ReadonlySet<PlayerId>;
  paying: ReadonlySet<PlayerId>;
  payouts: ReadonlyMap<PlayerId, Payout>;
  named: ReadonlyMap<PlayerId, number>;
  glinted: ReadonlySet<PlayerId>;
};

/** The bar's entries, in roster order — the order the room has held since the lobby: a seat that
 * moves about between phases is a seat nobody can find themselves in. */
function barEntries(view: PhaseViewProps['view'], marks: BarMarks): PlayerBarEntry[] {
  return [...view.playerNames].map(([id, name]) => {
    const look = lookFor(view.playerLooks, id);
    return {
      id,
      name,
      score: marks.scores.get(id) ?? 0,
      character: look.character,
      color: look.color,
      isOnline: view.playerPresence.get(id) ?? true,
      isTurning: marks.waitingOnTurn && id === view.turnPlayerId,
      scoredNothing: marks.scoredNothing.has(id),
      isPaying: marks.paying.has(id),
      payout: marks.settled ? marks.payouts.get(id) : undefined,
      pulse: marks.named.get(id) ?? 0,
      glinted: marks.glinted.has(id),
      // Every seat still at work, and not only this browser's own: the room says who has written,
      // so a row of seats fills up as the answers come in. Writing over an answer already sent
      // counts as work again, and the room is told that too, so it holds for everybody's bar.
      isWorking:
        (view.phase === 'Writing' &&
          (!view.submittedIds.has(id) ||
            view.editingIds.has(id) ||
            (id === view.playerId && view.editing))) ||
        (view.phase === 'Scores' && view.submittedIds.has(id)),
    };
  });
}

/** What each seat is shown this frame, read off the board and the same clock the count runs on,
 * so the bar's figure and the card's figure are the same figure on the same frame. */
function barMarksFor(
  view: PhaseViewProps['view'],
  reviewing: BarBoard | undefined,
  reveal: RevealState,
  board: CountBoard,
  settled: boolean
): BarMarks {
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  // The turn outlives the round that used it, so the mark belongs only to where the room is
  // actually waiting on it: an open bank. Once the bank is answered the phase is still Choosing,
  // now while the room reads the question, and by then nobody has been asked for anything.
  const waitingOnTurn = choosing !== undefined && choosing.theme === undefined;
  const scores = readShownScores(view.publicState, reviewing, settled, board.payingIndex);
  // Who the round gave nothing to, read off the board the room is already being shown rather than
  // off a second copy of the marks.
  const struckFromBoard = (reviewing?.groups ?? []).flatMap((g) =>
    g.isEmpty || g.playerIds.length > 1 ? g.playerIds : []
  );
  const scoredNothing = settled
    ? new Set(struckFromBoard)
    : struckWriters(reviewing, view.rejectedGroupIds, reveal);
  // The sub-phase of the current card, shared by the board and the bar so both screens show the
  // same figure on the same frame: counting the number, showing the addition, or showing the total.
  const subPhase =
    board.payingElapsedMs === undefined ? 'total' : countSubPhase(board.payingElapsedMs);
  // Through the whole board once the index is past the last: the seats go over to their standings
  // and stay there until the phase ends.
  const finished =
    board.payingIndex !== undefined &&
    reviewing !== undefined &&
    board.payingIndex >= reviewing.groups.length;
  // Whose card the count is on, only while its number is being counted: once the number has
  // landed, the loading mark comes off and the figure takes its place.
  const paying = subPhase === 'counting' ? payingSeats(board, reviewing) : new Set<PlayerId>();
  const payouts = payoutsOf(reviewing, board.payingIndex, scores, subPhase, finished);
  const named = seatPulses(reviewing, reveal, usePresses(reviewing));
  // Who the round's enchanted card reaches, read off the room's own roll rather than worked out
  // here: the host named the seats and every screen is told the same ones.
  const glinted = new Set(view.publicState?.affectedPlayerIds ?? []);
  return {
    settled,
    waitingOnTurn,
    scores,
    scoredNothing,
    paying,
    payouts,
    named,
    glinted,
  };
}

/** The bar across the top of a game. */
export function PlayerBarView({ view }: PhaseViewProps) {
  const settled = isSettling(view.publicState);
  const reviewing = boardOf(view);
  // The count is the board at rest: a seat struck in the review stays struck while the room is told
  // what that answer earned. The same hook the board draws from, on the same arguments, so the bar
  // and the board are told the same thing on the same frame.
  const reveal = useReveal(
    reviewing?.groups.map((group) => group.playerIds.length) ?? [],
    reviewing?.pace ?? 'Standard',
    view.durationMs,
    view.phaseStartedAt,
    reviewing !== undefined,
    view.paused,
    view.pausedAt,
    settled
  );
  // Counted off the same clock the board counts from, so a round's points arrive as the count
  // reaches the answer they were for.
  const board = countBoard(settled, view.phaseStartedAt, reveal.moment);
  const marks = barMarksFor(view, reviewing, reveal, board, settled);
  const players = barEntries(view, marks);
  return <PlayerBar players={players} ownPlayerId={view.playerId} />;
}
