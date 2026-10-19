import { useRef } from 'preact/hooks';
import type { PlayerId } from '@/Core';
import type { RevealState } from '../Hooks/UseReveal';
import type { CountBoard } from '../Hooks/CountBoard';
import type { BarBoard } from './PlayerBarStandings';

/** Whoever wrote the card the count is on, which is whose seat the bar says the room is waiting
 * on. A card several people share is every one of them, since they are being paid on the same
 * figure and the room would be watching one of them wait and not know which. */
export function payingSeats(board: CountBoard, reviewing: BarBoard | undefined): Set<PlayerId> {
  const group =
    board.payingIndex === undefined ? undefined : reviewing?.groups[board.payingIndex];
  return new Set(group?.playerIds ?? []);
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
export function usePresses(board: BarBoard | undefined): Map<PlayerId, number> {
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
