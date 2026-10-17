import { HostPlayerId, HostSession, TrysteroTransport } from '@/Network';
import { GameConfig, toPublicState } from '@/Game';
import { PlayerLook } from '@/Core';
import { Session } from './Session';

/** The room as the host's own screens are shown it: the same projection every client is sent,
 * since the host is in the room and reads the same board they do. */
function publicStateOf(hostSession: HostSession) {
  return () => {
    const state = hostSession.getState();
    return state === undefined ? undefined : toPublicState(state);
  };
}

/** Who this device is in the room, and what it is waiting on. The host is the name in the room,
 * so nothing can collide with it, opens the room it is answering so is never the one being
 * found, and cannot be refused a seat so has no room limit to quote of its own. */
function hostIdentity(
  hostSession: HostSession
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
    role: 'Host',
    getPublicState: publicStateOf(hostSession),
    getPlayerId: () => HostPlayerId,
    getClockOffsetMs: () => 0,
    onUpdate: (listener) => hostSession.onUpdate(listener),
    onHostLeave: () => {},
    getBlocked: () => undefined,
    getConnectionHint: () => undefined,
    getRoomLimit: () => GameConfig.limits.maxPlayers,
    join: () => {},
  };
}

/** What the host does to the room before and around the game: the setting, the roster, and this
 * player's own seat in it. */
function hostRoomActions(
  hostSession: HostSession
): Pick<
  Session,
  | 'setLook'
  | 'setPace'
  | 'setThemes'
  | 'setCustomThemes'
  | 'removeCustomTheme'
  | 'getCustomThemes'
  | 'addBot'
  | 'submitAnswer'
  | 'setEditingAnswer'
  | 'rejectGroup'
  | 'likeGroup'
  | 'nextTurn'
  | 'startGame'
> {
  return {
    setLook: (look) => hostSession.setOwnLook(look),
    setPace: (pace) => hostSession.setPace(pace),
    setThemes: (mode, themes) => hostSession.setThemes(mode, themes),
    setCustomThemes: (themes) => hostSession.setCustomThemes(themes),
    removeCustomTheme: (id) => hostSession.removeCustomTheme(id),
    getCustomThemes: () => hostSession.getCustomThemes(),
    addBot: () => hostSession.addBot(),
    submitAnswer: (text) => hostSession.submitOwnAnswer(text.trim()),
    setEditingAnswer: (editing) => hostSession.setOwnEditingAnswer(editing),
    rejectGroup: (groupId) => hostSession.rejectOwnGroup(groupId),
    likeGroup: (groupId) => hostSession.likeOwnGroup(groupId),
    nextTurn: () => hostSession.nextTurn(),
    startGame: () => hostSession.startGame(),
  };
}

/** The round flow, which only the host ever moves: the phases, the bank, and the sweep. */
function hostRoundActions(
  hostSession: HostSession
): Pick<
  Session,
  | 'startWriting'
  | 'revealQuestion'
  | 'chooseTheme'
  | 'startRandomPick'
  | 'resolveRandomPick'
  | 'setPaused'
  | 'endReviewing'
  | 'nextRound'
  | 'nextPhase'
  | 'finish'
  | 'kick'
  | 'stop'
> {
  return {
    startWriting: (topic) => hostSession.startWriting(topic),
    revealQuestion: (question) => hostSession.revealQuestion(question),
    chooseTheme: (theme) => hostSession.chooseTheme(theme),
    startRandomPick: () => hostSession.startRandomPick(),
    resolveRandomPick: () => hostSession.resolveRandomPick(),
    setPaused: (paused) => hostSession.setPaused(paused),
    endReviewing: (durationMs) => hostSession.endReviewing(durationMs),
    nextRound: () => hostSession.nextRound(),
    nextPhase: (topic) => hostSession.nextPhase(topic),
    finish: () => hostSession.finish(),
    kick: (playerId) => hostSession.kick(playerId),
    stop: () => hostSession.stop(),
  };
}

export function createHostSession(
  roomCode: string,
  playerName: string,
  look: PlayerLook
): Session {
  const hostSession = new HostSession(new TrysteroTransport());
  hostSession.start(roomCode, playerName, look);
  return {
    ...hostIdentity(hostSession),
    ...hostRoomActions(hostSession),
    ...hostRoundActions(hostSession),
  };
}
