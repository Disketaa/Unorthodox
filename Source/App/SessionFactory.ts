import {
  ClientSession,
  HostPlayerId,
  HostSession,
  TrysteroTransport,
} from '@/Network';
import { GameConfig, toPublicState } from '@/Game';
import { PlayerLook } from '@/Core';
import { Session, SessionRole } from './Session';

function createHostSession(roomCode: string, playerName: string, look: PlayerLook): Session {
  const hostSession = new HostSession(new TrysteroTransport());
  hostSession.start(roomCode, playerName, look);

  const getPublicState = () => {
    const state = hostSession.getState();
    return state === undefined ? undefined : toPublicState(state);
  };

  return {
    role: 'Host',
    getPublicState,
    getPlayerId: () => HostPlayerId,
    // The host is the clock source, so it has no skew to correct for.
    getClockOffsetMs: () => 0,
    onUpdate: (listener) => hostSession.onUpdate(listener),
    onHostLeave: () => {},
    // The host is the name in the room, so nothing can collide with it.
    getBlocked: () => undefined,
    // The host cannot be refused a seat, so it has no room limit to quote.
    getRoomLimit: () => GameConfig.limits.maxPlayers,
    join: () => {},
    setLook: (look) => hostSession.setOwnLook(look),
    setPace: (pace) => hostSession.setPace(pace),
    addBot: () => hostSession.addBot(),
    submitAnswer: (text) => hostSession.submitOwnAnswer(text.trim()),
    rejectGroup: (groupId) => hostSession.rejectOwnGroup(groupId),
    startGame: (topic, durationMs) => hostSession.startGame(topic, durationMs),
    closePhase: (durationMs) => hostSession.endReviewing(durationMs),
    startNextRound: (topic, durationMs) => hostSession.nextRound(topic, durationMs),
    finish: () => hostSession.finish(),
    kick: (playerId) => hostSession.kick(playerId),
    stop: () => hostSession.stop(),
  };
}

function createPlayerSession(roomCode: string, playerName: string, look: PlayerLook): Session {
  const clientSession = new ClientSession(new TrysteroTransport());
  clientSession.start(roomCode, playerName);
  clientSession.join(playerName.trim(), look);

  return {
    role: 'Player',
    getPublicState: () => clientSession.getState(),
    getPlayerId: () => clientSession.getPlayerId(),
    getClockOffsetMs: () => clientSession.getClockOffsetMs(),
    onUpdate: (listener) => clientSession.onUpdate(listener),
    onHostLeave: (listener) => clientSession.onHostLeave(listener),
    getBlocked: () => clientSession.getBlocked(),
    getRoomLimit: () => clientSession.getRoomLimit(),
    join: () => {},
    setLook: (look) => clientSession.setLook(look),
    // A client asking for a pace would be two people deciding the same setting, and the
    // host's is the one that counts. Pressing a button is a local look at the numbers.
    setPace: () => {},
    // A client cannot put anybody in the room, least of all itself.
    addBot: () => {},
    submitAnswer: (text) => clientSession.submitAnswer(text.trim()),
    rejectGroup: (groupId) => clientSession.rejectGroup(groupId),
    startGame: () => {},
    closePhase: () => {},
    startNextRound: () => {},
    finish: () => {},
    kick: () => {},
    stop: () => clientSession.stop(),
  };
}

/** Build the session for a room. The host owns the game state, a client mirrors it. */
export function createSession(
  role: SessionRole,
  roomCode: string,
  playerName: string,
  look: PlayerLook,
): Session {
  return role === 'Host'
    ? createHostSession(roomCode, playerName, look)
    : createPlayerSession(roomCode, playerName, look);
}
