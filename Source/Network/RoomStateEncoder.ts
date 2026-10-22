/** The host's game state, written out as plain data, one shape per phase. Split from the reading
 * side because what a phase writes is a small table, while the guards that read it back are the
 * fiddly half. */
import type { HostState, Pace, Player, RandomPick } from '@/Game';
import type { PlayerId, ThemeId, ThemeMode, CustomTheme } from '@/Core';
import { groupVotesOut } from './RoomGroupVotes';

/** The phases that carry a clock, which is every phase but Lobby and Final. */
type TimedHostState = Extract<HostState, { durationMs: number }>;

/** What every phase carries whatever it is doing, in the plain shape it goes out as. */
interface Members {
  players: [PlayerId, Player][];
  scores: [PlayerId, number][];
  turnPlayerId: PlayerId | null;
  pace: Pace;
  themes: ThemeId[];
  themeMode: ThemeMode;
  themeRounds: [ThemeId, number][];
  /** The themes the room named for itself, which are its own and not files this build has: a
   * room that lost them comes back into a bank its custom cards are not on. */
  customThemes: CustomTheme[];
  affected?: PlayerId[];
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
    themes: [...state.themes],
    themeMode: state.themeMode,
    themeRounds: [...state.themeRounds.entries()],
    customThemes: [...(state.customThemes?.values() ?? [])],
    ...(state.affectedPlayers !== undefined && state.affectedPlayers.size > 0
      ? { affected: [...state.affectedPlayers] }
      : {}),
  };
}

/** The clock every timed phase carries, counted from the host that started it: how long it runs,
 * and when it started, which is what a phase resumed after a refresh counts from. */
function clockOf(state: TimedHostState) {
  return { durationMs: state.durationMs, startedAt: state.startedAt };
}

/** The topic and the answers to it, shared by the phases that ask and read a round. Each
 * answer's share goes out with it: a missing one reads as the fastest there is, so a host that
 * refreshed mid-round came back to a board where every answer scored the full scale. */
function topicOf(state: Extract<HostState, { phase: 'Writing' | 'Reviewing' | 'Scores' }>) {
  return {
    topic: state.topic,
    answers: [...state.answers],
    // Omitted rather than written as null where there are none, so a room saved before this reads
    // back as a room that timed nothing rather than as a room that timed nothing at all.
    ...(state.answerShares === undefined || state.answerShares.size === 0
      ? {}
      : { answerShares: [...state.answerShares] }),
  };
}

/** The theme the room settled on, which every phase after the choice carries. Omitted rather
 * than written as null where there is none, so a resumed room and a fresh one read the same. */
function themeOf(state: HostState): { theme?: ThemeId } {
  return state.phase === 'Lobby' || state.theme === undefined ? {} : { theme: state.theme };
}

/** The room's own roll, if it is mid-sweep. Written because a host that refreshed during one has
 * to come back into the same sweep rather than leave the bank open a second time. */
function pickingOf(state: HostState): { picking?: RandomPick } {
  return state.phase === 'Choosing' && state.picking !== undefined
    ? { picking: state.picking }
    : {};
}

/** The question being written out, if it is. Written because a host that refreshed mid-question
 * has to come back into the same question rather than leave the room with nothing on screen. */
function questionOf(state: Extract<HostState, { phase: 'Choosing' }>) {
  return {
    ...(state.question === undefined ? {} : { question: state.question }),
    ...(state.questionAt === undefined ? {} : { questionAt: state.questionAt }),
  };
}

/** One bank's whole state: the room, its clock, the theme on it, the roll running over it and
 * the question being read. */
function choosingOf(state: Extract<HostState, { phase: 'Choosing' }>, members: Members) {
  return {
    ...members,
    ...clockOf(state),
    phase: state.phase,
    ...themeOf(state),
    ...pickingOf(state),
    ...(state.answeredAt === undefined ? {} : { answeredAt: state.answeredAt }),
    ...questionOf(state),
    leadInMs: state.leadInMs,
  };
}

/** The round counted: the board travels with the count, not just the count, since this phase
 * draws the same cards the review did and a host that refreshed here would come back to an
 * empty stage. */
function scoresOf(
  state: Extract<HostState, { phase: 'Scores' }>,
  members: Members,
  clock: { durationMs: number; startedAt: number }
) {
  return {
    ...members,
    ...clock,
    phase: state.phase,
    ...topicOf(state),
    rejections: groupVotesOut(state.groupRejections),
    likes: groupVotesOut(state.groupLikes),
    round: [...state.scores],
    ...themeOf(state),
  };
}

/** The room's places and the clock they are read against. The totals travel in the members every
 * phase carries, so a host that refreshed here comes back to the same standings the room is
 * looking at. */
function leaderboardOf(state: Extract<HostState, { phase: 'Leaderboard' }>, members: Members) {
  return {
    ...members,
    ...clockOf(state),
    phase: state.phase,
    round: [...state.scores],
    ...themeOf(state),
  };
}

/** The show and the standings under it: the same clock the leaderboard is read against, so a
 * host that refreshed here comes back into the show where the room is watching it. */
function winningOf(state: Extract<HostState, { phase: 'Winning' }>, members: Members) {
  return {
    ...members,
    ...clockOf(state),
    phase: state.phase,
    ...themeOf(state),
  };
}

export function encodeRoomState(state: HostState): Record<string, unknown> {
  const members = membersOf(state);
  if (state.phase === 'Lobby') {
    return { ...members, phase: state.phase, pace: state.pace };
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
      rejections: groupVotesOut(state.groupRejections),
      likes: groupVotesOut(state.groupLikes),
      ...themeOf(state),
    };
  }
  if (state.phase === 'Scores') {
    return scoresOf(state, members, clock);
  }
  if (state.phase === 'Leaderboard') {
    return leaderboardOf(state, members);
  }
  if (state.phase === 'Winning') {
    return winningOf(state, members);
  }
  // unreachable
  return {};
}
