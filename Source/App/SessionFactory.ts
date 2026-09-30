import {
  ClientSession,
  HostPlayerId,
  HostSession,
  TrysteroTransport,
} from '@/Network';
import { toPublicState } from '@/Game';
import { Session, SessionRole } from './Session';

function createHostSession(roomCode: string, playerName: string): Session {
  const hostSession = new HostSession(new TrysteroTransport());
  hostSession.start(roomCode, playerName);

  const getPublicState = () => {
    const state = hostSession.getState();
    return state === undefined ? undefined : toPublicState(state);
  };

  return {
    role: 'Host',
    getPublicState,
    getPlayerId: () => HostPlayerId,
    onUpdate: (listener) => hostSession.onUpdate(listener),
    onHostLeave: () => {},
    join: () => {},
    submitAnswer: (text) => hostSession.submitOwnAnswer(text.trim()),
    rejectGroup: (groupId) => hostSession.rejectOwnGroup(groupId),
    startGame: (topic, durationMs) => hostSession.startGame(topic, durationMs),
    closePhase: (durationMs) => hostSession.endReviewing(durationMs),
    startNextRound: (topic, durationMs) => hostSession.nextRound(topic, durationMs),
    finish: () => hostSession.finish(),
    stop: () => hostSession.stop(),
  };
}

function createPlayerSession(roomCode: string, playerName: string): Session {
  const clientSession = new ClientSession(new TrysteroTransport());
  clientSession.start(roomCode, playerName);
  clientSession.join(playerName.trim());

  return {
    role: 'Player',
    getPublicState: () => clientSession.getState(),
    getPlayerId: () => clientSession.getPlayerId(),
    onUpdate: (listener) => clientSession.onUpdate(listener),
    onHostLeave: (listener) => clientSession.onHostLeave(listener),
    join: () => {},
    submitAnswer: (text) => clientSession.submitAnswer(text.trim()),
    rejectGroup: (groupId) => clientSession.rejectGroup(groupId),
    startGame: () => {},
    closePhase: () => {},
    startNextRound: () => {},
    finish: () => {},
    stop: () => clientSession.stop(),
  };
}

/** Build the session for a room. The host owns the game state, a client mirrors it. */
export function createSession(role: SessionRole, roomCode: string, playerName: string): Session {
  return role === 'Host'
    ? createHostSession(roomCode, playerName)
    : createPlayerSession(roomCode, playerName);
}
