import { HostState, type WritingState } from './GameState';
import type { ActionOf } from './GameActions';

export function handleSubmitAnswer(
  state: HostState,
  action: ActionOf<'SUBMIT_ANSWER'>
): HostState {
  if (state.phase !== 'Writing') {
    return state;
  }
  // An empty answer is refused outright: stored, it would be paid as the fastest answer there is
  // and group with every other blank into one shared card. Written over rather than refused, so a
  // player who clears an answer they had already sent keeps the answer the room is holding.
  const text = action.text.trim();
  if (text.length === 0) {
    return state;
  }
  const answers = new Map(state.answers);
  answers.set(action.playerId, text);
  // The share of the writing clock at receipt, written over: a player who changes their mind has
  // spent the time again, and a round that timed only the first press would pay for an answer
  // they had already thrown away.
  const answerShares = new Map(state.answerShares ?? []);
  answerShares.set(action.playerId, answerShareOf(state, action.at));
  // An answer that has just been sent is not one being written over. Taken off here rather than
  // only on the way out of editing, since the two travel as separate messages and a seat must not
  // be left marked at work over an answer the room is already holding.
  const editing = new Set(state.editing ?? []);
  editing.delete(action.playerId);
  return { ...state, answers, answerShares, editing };
}

/** How far into the writing clock an answer reached the host, clamped to [0, 1]: a message
 * stamped before the round opened, or one that arrived after it closed, is a time this round
 * never had. */
function answerShareOf(state: WritingState, at: number): number {
  const spent = at - state.startedAt;
  return Math.min(1, Math.max(0, spent / Math.max(1, state.durationMs)));
}
