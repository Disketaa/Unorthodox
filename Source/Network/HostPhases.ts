import * as Game from '@/Game';
import { createLogger } from '@/Core';

const log = createLogger('HostPhases');

/** The actions that move the game between phases. Split out of the session so the rules about
 * when a phase may end sit in one place: each method here is the only thing that can trigger
 * its transition. */
export function startGame(state: Game.HostState | undefined, topic: string, durationMs: number): Game.HostState {
  if (state?.phase !== 'Lobby') {
    return state ?? emptyLobby();
  }
  log('info', 'starting game', topic, durationMs);
  return Game.reducer(state, { type: 'START_GAME', topic, durationMs, startedAt: Date.now() });
}

/** Writing to Reviewing, once every seated player has answered. */
export function closeWriting(
  state: Game.HostState | undefined,
  durationMs: number,
  expectedAnswers: number,
): Game.HostState {
  if (state?.phase !== 'Writing') {
    return state ?? emptyLobby();
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
  durationMs: number,
): Game.HostState {
  if (state?.phase !== 'Reviewing') {
    return state ?? emptyLobby();
  }
  return Game.reducer(state, { type: 'END_REVIEWING', startedAt: Date.now(), durationMs });
}

/** Scores, or an abandoned Reviewing, to the next Writing round. */
export function nextRound(
  state: Game.HostState | undefined,
  topic: string,
  durationMs: number,
): Game.HostState {
  if (state?.phase !== 'Scores' && state?.phase !== 'Reviewing') {
    return state ?? emptyLobby();
  }
  log('info', 'starting next round', topic);
  return Game.reducer(state, { type: 'NEXT_ROUND', topic, durationMs, startedAt: Date.now() });
}

function emptyLobby(): Game.HostState {
  return Game.freshLobbyState();
}
