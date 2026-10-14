import { PlayerId, randomFor, shuffle, ThemeId } from '@/Core';
import { marksForRoom } from './PublicMarks';
import { declinedGroupIds } from './RoundScoring';
import { HostState, ReviewingState } from './GameState';
import { groupAnswersWithPlayers } from './Grouping';
import type {
  PublicFinalState,
  PublicLobbyState,
  PublicPlayer,
  PublicReviewingState,
  PublicScoresState,
  PublicWritingState,
  PublicChoosingState,
  PublicRoom,
} from './PublicState';

/** One phase of the host's state, as a client is told about it. Every phase sends the roster and
 * the room's pace, so the bar of players runs across the whole game and a client that refreshed
 * mid-round is handed the room back rather than an empty strip. */
function publicPlayers(state: HostState): PublicPlayer[] {
  const players: PublicPlayer[] = [];
  state.players.forEach((player, id) => {
    players.push({ id, name: player.name, look: player.look, isOnline: player.isOnline });
  });
  return players;
}

/** A score map as the pairs a client reads, in the room's own order. */
function totalsOf(scores: ReadonlyMap<PlayerId, number>): { id: PlayerId; score: number }[] {
  const totals: { id: PlayerId; score: number }[] = [];
  scores.forEach((score, id) => totals.push({ id, score }));
  return totals;
}

/** The room's turn, pace and per-theme round counts, as every phase carries them. */
function room(state: HostState): PublicRoom {
  return {
    turnPlayerId: state.turnPlayerId,
    pace: state.pace,
    spent: spentByTheme(state.themeRounds),
    paused: state.paused,
    ...(state.pausedAt === undefined ? {} : { pausedAt: state.pausedAt }),
  };
}

/** The rounds already played in each theme, as pairs rather than a map, since this goes out as
 * plain data and a Map does not survive being sent any more than a field set to undefined does. */
function spentByTheme(themeRounds: ReadonlyMap<ThemeId, number>): PublicRoom['spent'] {
  const spent: PublicRoom['spent'] = [];
  themeRounds.forEach((rounds, theme) => spent.push({ theme, rounds }));
  return spent;
}

export function toPublicLobbyState(state: HostState): PublicLobbyState {
  if (state.phase !== 'Lobby') {
    throw new Error('Invalid state for Lobby');
  }
  return { ...room(state), phase: 'Lobby', players: publicPlayers(state) };
}

export function toPublicChoosingState(state: HostState): PublicChoosingState {
  if (state.phase !== 'Choosing') {
    throw new Error('Invalid state for Choosing');
  }
  return {
    ...room(state),
    phase: 'Choosing',
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    players: publicPlayers(state),
    // Left off the object entirely rather than sent as undefined, since the state goes out as
    // plain data: a field that is absent and a field that is null are not the same on the wire.
    ...(state.theme === undefined ? {} : { theme: state.theme }),
    ...(state.picking === undefined ? {} : { picking: state.picking }),
    ...(state.answeredAt === undefined ? {} : { answeredAt: state.answeredAt }),
    ...(state.question === undefined ? {} : { question: state.question }),
    ...(state.questionAt === undefined ? {} : { questionAt: state.questionAt }),
    leadInMs: state.leadInMs,
  };
}

/** The theme every phase after the choice carries, since the bank is on screen through all of
 * them. A spread rather than a named field on each phase, so a phase added without one still
 * sends the card the room pressed. */
function themeOf(state: HostState): { theme?: ThemeId } {
  return state.phase === 'Lobby' || state.theme === undefined ? {} : { theme: state.theme };
}

export function toPublicWritingState(state: HostState): PublicWritingState {
  if (state.phase !== 'Writing') {
    throw new Error('Invalid state for Writing');
  }
  return {
    ...room(state),
    phase: 'Writing',
    topic: state.topic,
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    submittedCount: state.answers.size,
    // The keys and not the values: who has written is what the bar of players draws, and the
    // answers themselves are nobody's business until the review groups them.
    submittedIds: [...state.answers.keys()],
    editingIds: [...(state.editing ?? [])],
    players: publicPlayers(state),
    ...themeOf(state),
  };
}

/** The board's cards: the answers as written, in an order nobody can read off who wrote what,
 * plus one card per player who wrote nothing, the blanks after the deal rather than in it.
 * Seeded from the round and not the clock, since letting a held room go shifts the clock.
 *
 * Grouped by the same walk the scorer uses, so a card and the points it is worth are about the
 * same set of people: two groupings over the same answers is two answers to the question. */
function reviewGroups(state: ReviewingState): PublicReviewingState['groups'] {
  const written = [...state.answers.values()];
  const answers = groupAnswersWithPlayers(state.answers).map((group) => ({
    groupId: group.groupId,
    text: group.answers[0] ?? '',
    playerCount: group.answers.length,
    playerIds: group.playerIds,
    isEmpty: false,
  }));
  const groups = shuffle(answers, randomFor(`${state.topic}:${written.join('|')}`));
  // Everybody who wrote nothing is one card between them, the way everybody who wrote the same
  // thing is. One blank each was a board that could be more cards than there were people with
  // something to say in it, and a corner of the room spent entirely on faces with nothing behind
  // them. The card still says how many, so the room still learns how many sat the round out.
  const blanked = [...state.players.keys()].filter((playerId) => !state.answers.has(playerId));
  if (blanked.length > 0) {
    groups.push({
      groupId: groups.length,
      text: '',
      playerCount: blanked.length,
      playerIds: blanked,
      isEmpty: true,
    });
  }
  return groups;
}

export function toPublicReviewingState(state: HostState): PublicReviewingState {
  if (state.phase !== 'Reviewing') {
    throw new Error('Invalid state for Reviewing');
  }
  const groups = reviewGroups(state);
  return {
    ...room(state),
    phase: 'Reviewing',
    topic: state.topic,
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    players: publicPlayers(state),
    groups,
    ...marksForRoom(state, declinedGroupIds(state)),
    ...themeOf(state),
  };
}

export function toPublicScoresState(state: HostState): PublicScoresState {
  if (state.phase !== 'Scores') {
    throw new Error('Invalid state for Scores');
  }
  return {
    ...room(state),
    phase: 'Scores',
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    players: publicPlayers(state),
    scores: totalsOf(state.scores),
    cumulative: totalsOf(state.cumulativeScores),
    ...themeOf(state),
  };
}

export function toPublicFinalState(state: HostState): PublicFinalState {
  if (state.phase !== 'Final') {
    throw new Error('Invalid state for Final');
  }
  return {
    ...room(state),
    phase: 'Final',
    durationMs: 0,
    players: publicPlayers(state),
    scores: totalsOf(state.cumulativeScores),
    ...themeOf(state),
  };
}
