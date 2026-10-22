/** The host's console putting the room straight into a phase. Its own file because it is not a
 * move the game makes: nothing in the flow reaches this, and its rules are the shape of the
 * state rather than a rule about what may follow what. */
import { PlayerId, assertNever } from '@/Core';
import { HostState, membersOf, type BoardState, type ScoresState } from './GameState';
import { scoreRound } from './RoundScoring';
import type { PhaseName } from './PhaseFlow';
import type { ActionOf } from './GameActions';

/** The room put straight into a phase. Round data is started empty rather than carried, except
 * from Writing into Reviewing: the dock steps the room one phase along there, and throwing the
 * answers away would show a board of blanks for a round the room had already written. */
/** The same phase begun again, which is the host's dock asking to watch a reveal twice. Only the
 * clock moves; the moment is stamped on the state as well as becoming the phase's start, since
 * a held room's start alone cannot say a new run has begun. */
export function handleReloadPhase(
  state: HostState,
  action: ActionOf<'RELOAD_PHASE'>
): HostState {
  if (!('durationMs' in state)) {
    return state;
  }
  return { ...state, startedAt: action.startedAt, reloadedAt: action.startedAt };
}

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
    // The spread belongs to the round being played, and the scores are still that round being
    // settled: Writing, Reviewing and Scores keep it, so the reached seats still wear the shine
    // while the room reads what it won. A fresh bank, a fresh room and the end leave it behind.
    affectedPlayers:
      action.phase === 'Writing' || action.phase === 'Reviewing' || action.phase === 'Scores'
        ? state.affectedPlayers
        : new Set<PlayerId>(),
  };
  return {
    ...phaseBody(base, state, action.phase, action.topic),
    ...base,
    ...settledBy(state, action.phase),
  };
}

/** A round enters the count settled, whichever way the room got there. END_REVIEWING already
 * folded it into `cumulativeScores`, so only an unsettled round is scored here. */
function settledBy(
  state: HostState,
  phase: PhaseName
): Pick<ScoresState, 'scores' | 'cumulativeScores'> | object {
  // Out of Writing as well as Reviewing, because the dock can step over the review entirely. The
  // standings are settled on the way in too, so the places are not a round behind the room.
  const playingRound =
    state.phase === 'Reviewing' || state.phase === 'Writing' || state.phase === 'Scores';
  if ((phase !== 'Scores' && phase !== 'Leaderboard') || !playingRound) {
    return {};
  }
  // Scores already holds the settled round: carry it as-is and leave the totals alone.
  if ('scores' in state) {
    return { scores: state.scores, cumulativeScores: state.cumulativeScores };
  }
  const { roundScores, cumulativeScores } = scoreRound(state);
  return { scores: roundScores, cumulativeScores };
}

/** The round the room was in the middle of, or undefined where it was not playing one. Only the
 * writing of it is carried: the marks are a round's own and are dropped, since a dock step is
 * not a room's vote. The question is carried with it, and that is why it is listed separately. */
function writtenRound(
  state: HostState
):
  | (Pick<BoardState, 'answers' | 'answerShares' | 'mult'> &
      Partial<Pick<BoardState, 'groupRejections' | 'groupLikes'>> & { topic: string })
  | undefined {
  return state.phase === 'Writing' || state.phase === 'Reviewing' || state.phase === 'Scores'
    ? state
    : undefined;
}

/** The question a phase that draws a round's board is about: the round's own where there is one,
 * and only the dock's where a jump is starting that round rather than moving it along. */
function roundTopic(written: { topic: string } | undefined, topic: string): string {
  return written?.topic ?? topic;
}

/** A board for the phases that draw one, from the round that was being written or read. The
 * room's marks come with the board when there is a round to carry them from, and are empty only
 * where there is not: a jump from the lobby has no round behind it and so carries nothing. */
function carriedBoard(
  written:
    | (Pick<BoardState, 'answers' | 'answerShares' | 'mult'> &
        Partial<Pick<BoardState, 'groupRejections' | 'groupLikes'>>)
    | undefined
): Pick<BoardState, 'answers' | 'groupRejections' | 'groupLikes' | 'answerShares' | 'mult'> {
  return {
    answers: written?.answers ?? new Map<PlayerId, string>(),
    groupRejections: written?.groupRejections ?? new Map(),
    groupLikes: written?.groupLikes ?? new Map(),
    answerShares: written?.answerShares,
    mult: written?.mult,
  };
}

/** The part of a phase that is not the room around it. One switch rather than one handler per
 * phase, since a jump is a debug affordance and its rules are exactly the shape of the state. */
function phaseBody(
  base: { durationMs: number; startedAt: number },
  state: HostState,
  phase: PhaseName,
  topic: string
) {
  // The round the room was writing or reading, carried into the phases that draw a board.
  const written = writtenRound(state);
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
        topic: roundTopic(written, topic),
        // The round's answers, when the dock stepped here from Writing. Empty from anywhere else,
        // because there is nothing to carry and a jump is not a round anybody played.
        ...carriedBoard(written),
      };
    case 'Scores':
      // The same board the review draws, so a room that is put straight into the count is not shown
      // an empty stage. A jump from nowhere gets an empty board rather than somebody else's.
      return {
        phase,
        ...base,
        topic: roundTopic(written, topic),
        ...carriedBoard(written),
        scores: new Map<PlayerId, number>(),
      };
    case 'Leaderboard':
      // The places and the round they were paid in: a jump here has no board to draw, only
      // the totals the room has settled so far and what this round gave.
      return { phase, ...base, scores: new Map<PlayerId, number>() };
    case 'Winning':
      // The show and the standings under it: a jump here has no board to draw, only where the
      // room ended up.
      return { phase, ...base, scores: new Map<PlayerId, number>() };
    default:
      return assertNever(phase);
  }
}
