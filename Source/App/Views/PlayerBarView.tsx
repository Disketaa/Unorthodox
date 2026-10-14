import { PlayerBar, type PlayerBarEntry } from '@/Design/Components';
import { lookFor } from '@/Screens';
import type { PlayerId } from '@/Core';
import type { PublicReviewingState } from '@/Game';
import { useRef } from 'preact/hooks';
import { useReveal, type RevealState } from '../Hooks/UseReveal';
import type { PhaseViewProps } from './LobbyView';

/** The board the bar's marks are read off, and nothing else. Narrower than the room on purpose:
 * these look at the board and the mutes, and a test should not have to build a whole session to
 * prove what the bar does with a card. `PublicReviewingState` satisfies it as it stands. */
export interface BarBoard {
  groups: PublicReviewingState['groups'];
  /** Optional on the wire, since an older host sends none and that reads as nothing muted. */
  mutedGroupIds?: PublicReviewingState['mutedGroupIds'];
  pace: PublicReviewingState['pace'];
}

/** The board, where the room is in the phase that has one. The one narrowing, in one place,
 * rather than one per reader. */
function boardOf(view: PhaseViewProps['view']): BarBoard | undefined {
  const state = view.publicState;
  return state?.phase === 'Reviewing' ? state : undefined;
}

/** Every player's running total, read from whichever phase carries them. Only Scores and Final
 * send a score at all — a room in the lobby or mid-round has nothing settled to show — so every
 * other phase reads as zero rather than as missing. */
function readScores(view: PhaseViewProps['view']): ReadonlyMap<PlayerId, number> {
  const state = view.publicState;
  if (state?.phase === 'Scores') {
    return new Map(state.cumulative.map((row) => [row.id, row.score]));
  }
  if (state?.phase === 'Final') {
    return new Map(state.scores.map((row) => [row.id, row.score]));
  }
  return new Map();
}

/** The players the round has written off, taken off the bar as their own faces land rather than
 * all at once. Off the same landing count the card draws its figure with, so a seat goes off on
 * the frame its owner's face arrives rather than on a beat of this file's own. */
export function struckWriters(
  board: BarBoard | undefined,
  rejected: ReadonlySet<number>,
  reveal: RevealState
): Set<PlayerId> {
  const struck = new Set<PlayerId>();
  board?.groups.forEach((group, index) => {
    if (!group.isEmpty && !rejected.has(group.groupId)) return;
    const landed = reveal.landedAt(index, group.playerIds.length);
    // How many faces have to be there before the card is struck, which is the card's own rule and not
    // this file's: a shared answer is drawn struck once the room can see there was more than one of
    // them, so taking the first off the bar before that spoils the only beat the round has.
    const shared = group.playerIds.length > 1 && !group.isEmpty;
    if (landed < (shared ? 2 : 1)) return;
    group.playerIds.forEach((playerId, seat) => {
      if (seat < landed) struck.add(playerId);
    });
  });
  return struck;
}

/** How many times each seat should have reacted, as one counter per player so that every event
 * pops again rather than only the first. Two events, which used to be counted as one: the room
 * being told who wrote an answer, and the host turning it down. */
export function seatPulses(
  board: BarBoard | undefined,
  reveal: RevealState,
  presses: ReadonlyMap<PlayerId, number> = new Map()
): Map<PlayerId, number> {
  const pulses = new Map<PlayerId, number>();
  board?.groups.forEach((group, index) => {
    if (!reveal.authorsAt(index)) return;
    for (const playerId of group.playerIds) {
      pulses.set(playerId, (pulses.get(playerId) ?? 0) + 1);
    }
  });
  for (const [playerId, times] of presses) {
    pulses.set(playerId, (pulses.get(playerId) ?? 0) + times);
  }
  return pulses;
}

/** The cards the host has turned down or taken back since the bar was last drawn. An event
 * cannot be read out of a set of ids, but which ids are new it can say. Written during render,
 * so no reveal tick slips between the press and the seat reacting to it. */
function usePresses(board: BarBoard | undefined): Map<PlayerId, number> {
  const declared = new Set(board?.mutedGroupIds ?? []);
  const seen = useRef<Set<number> | undefined>(undefined);
  const before = seen.current ?? declared;
  seen.current = declared;

  const presses = new Map<PlayerId, number>();
  board?.groups.forEach((group) => {
    if (declared.has(group.groupId) === before.has(group.groupId)) return;
    for (const playerId of group.playerIds) {
      presses.set(playerId, (presses.get(playerId) ?? 0) + 1);
    }
  });
  return presses;
}

/** The bar across the top of a game. In roster order, which is the order the room has held since
 * the lobby: a seat that moves about between phases is a seat nobody can find themselves in. */
export function PlayerBarView({ view }: PhaseViewProps) {
  const scores = readScores(view);
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  // The turn outlives the round that used it, so the mark belongs only to where the room is
  // actually waiting on it: an open bank. Once the bank is answered the phase is still Choosing,
  // now while the room reads the question, and by then nobody has been asked for anything.
  const waitingOnTurn = choosing !== undefined && choosing.theme === undefined;
  // Who the round has written off, read off the board the room is already being shown rather than
  // off a second copy of the marks.
  const reviewing = boardOf(view);
  // The same hook the board is drawn from, on the same arguments, so the bar and the board are
  // told the same thing on the same frame. A bar that asked when it liked would be a bar guessing.
  const reveal = useReveal(
    reviewing?.groups.map((group) => group.playerIds.length) ?? [],
    reviewing?.pace ?? 'Standard',
    view.durationMs,
    view.phaseStartedAt,
    reviewing !== undefined,
    view.paused,
    view.pausedAt
  );
  // Who the round gave nothing to, read off the board the room is already being shown rather than
  // off a second copy of the marks.
  const scoredNothing = struckWriters(reviewing, view.rejectedGroupIds, reveal);
  const named = seatPulses(reviewing, reveal, usePresses(reviewing));
  const players: PlayerBarEntry[] = [...view.playerNames].map(([id, name]) => {
    const look = lookFor(view.playerLooks, id);
    return {
      id,
      name,
      score: scores.get(id) ?? 0,
      character: look.character,
      color: look.color,
      isOnline: view.playerPresence.get(id) ?? true,
      isTurning: waitingOnTurn && id === view.turnPlayerId,
      scoredNothing: scoredNothing.has(id),
      pulse: named.get(id) ?? 0,
      // Every seat still at work, and not only this browser's own: the room says who has written,
      // so a row of seats fills up as the answers come in. Writing over an answer already sent
      // counts as work again, and the room is told that too, so it holds for everybody's bar.
      isWorking:
        view.phase === 'Writing' &&
        (!view.submittedIds.has(id) ||
          view.editingIds.has(id) ||
          (id === view.playerId && view.editing)),
    };
  });

  return <PlayerBar players={players} ownPlayerId={view.playerId} />;
}
