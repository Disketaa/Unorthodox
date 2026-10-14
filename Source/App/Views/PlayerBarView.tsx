import { PlayerBar, type PlayerBarEntry } from '@/Design/Components';
import { lookFor } from '@/Screens';
import type { PlayerId } from '@/Core';
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
 * pops again rather than only the first. One event only: the room being told who wrote an answer.
 * The board says it better in its own corner, in one corner of one card, while the bar says it
 * where the room has been looking at every seat all game — which is the whole reason for it.
 *
 * The host's own press is not counted here. It already shows on the bar by the seat coming apart,
 * which is a bigger change than a pop and needs no second one over the top of it, and the set of
 * declined cards can no longer tell a press from the round's own decision anyway: a shared answer
 * arrives already declined, before the host has pressed anything.
 *
 * Off the same reveal schedule the board is drawn from, rather than off a clock of its own: a seat
 * that popped when the room was told, but on a beat of its own, would say who wrote it a frame
 * before the card says the same thing, and the room would look up at the bar for something it has
 * not been told yet. */
export function seatPulses(
  view: PhaseViewProps['view'],
  reveal: RevealState
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
  return pulses;
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
    reviewing?.groups.length ?? 0,
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
  const named = seatPulses(view, reveal);
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
