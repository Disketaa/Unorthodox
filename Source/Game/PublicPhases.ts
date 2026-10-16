import { randomFor, shuffle, ThemeId, CustomTheme } from '@/Core';
import { marksForRoom } from './PublicMarks';
import { declinedGroupIds } from './RoundScoring';
import { HostState, ReviewingState } from './GameState';
import { groupAnswersWithPlayers } from './Grouping';
import type {
  PublicLobbyState,
  PublicPlayer,
  PublicReviewingState,
  PublicWritingState,
  PublicChoosingState,
  PublicRoom,
} from './PublicState';

/** The roster every phase sends, so the bar of players runs across the whole game and a client
 * that refreshed mid-round is handed the room back rather than an empty strip. */
export function publicPlayers(state: HostState): PublicPlayer[] {
  const players: PublicPlayer[] = [];
  state.players.forEach((player, id) => {
    players.push({ id, name: player.name, look: player.look, isOnline: player.isOnline });
  });
  return players;
}

/** The room's turn, pace and per-theme round counts, as every phase carries them. */
export function room(state: HostState): PublicRoom {
  return {
    turnPlayerId: state.turnPlayerId,
    pace: state.pace,
    themes: [...state.themes],
    themeMode: state.themeMode,
    customThemes: [...(state.customThemes ?? new Map<number, CustomTheme>()).values()].map((theme) => ({
      id: theme.id,
      name: theme.name,
      color: theme.color,
      questions: [...theme.questions],
    })),
    spent: spentByTheme(state.themeRounds),
    ...(state.affectedPlayers !== undefined && state.affectedPlayers.size > 0
      ? { affectedPlayerIds: [...state.affectedPlayers] }
      : {}),
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
export function themeOf(state: HostState): { theme?: ThemeId } {
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
 * plus one card between all the players who wrote nothing. Seeded from the round and not the
 * clock, since letting a held room go shifts the clock. */
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
  // thing is. One blank each was a board with more cards than there were people to put in it. The
  // card still says how many, so the room still learns how many sat the round out.
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
