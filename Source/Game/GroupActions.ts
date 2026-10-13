import type { PlayerId } from '@/Core';
import { createLogger } from '@/Core';
import { HostState } from './GameState';
import { groupAnswersWithPlayers } from './Grouping';
import { toggleVote } from './GroupVotes';
import type { ActionOf } from './GameActions';

const log = createLogger('AnswerLikes');

/** Muting an answer, which takes it off the board for the whole round and scores nothing. The
 * likes it had are left alone underneath, so taking the mute back brings the card up with the
 * count it had rather than with a fresh zero. */
export function handleRejectGroup(
  state: HostState,
  action: ActionOf<'REJECT_GROUP'>
): HostState {
  if (state.phase !== 'Reviewing') {
    return state;
  }
  const votes = toggleVote(state.groupRejections, action.groupId, action.playerId);
  return { ...state, groupRejections: votes };
}

/** Liking an answer. Every player may, unlike a mute: a like is a reaction to what somebody said
 * and not a move in the round, so it does nothing to the score. */
export function handleLikeGroup(state: HostState, action: ActionOf<'LIKE_GROUP'>): HostState {
  if (state.phase !== 'Reviewing') {
    return state;
  }
  // Refused rather than counted, and the only place a like can be refused: the host knows who
  // wrote what and no client can be told its own authorship. Said out loud, since it is the one
  // press in the room that does nothing and gives no sign of it.
  if (wroteThisGroup(state, action.playerId, action.groupId)) {
    log('info', `refused a like on group ${action.groupId} from its author ${action.playerId}`);
    return state;
  }
  // A muted card is out of the round, so a like cast at one would only ever be dropped again on
  // the way out to the room. Refused here as well, which means the stored vote stays honest about
  // what the round counted.
  if (state.groupRejections.has(action.groupId)) {
    log('info', `refused a like on group ${action.groupId}: the host has muted it`);
    return state;
  }
  const likes = toggleVote(state.groupLikes, action.groupId, action.playerId);
  return { ...state, groupLikes: likes };
}

/** Whether this player wrote the answer on this group. Asked of the answers rather than of any
 * list the client was sent: the grouping is what put them on the card, so a near-duplicate a
 * player would not match on their own is still matched here. */
function wroteThisGroup(
  state: Extract<HostState, { phase: 'Reviewing' }>,
  playerId: PlayerId,
  groupId: number
): boolean {
  return groupAnswersWithPlayers(state.answers).some(
    (group) => group.groupId === groupId && group.playerIds.includes(playerId)
  );
}
