/** The host's game state, written out as plain data, one shape per phase. Split from the reading
 * side because what a phase writes is a small table, while the guards that read it back are the
 * fiddly half. */
import type { HostState, Pace, Player, RandomPick } from '@/Game';
import type { PlayerId, ThemeId } from '@/Core';
import { rejectionsOut } from './RoomRejections';

/** The phases that carry a clock, which is every phase but Lobby and Final. */
type TimedHostState = Extract<HostState, { durationMs: number }>;

/** What every phase carries whatever it is doing, in the plain shape it goes out as. */
interface Members {
  players: [PlayerId, Player][];
  scores: [PlayerId, number][];
  turnPlayerId: PlayerId | null;
  pace: Pace;
  themeRounds: [ThemeId, number][];
}

/** The roster, totals, turn, pace and per-theme round counts every phase carries. The counts
 * among them, since a resumed room that forgot them would refill every row of ticks on the
 * bank. */
function membersOf(state: HostState): Members {
  return {
    players: [...state.players.entries()],
    scores: [...state.cumulativeScores.entries()],
    turnPlayerId: state.turnPlayerId,
    pace: state.pace,
    themeRounds: [...state.themeRounds.entries()],
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

/** The room's own roll, if it is mid-sweep. Written because a host that refreshed during one has
 * * to come back into the same sweep rather than leave the bank open a second time. */
function pickingOf(state: HostState): { picking?: RandomPick } {
  return state.phase === 'Choosing' && state.picking !== undefined
    ? { picking: state.picking }
    : {};
}

/** One bank's whole state: the room, its clock, the theme on it and the roll running over it. */
function choosingOf(state: Extract<HostState, { phase: 'Choosing' }>, members: Members) {
  return {
    ...members,
    ...clockOf(state),
    phase: state.phase,
    ...themeOf(state),
    ...pickingOf(state),
    ...(state.answeredAt === undefined ? {} : { answeredAt: state.answeredAt }),
    leadInMs: state.leadInMs,
  };
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
    return choosingOf(state, members);
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
