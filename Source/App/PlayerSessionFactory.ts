import { ClientSession, TrysteroTransport } from '@/Network';
import { PlayerLook } from '@/Core';
import { Session } from './Session';

/** The moves a client makes in its own seat: its answer, and the theme it presses when its turn
 * comes round. Everything a client is not the one to decide is a no-op — the room's round flow
 * belongs to the host, and what arrives instead is whatever the host decides. */
function playerMoves(
  clientSession: ClientSession
): Pick<
  Session,
  | 'setLook'
  | 'getCustomThemes'
  | 'submitAnswer'
  | 'setEditingAnswer'
  | 'rejectGroup'
  | 'likeGroup'
  | 'chooseTheme'
  | 'stop'
> {
  return {
    setLook: (look) => clientSession.setLook(look),
    getCustomThemes: () => clientSession.getCustomThemes(),
    submitAnswer: (text) => clientSession.submitAnswer(text.trim()),
    setEditingAnswer: (editing) => clientSession.setEditingAnswer(editing),
    rejectGroup: (groupId) => clientSession.rejectGroup(groupId),
    likeGroup: (groupId) => clientSession.likeGroup(groupId),
    chooseTheme: (theme) => clientSession.chooseTheme(theme),
    stop: () => clientSession.stop(),
  };
}

/** Everything a client is only shown: the mirror the host's projection is written onto, this
 * device's own seat in the room, and what the room is willing to say about how long it is
 * taking. */
function playerSeat(
  clientSession: ClientSession
): Pick<
  Session,
  | 'role'
  | 'getPublicState'
  | 'getPlayerId'
  | 'getClockOffsetMs'
  | 'onUpdate'
  | 'onHostLeave'
  | 'getBlocked'
  | 'getConnectionHint'
  | 'getRoomLimit'
  | 'join'
> {
  return {
    role: 'Player',
    getPublicState: () => clientSession.getState(),
    getPlayerId: () => clientSession.getPlayerId(),
    getClockOffsetMs: () => clientSession.getClockOffsetMs(),
    onUpdate: (listener) => clientSession.onUpdate(listener),
    onHostLeave: (listener) => clientSession.onHostLeave(listener),
    getBlocked: () => clientSession.getBlocked(),
    getConnectionHint: () => clientSession.getConnectionHint(),
    getRoomLimit: () => clientSession.getRoomLimit(),
    join: () => {},
  };
}

/** Everything a client is only shown, and nothing it decides: the presses that belong to the
 * host alone, refused outright rather than answered late. */
function playerNoDecisions(): Pick<
  Session,
  | 'setPace'
  | 'setThemes'
  | 'addBot'
  | 'nextTurn'
  | 'startGame'
  | 'startWriting'
  | 'revealQuestion'
  | 'startRandomPick'
  | 'resolveRandomPick'
  | 'setPaused'
  | 'endReviewing'
  | 'nextRound'
  | 'nextPhase'
  | 'finish'
  | 'kick'
> {
  // A pace press is a local look only, and a theme press would be a client narrowing the bank the
  // whole room is about to be offered: both belong to the host, as does every phase after this.
  return {
    setPace: () => {},
    setThemes: () => {},
    addBot: () => {},
    nextTurn: () => {},
    startGame: () => {},
    startWriting: () => {},
    revealQuestion: () => {},
    startRandomPick: () => {},
    resolveRandomPick: () => {},
    setPaused: () => {},
    endReviewing: () => {},
    nextRound: () => {},
    nextPhase: () => {},
    finish: () => {},
    kick: () => {},
  };
}

export function createPlayerSession(
  roomCode: string,
  playerName: string,
  look: PlayerLook
): Session {
  const clientSession = new ClientSession(new TrysteroTransport());
  clientSession.start(roomCode, playerName);
  clientSession.join(playerName.trim(), look);
  return {
    ...playerSeat(clientSession),
    ...playerMoves(clientSession),
    ...playerNoDecisions(),
  };
}
