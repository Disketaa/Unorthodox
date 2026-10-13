/** The host's console putting the room straight into a phase. Its own file because it is not a
 * move the game makes: nothing in the flow reaches this, and its rules are the shape of the
 * state rather than a rule about what may follow what. */
import { PlayerId, assertNever } from '@/Core';
import { HostState, membersOf } from './GameState';
import type { PhaseName } from './PhaseFlow';
import type { ActionOf } from './GameActions';

/** The room put straight into a phase. Round data is started empty rather than carried, except
 * from Writing into Reviewing: the dock steps the room one phase along there, and throwing the
 * answers away would show a board of blanks for a round the room had already written. */
export function handleGoToPhase(state: HostState, action: ActionOf<'GO_TO_PHASE'>): HostState {
  const base = {
    ...membersOf(state),
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    // A jump carries whatever theme the room had already settled on, so jumping through a round
    // does not leave the bank with nothing pressed on it. Into Lobby or a fresh Choosing there is
    // nothing to carry, which is what `undefined` here says.
    theme:
      action.phase === 'Choosing'
        ? undefined
        : state.phase === 'Lobby'
          ? undefined
          : state.theme,
    // Never carried: a jump is the host's console stepping the room by hand, and a roll mid-sweep
    // is not something a jump into a phase is entitled to inherit.
    picking: undefined,
    answeredAt: undefined,
    leadInMs: 0,
    // Never carried either: the question belongs to the theme that was answered, and a jump is
    // not that answer. One waiting to be drawn is a round whose topic nobody has chosen.
    question: undefined,
    questionAt: undefined,
  };
  return { ...phaseBody(base, state, action.phase, action.topic), ...base };
}

/** The part of a phase that is not the room around it. One switch rather than one handler per
 * phase, since a jump is a debug affordance and its rules are exactly the shape of the state. */
function phaseBody(
  base: { durationMs: number; startedAt: number },
  state: HostState,
  phase: PhaseName,
  topic: string
) {
  switch (phase) {
    case 'Lobby':
      return { phase, ...membersOf(state) };
    case 'Choosing':
      return { phase, ...base };
    case 'Writing':
      return { phase, ...base, topic, answers: new Map<PlayerId, string>() };
    case 'Reviewing':
      return {
        phase,
        ...base,
        topic,
        // The round's answers, when the dock stepped here from Writing. Empty from anywhere else,
        // because there is nothing to carry and a jump is not a round anybody played.
        answers: state.phase === 'Writing' ? state.answers : new Map<PlayerId, string>(),
        groupRejections: new Map(),
        groupLikes: new Map(),
      };
    case 'Scores':
      return { phase, ...base, scores: new Map<PlayerId, number>() };
    case 'Final':
      return { phase, ...membersOf(state) };
    default:
      return assertNever(phase);
  }
}
