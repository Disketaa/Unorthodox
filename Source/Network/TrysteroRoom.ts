import { readRole, readTag } from './Payload';
import { roomConfig } from './Signaling';
import { createLogger } from '@/Core';
import { joinRoom, type JsonValue, type MessageAction } from 'trystero';

const log = createLogger('TrysteroRoom');

/** Namespace for the room opened only to dial the relays. No game room uses this name, so no
 * player can ever appear in it. */
const RelayWarmupRoom = '_relay-warmup';

/** The action every peer announces its role on once a connection exists. */
export const HelloAction = 'hello';

/** Protocol channels, both created by every peer so each end is subscribed. */
export const HostToClientAction = 'hostToClient';
export const ClientToHostAction = 'clientToHost';

export const HostRole = 'Host';
export const PlayerRole = 'Player';

export interface RoomHandlers {
  /** A protocol message arrived, tagged with the direction it came from and the sender's
   * transport-level peer id. */
  onMessage: (message: JsonValue, fromHost: boolean, peerId: string) => void;
  /** A peer left; clients only receive this for the host. */
  onPeerLeave: (peerId: string) => void;
  /** The host peerId first became known, so anything held back for lack of a route can go out
   * immediately. */
  onHostReady: () => void;
}

export interface RoomActions {
  hostToClient: MessageAction<JsonValue> | null;
  clientToHost: MessageAction<JsonValue> | null;
  /** Carries role announcements in both directions. */
  hello: MessageAction<JsonValue>;
}

/** Tracks the host peerId once a client has heard the host identify itself. */
export interface HostPeerState {
  get: () => string | null;
  set: (peerId: string) => void;
  clear: () => void;
}

function createHostPeerState(onFirstKnown: () => void): HostPeerState {
  let hostPeerId: string | null = null;
  return {
    get: () => hostPeerId,
    clear: () => {
      hostPeerId = null;
    },
    set: (peerId: string) => {
      if (hostPeerId === null) {
        hostPeerId = peerId;
        onFirstKnown();
      }
    },
  };
}

/** Announce our own role to everyone in the room. Broadcast rather than sent to one peer:
 * `onPeerJoin` fires on both sides, so a broadcast from each reaches whoever arrived second.
 * Targeting only the joiner would deadlock when the host first. */
function announceRole(hello: MessageAction<JsonValue>, role: string): void {
  log('info', `announcing role ${role} to the room`);
  hello.send({ type: HelloAction, role });
}

/** Wire the hello action, learning the host's peerId from whoever claims the role. */
function wireHello(
  hello: MessageAction<JsonValue>,
  hostPeer: HostPeerState,
  isHost: boolean
): void {
  hello.onMessage = (message: JsonValue, context) => {
    const role = readRole(message);
    if (readTag(message) !== HelloAction || role === undefined) {
      return;
    }
    log('info', `peer ${context.peerId} announced role ${role}`);
    if (role === HostRole && !isHost) {
      log('info', 'host is now addressable', context.peerId);
      hostPeer.set(context.peerId);
    }
  };
}

/** Wire the directional protocol actions. Every peer creates both channels, but only listens to
 * the one carrying traffic in its own direction: the host reads what clients send, the client
 * reads what the host sends. Listening to both would feed a peer its own messages back. */
function wireActions(actions: RoomActions, handlers: RoomHandlers, isHost: boolean): void {
  const inbound = isHost ? actions.clientToHost : actions.hostToClient;
  if (!inbound) {
    return;
  }
  inbound.onMessage = (message: JsonValue, context) => {
    // Anything on the inbound channel came from the other side by construction.
    handlers.onMessage(message, !isHost, context.peerId);
  };
}

/** The peer lifecycle hooks the room uses, which trystero may hand over as null. */
export interface RoomPeers {
  onPeerJoin?: ((peerId: string) => void) | null;
  onPeerLeave?: ((peerId: string) => void) | null;
}

function wirePeers(
  room: RoomPeers,
  hello: MessageAction<JsonValue>,
  isHost: boolean,
  hostPeer: HostPeerState,
  handlers: RoomHandlers
): void {
  room.onPeerJoin = (peerId) => {
    log('info', 'peer joined the room:', peerId, 'as', isHost ? HostRole : PlayerRole);
    // The connection only just came up, so the role has to be repeated for the
    // new peer. The first announcement at join time reached nobody.
    announceRole(hello, isHost ? HostRole : PlayerRole);
  };

  room.onPeerLeave = (peerId) => {
    log('info', 'peer left the room:', peerId);
    if (isHost) {
      // The host only cares about clients leaving.
      handlers.onPeerLeave(peerId);
      return;
    }
    // A client only cares about the host leaving.
    if (peerId === hostPeer.get()) {
      hostPeer.clear();
      handlers.onPeerLeave(peerId);
    }
  };
}

/** The room opened at start-up purely to dial the relays, held for the session. */
let warmRoom: ReturnType<typeof joinRoom> | null = null;

/** Open the relay sockets before anyone asks to join a room. A phone takes about three seconds
 * to open them, while the burst announcing a peer to a room is over inside one and a third, so
 * joining first spends it on nothing. Passive keeps the room dormant: it never announces. */
export function warmRelays(): void {
  if (warmRoom !== null) {
    return;
  }
  warmRoom = joinRoom({ ...roomConfig('unorthodox-game'), passive: true }, RelayWarmupRoom);
}

/** Wire up peer lifecycle, role exchange and message delivery for a joined room. Both directions
 * of the protocol are created on every peer, since a trystero action is a topic and the far end
 * would otherwise drop what is sent. */
export function openRoom(options: {
  appId: string;
  roomCode: string;
  isHost: boolean;
  handlers: RoomHandlers;
}): OpenRoom {
  const room = joinRoom(roomConfig(options.appId), options.roomCode, {
    // The one signal of a peer that answered but would not connect. Nothing else reports it, and
    // a handshake failure looks identical to a peer that never arrived.
    onJoinError: ({ peerId, error }) => log('warn', `peer ${peerId} failed to connect:`, error),
  });
  const hostToClient = room.makeAction(HostToClientAction);
  const clientToHost = room.makeAction(ClientToHostAction);
  const hostPeer = wireRoom(
    room,
    { hostToClient, clientToHost, hello: room.makeAction(HelloAction) },
    options.isHost,
    options.handlers
  );
  return { room, hostToClient, clientToHost, hostPeer };
}

/** What a joined room hands back to the transport. */
export interface OpenRoom {
  room: ReturnType<typeof joinRoom>;
  hostToClient: MessageAction<JsonValue>;
  clientToHost: MessageAction<JsonValue>;
  hostPeer: HostPeerState;
}

/** Wire the wiring only, for tests that drive the room without a library room. */
export function wireRoom(
  room: RoomPeers,
  actions: RoomActions,
  isHost: boolean,
  handlers: RoomHandlers
): HostPeerState {
  const hostPeer = createHostPeerState(() => {
    log('info', 'host is now addressable, flushing anything held back');
    handlers.onHostReady();
  });
  wirePeers(room, actions.hello, isHost, hostPeer, handlers);
  wireActions(actions, handlers, isHost);
  wireHello(actions.hello, hostPeer, isHost);
  announceRole(actions.hello, isHost ? HostRole : PlayerRole);
  return hostPeer;
}
