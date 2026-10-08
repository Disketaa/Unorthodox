import { ClientMessage } from './Protocol';
import { Transport } from './Transport';
import { HostRoster, resolveLook } from './HostRoster';
import { GameAction, HostState } from '@/Game';
import { GameConfig } from '@/Game';
import { createLogger } from '@/Core';

const log = createLogger('HostIncoming');

/** What the host needs to turn one message from a client into a change of state. */
export interface IncomingContext {
  message: ClientMessage;
  /** The transport address it arrived from, which is not a player id. */
  peerId: string;
  roster: HostRoster;
  transport: Transport;
  state: HostState;
}

/** A player taking a seat, or taking it back. Its own function because joining is the only
 * message that can be refused, and every refusal is a message back rather than a change of
 * state, which is why it needs the transport and the switch above does not. */
function joinAction(context: IncomingContext): GameAction | undefined {
  const { message, peerId, roster, transport } = context;
  if (message.type !== 'Join') return undefined;
  if (!roster.hasRoom && !roster.hasSeatForName(message.name)) {
    // Every seat is taken, so this player cannot be given one. Checked before the phase, because
    // a returning player keeps the seat they already hold rather than needing one to be free.
    log('info', 'refusing a join into a room with no seat left');
    transport.sendToPeer(peerId, {
      type: 'RoomFull',
      maxPlayers: GameConfig.limits.maxPlayers,
    });
    return undefined;
  }
  if (context.state.phase !== 'Lobby' && !roster.hasSeatForName(message.name)) {
    // A room mid-round has nowhere to put a player who was never in it: the answer they owe is
    // already being read. Turned away rather than ignored, since an ignored client has only the
    // joining screen forever. Asked about seats: a tab that refreshed is that player.
    log('info', 'refusing a join into a room that has started');
    transport.sendToPeer(peerId, { type: 'AlreadyStarted' });
    return undefined;
  }
  if (roster.isNameActive(message.name, message.clientId)) {
    // Two players under one name would be the same person to the host in every answer and score,
    // so the second is turned away. A name held by the same browser is not this case: that is a
    // player who refreshed, and they are the one who should be seated.
    log('info', 'refusing a join under a name already in play', message.name);
    transport.sendToPeer(peerId, { type: 'NameRejected' });
    return undefined;
  }
  // A player we already know is the same person coming back, so they keep the seat and the
  // character they had rather than a fresh roll.
  const playerId = roster.claimSeat(message.name, peerId, message.clientId);
  const look = resolveLook(knownLook(context.state, playerId), message.look);
  // Answer the peer the message came from: the game player id is assigned here and never reaches
  // the wire, so it is not routable.
  log('info', 'assigning playerId', playerId, 'to peer', peerId);
  transport.sendToPeer(peerId, { type: 'SetPlayerId', playerId });
  return { type: 'JOIN', playerId, name: message.name, look };
}

/** The game action a client message asks for, or undefined if it asks for none. A join is the
 * only message that can be refused, and refusing it is a message of its own rather than a
 * change of state, which is why the transport is in here. */
export function toAction(context: IncomingContext): GameAction | undefined {
  const { message } = context;
  switch (message.type) {
    case 'Join':
      return joinAction(context);
    case 'SetLook':
      return { type: 'SET_LOOK', playerId: message.playerId, look: message.look };
    case 'ChooseTheme':
      // Stamped as it lands rather than when it is applied: the countdown stops at the press, and
      // a message held in a queue would otherwise stop the clock later than the room pressed.
      return {
        type: 'CHOOSE_THEME',
        playerId: message.playerId,
        theme: message.theme,
        at: Date.now(),
      };
    case 'SubmitAnswer':
      return { type: 'SUBMIT_ANSWER', playerId: message.playerId, text: message.text };
    case 'RejectGroup':
      return { type: 'REJECT_GROUP', playerId: message.playerId, groupId: message.groupId };
    default:
      return undefined;
  }
}

/** The look already recorded for a returning player. Undefined for a player with no record yet,
 * which sends them on with the look they arrived with. The record is on the roster, so a player
 * four rounds in keeps the drawn character. */
function knownLook(state: HostState, playerId: string) {
  return state.players.get(playerId)?.look;
}
