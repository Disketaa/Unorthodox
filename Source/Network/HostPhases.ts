import * as Game from '@/Game';
import { createLogger } from '@/Core';

const log = createLogger('HostPhases');

/** The actions that move the game between phases. Split out of the session so the rules about
 * when a phase may end sit in one place: each method here is the only thing that can trigger
 * its transition. */
export function startGame(
  state: Game.HostState | undefined,
  durationMs: number
): Game.HostState {
  if (state?.phase !== 'Lobby') {
    return state ?? Game.freshLobbyState();
  }
  log('info', 'starting game');
  return Game.reducer(state, { type: 'START_GAME', durationMs, startedAt: Date.now() });
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
  if (state === undefined) {
    return Game.freshLobbyState();
  }
  return Game.reducer(state, {
    type: 'GO_TO_PHASE',
    phase,
    topic,
    durationMs,
    startedAt: Date.now(),
  });
}
