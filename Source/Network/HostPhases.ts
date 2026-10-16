import * as Game from '@/Game';
import { createLogger, type PlayerId, type Random, type ThemeRef } from '@/Core';
import { affectedByChoice } from './HostIncoming';
import { drawableTheme } from './HostThemePool';

const log = createLogger('HostPhases');

/** The actions that move the game between phases. Split out of the session so the rules about
 * when a phase may end sit in one place: each method here is the only thing that can trigger
 * its transition. */
export function startGame(
  state: Game.HostState | undefined,
  durationMs: number,
  leadInMs = 0
): Game.HostState {
  if (state?.phase !== 'Lobby') return state ?? Game.freshLobbyState();
  log('info', 'starting game');
  return Game.reducer(state, {
    type: 'START_GAME',
    durationMs,
    startedAt: Date.now(),
    leadInMs,
  });
}

/** The theme answered, so the round's question is drawn from that theme's bank and starts
 * arriving. The draw sits here rather than in the reducer, since what a theme asks about is
 * content the game rules do not hold. */
export function revealQuestion(
  state: Game.HostState | undefined,
  question: string
): Game.HostState {
  if (state?.phase !== 'Choosing' || state.theme === undefined) {
    return state ?? Game.freshLobbyState();
  }
  log('info', 'revealing the round question');
  return Game.reducer(state, { type: 'REVEAL_QUESTION', question, at: Date.now() });
}

export function startWriting(
  state: Game.HostState | undefined,
  topic: string,
  durationMs: number
): Game.HostState {
  if (state?.phase !== 'Choosing') {
    return state ?? Game.freshLobbyState();
  }
  log('info', 'starting writing', topic);
  return Game.reducer(state, {
    type: 'START_WRITING',
    topic,
    durationMs,
    startedAt: Date.now(),
  });
}

/** Nobody pressed a card before the bank closed, so the room is pressing one. */
export function startRandomPick(
  state: Game.HostState | undefined,
  roomCode: string,
  random: Random = Math.random
): Game.HostState {
  if (state?.phase !== 'Choosing' || state.theme !== undefined || state.picking !== undefined) {
    return state ?? Game.freshLobbyState();
  }
  const theme = drawableTheme(state, roomCode, random);
  log('info', 'bank left open, room is picking', theme);
  return Game.reducer(state, { type: 'START_RANDOM_PICK', theme, startedAt: Date.now() });
}

/** The sweep is over and the room's roll commits. */
export function resolveRandomPick(
  state: Game.HostState | undefined,
  roomCode: string | undefined
): Game.HostState {
  if (state?.phase !== 'Choosing' || state.picking === undefined) {
    return state ?? Game.freshLobbyState();
  }
  log('info', 'room is settling on its own pick');
  const affected = affectedByChoice(state, roomCode, state.picking.theme, '');
  return Game.reducer(state, {
    type: 'RESOLVE_RANDOM_PICK',
    at: Date.now(),
    ...(affected === undefined ? {} : { affectedPlayers: affected }),
  });
}

/** A seat answering the bank, with the seats the card's effect reaches worked out beside it. */
export function chooseTheme(
  state: Game.HostState | undefined,
  roomCode: string | undefined,
  theme: ThemeRef,
  playerId: PlayerId
): Game.HostState {
  if (state === undefined) return Game.freshLobbyState();
  const affected = affectedByChoice(state, roomCode, theme, playerId);
  return Game.reducer(state, {
    type: 'CHOOSE_THEME',
    playerId,
    theme,
    at: Date.now(),
    ...(affected === undefined ? {} : { affectedPlayers: affected }),
  });
}

/** Holding the room, or letting it go. Not a phase change, but the host pressing one control, so
 * it sits here with the rest of the moves the room can be put through. */
export function setPaused(state: Game.HostState | undefined, paused: boolean): Game.HostState {
  const held = state ?? Game.freshLobbyState();
  log('info', paused ? 'holding the room' : 'letting the room run');
  const at = Date.now();
  return Game.reducer(held, paused ? { type: 'PAUSE', at } : { type: 'RESUME', at });
}

/** Writing to Reviewing, once every seated player has answered. */
export function closeWriting(
  state: Game.HostState | undefined,
  durationMs: number,
  expectedAnswers: number
): Game.HostState {
  if (state?.phase !== 'Writing') {
    return state ?? Game.freshLobbyState();
  }
  if (state.answers.size < expectedAnswers) {
    log('debug', 'waiting for answers', state.answers.size, 'of', expectedAnswers);
    return state;
  }
  return Game.reducer(state, { type: 'START_REVIEWING', startedAt: Date.now(), durationMs });
}

/** Reviewing to Scores, once reviewing time is up. */
export function closeReviewing(
  state: Game.HostState | undefined,
  durationMs: number
): Game.HostState {
  if (state?.phase !== 'Reviewing') {
    return state ?? Game.freshLobbyState();
  }
  return Game.reducer(state, { type: 'END_REVIEWING', startedAt: Date.now(), durationMs });
}

/** Scores, or an abandoned Reviewing, to the next round's theme choice. */
export function nextRound(
  state: Game.HostState | undefined,
  durationMs: number
): Game.HostState {
  if (state?.phase !== 'Scores' && state?.phase !== 'Reviewing') {
    return state ?? Game.freshLobbyState();
  }
  log('info', 'starting next round');
  // The topic is not carried: Choosing has none, and the next round is given its own when the
  // theme is picked. Only the phase move is decided here.
  return Game.reducer(state, { type: 'NEXT_ROUND', durationMs, startedAt: Date.now() });
}

export function nextPhase(
  state: Game.HostState | undefined,
  phase: Game.PhaseName,
  topic: string,
  durationMs: number
): Game.HostState {
  if (state === undefined) return Game.freshLobbyState();
  return Game.reducer(state, {
    type: 'GO_TO_PHASE',
    phase,
    topic,
    durationMs,
    startedAt: Date.now(),
  });
}
