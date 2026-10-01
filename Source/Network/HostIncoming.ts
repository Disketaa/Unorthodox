import { ClientMessage } from './Protocol';
import { Transport } from './Transport';
import { HostRoster, resolveLook } from './HostRoster';
import { GameAction, HostState } from '@/Game';
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

/**
 * The game action a client message asks for, or undefined if it asks for none.
 *
 * A join is the only message that can be refused, and refusing it is a message of
 * its own rather than a change of state, which is why the transport is in here: the
 * rest of the switch is a pure translation from wire to reducer.
 */
export function toAction(context: IncomingContext): GameAction | undefined {
  const { message, peerId, roster, transport } = context;
  switch (message.type) {
    case 'Join': {
      if (roster.isNameActive(message.name, message.clientId)) {
        // Two players under one name would be the same person to the host in every
        // answer and every score, so the second one is turned away rather than
        // seated twice. A name already held by the same browser is not this case: that
        // is a player who refreshed, and they are the one who should be seated.
        log('info', 'refusing a join under a name already in play', message.name);
        transport.sendToPeer(peerId, { type: 'NameRejected' });
        return undefined;
      }
      // A player we already know is the same person coming back, so they keep
      // the seat and the character they had rather than a fresh roll.
      const playerId = roster.claimSeat(message.name, peerId, message.clientId);
      const look = resolveLook(knownLook(context.state, playerId), message.look);
      // Answer the peer the message came from: the game player id is assigned
      // here and never reaches the wire, so it is not routable.
      log('info', 'assigning playerId', playerId, 'to peer', peerId);
      transport.sendToPeer(peerId, { type: 'SetPlayerId', playerId });
      return { type: 'JOIN', playerId, name: message.name, look };
    }
    case 'SetLook':
      return { type: 'SET_LOOK', playerId: message.playerId, look: message.look };
    case 'SubmitAnswer':
      return { type: 'SUBMIT_ANSWER', playerId: message.playerId, text: message.text };
    case 'RejectGroup':
      return { type: 'REJECT_GROUP', playerId: message.playerId, groupId: message.groupId };
    default:
      return undefined;
  }
}

/**
 * The look already recorded for a returning player.
 *
 * Undefined outside the lobby, which is the only phase whose state carries a look,
 * and for a player with no record yet, which is what sends them on with the look
 * they arrived with.
 */
function knownLook(state: HostState, playerId: string) {
  return state.phase === 'Lobby' ? state.players.get(playerId)?.look : undefined;
}
