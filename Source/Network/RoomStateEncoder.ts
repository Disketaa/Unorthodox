/** The host's game state, written out as plain data, one shape per phase. Split from the reading
 * side because what a phase writes is a small table, while the guards that read it back are the
 * fiddly half. */
import type { HostState } from '@/Game';
import type { ThemeId } from '@/Core';
import { rejectionsOut } from './RoomRejections';

/** The phases that carry a clock, which is every phase but Lobby and Final. */
type TimedHostState = Extract<HostState, { durationMs: number }>;

/** The roster, totals, turn and pace every phase carries whatever it is doing. */
function membersOf(state: HostState) {
  return {
    players: [...state.players.entries()],
    scores: [...state.cumulativeScores.entries()],
    turnPlayerId: state.turnPlayerId,
    pace: state.pace,
  };
}

/** The clock every timed phase carries, counted from the host that started it: how long it runs,
 * and when it started, which is what a phase resumed after a refresh counts from. */
function clockOf(state: TimedHostState) {
  return { durationMs: state.durationMs, startedAt: state.startedAt };
}

/** The topic and the answers to it, which the two phases that ask and read a round share.
 * Narrowed here because the phase check that got us this far is the one the caller already
 * made. */
function topicOf(state: Extract<HostState, { phase: 'Writing' | 'Reviewing' }>) {
  return { topic: state.topic, answers: [...state.answers] };
}

/** The theme the room settled on, which every phase after the choice carries. Omitted rather
 * than written as null where there is none, so a resumed room and a fresh one read the same. */
function themeOf(state: HostState): { theme?: ThemeId } {
  return state.phase === 'Lobby' || state.theme === undefined ? {} : { theme: state.theme };
}

export function encodeRoomState(state: HostState): Record<string, unknown> {
  const members = membersOf(state);
  if (state.phase === 'Lobby') {
    return { ...members, phase: state.phase, pace: state.pace };
  }
  if (state.phase === 'Final') {
    return { ...members, phase: state.phase, ...themeOf(state) };
  }
  const clock = clockOf(state);
  if (state.phase === 'Choosing') {
    return { ...members, ...clock, phase: state.phase, ...themeOf(state) };
  }
  if (state.phase === 'Writing') {
    return { ...members, ...clock, phase: state.phase, ...topicOf(state), ...themeOf(state) };
  }
  if (state.phase === 'Reviewing') {
    return {
      ...members,
      ...clock,
      phase: state.phase,
      ...topicOf(state),
      rejections: rejectionsOut(state.groupRejections),
      ...themeOf(state),
    };
  }
  if (state.phase === 'Scores') {
    return {
      ...members,
      ...clock,
      phase: state.phase,
      round: [...state.scores],
      ...themeOf(state),
    };
  }
  // unreachable
  return {};
}
