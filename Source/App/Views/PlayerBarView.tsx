import { PlayerBar, type PlayerBarEntry } from '@/Design/Components';
import { lookFor } from '@/Screens';
import type { PlayerId } from '@/Core';
import { useRef } from 'preact/hooks';
import { useReveal, type RevealState } from '../Hooks/UseReveal';
import type { PhaseViewProps } from './LobbyView';

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
 * all at once. A whole card's worth going at the same moment is a row of broken seats the room
 * cannot read one at a time, and it happens a beat before the board has shown it, since the round
 * decided the moment the card came up and the room is told on the corner's own beat.
 *
 * Exactly the cards the board draws as written off, and no others: a card struck out, and a blank,
 * which is the card of somebody who wrote nothing and is the same kind of nothing to look at. A
 * player whose seat breaks on the bar and whose card is still live would be the bar disagreeing
 * with the board about the same round, which is worse than a seat that stays whole for a moment.
 *
 * Deliberately not `zeroScorers`, which is the other rule and a different one: it says a card
 * three or more wrote scores nothing, which is about the total at the end rather than about the
 * card in front of the room. Reading the bar off it showed a broken seat for a card that was never
 * struck out, on the frame the card came up.
 *
 * Off the same landing count the card draws its figure with, so a seat goes off on the frame its
 * owner's face arrives rather than on a beat of this file's own. */
export function struckWriters(
  view: PhaseViewProps['view'],
  reveal: RevealState
): Set<PlayerId> {
  const reviewing = view.publicState?.phase === 'Reviewing' ? view.publicState : undefined;
  const struck = new Set<PlayerId>();
  if (reviewing === undefined) {
    return struck;
  }
  reviewing.groups.forEach((group, index) => {
    const writtenOff = group.isEmpty || view.rejectedGroupIds.has(group.groupId);
    if (!writtenOff) return;
    const landed = reveal.landedAt(index, group.playerIds.length);
    // How many faces have to be there before the card is struck, which is the card's own rule and
    // not this file's: a shared answer is drawn struck once the room can see there was more than
    // one of them, so taking the first one off the bar before that spoils the only beat the round
    // has. A blank, and a single writer the host turned down, are struck as soon as they are named.
    const shared = group.playerIds.length > 1 && !group.isEmpty;
    const strikeFrom = shared ? 2 : 1;
    if (landed < strikeFrom) return;
    group.playerIds.forEach((playerId, seat) => {
      if (seat < landed) struck.add(playerId);
    });
  });
  return struck;
}

/** How many times each seat should have reacted, as one counter per player so that every event
 * pops again rather than only the first. Two events, which are not the same thing and used to be
 * counted as one: the room being told who wrote an answer, and the host turning it down.
 *
 * The board says the first better in its own corner, in one corner of one card, while the bar says
 * it where the room has been looking at every seat all game. The second has no corner at all — it
 * is a press, and nothing on the card moves for it — so without this the bar was the only place in
 * the game that reacted to the host doing something.
 *
 * Off the same reveal schedule the board is drawn from, rather than off a clock of its own: a seat
 * that popped when the room was told, but on a beat of its own, would say who wrote it a frame
 * before the card says the same thing, and the room would look up at the bar for something it has
 * not been told yet. */
export function seatPulses(
  view: PhaseViewProps['view'],
  reveal: RevealState,
  presses: ReadonlyMap<PlayerId, number> = new Map()
): Map<PlayerId, number> {
  const reviewing = view.publicState?.phase === 'Reviewing' ? view.publicState : undefined;
  const pulses = new Map<PlayerId, number>();
  if (reviewing === undefined) {
    return pulses;
  }
  reviewing.groups.forEach((group, index) => {
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

/** The cards the host has turned down or taken back since the last time the bar was drawn, and
 * who wrote them.
 *
 * A press is an event, and an event cannot be read out of a set of ids: a shared answer arrives
 * already declined, so the ids on their own cannot say whether the host pressed a card or the
 * round had already decided it. What they *can* say is which ids are new, which is the one thing a
 * set of ids is good for. Both directions count, because taking a mute back is as much a thing the
 * host did as taking it, and a bar that reacted to one and not the other would be answering half
 * the presses.
 *
 * Everything declined when the board first arrived is skipped, since that came with the round
 * rather than with anybody's finger: the first render compares the set against itself.
 *
 * Kept in a ref rather than in state because it is read during this render and compared against
 * the last one; setting it here rather than in an effect keeps the comparison on the same frame
 * the broadcast arrived on, and an effect would let a tick slip between the press and the seat
 * reacting to it. The board re-renders on the reveal's own tick, so this is not a hot path. */
function usePresses(view: PhaseViewProps['view']): Map<PlayerId, number> {
  const reviewing = view.publicState?.phase === 'Reviewing' ? view.publicState : undefined;
  const declared = new Set(reviewing?.mutedGroupIds ?? []);
  const seen = useRef<Set<number> | undefined>(undefined);
  const before = seen.current ?? declared;
  seen.current = declared;

  const presses = new Map<PlayerId, number>();
  reviewing?.groups.forEach((group) => {
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
  const reviewing = view.publicState?.phase === 'Reviewing' ? view.publicState : undefined;
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
  const scoredNothing =
    reviewing === undefined ? new Set<PlayerId>() : struckWriters(view, reveal);
  const named = seatPulses(view, reveal, usePresses(view));
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
