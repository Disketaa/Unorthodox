import { readRole, readTag } from './Payload';
import { createLogger } from '@/Core';
import type { JsonValue, MessageAction } from 'trystero';

const log = createLogger('TrysteroRoom');

/** The action every peer announces its role on once a connection exists. */
export const HelloAction = 'hello';

/** Role names exchanged in the hello message. */
export const HostRole = 'Host';
export const PlayerRole = 'Player';

/** Callbacks the room wiring reports back through. */
export interface RoomHandlers {
  /**
   * A protocol message arrived, tagged with the direction it came from and the
   * sender's transport-level peer id.
   */
  onMessage: (message: JsonValue, fromHost: boolean, peerId: string) => void;
  /** A peer left; clients only receive this for the host. */
  onPeerLeave: (peerId: string) => void;
  /**
   * The host peerId first became known, so anything held back for lack of a
   * route can go out immediately.
   */
  onHostReady: () => void;
}

/** The two message actions a room can hold, one per direction. */
export interface RoomActions {
  hostToClient: MessageAction<JsonValue> | null;
  clientToHost: MessageAction<JsonValue>;
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

/**
 * Announce our own role to everyone in the room.
 *
 * This is broadcast rather than sent to a single peer on purpose: `onPeerJoin`
 * fires on both sides of a new connection, so a broadcast from each side
 * guarantees that whoever arrived second learns who the host is. Targeting only
 * the joining peer would still deadlock when the host joined first, because the
 * host never sees a join event for a client that is already present.
 */
function announceRole(
  hello: MessageAction<JsonValue>,
  role: string,
): void {
  log('info', `announcing role ${role} to the room`);
  hello.send({ type: HelloAction, role });
}

/** Wire the hello action, learning the host's peerId from whoever claims the role. */
function wireHello(hello: MessageAction<JsonValue>, hostPeer: HostPeerState, isHost: boolean): void {
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

/** Wire the directional protocol actions. */
function wireActions(actions: RoomActions, handlers: RoomHandlers, isHost: boolean): void {
  if (actions.hostToClient) {
    actions.hostToClient.onMessage = (message: JsonValue, context) => {
      // Only the host sends on this action, so anything arriving is from the host.
      handlers.onMessage(message, true, context.peerId);
    };
  }
  if (isHost) {
    return;
  }
  actions.clientToHost.onMessage = (message: JsonValue, context) => {
    handlers.onMessage(message, false, context.peerId);
  };
}

/** The peer lifecycle hooks the room uses, which trystero may hand over as null. */
export interface RoomPeers {
  onPeerJoin?: ((peerId: string) => void) | null;
  onPeerLeave?: ((peerId: string) => void) | null;
}

/** Wire peer join and leave for the room. */
function wirePeers(
  room: RoomPeers,
  hello: MessageAction<JsonValue>,
  isHost: boolean,
  hostPeer: HostPeerState,
  handlers: RoomHandlers,
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

/**
 * Wire up peer lifecycle, role exchange and message delivery for a joined room.
 *
 * Every peer announces its role to the whole room on every peer join, so the
 * handshake does not depend on which side arrived first.
 */
export function wireRoom(
  room: RoomPeers,
  actions: RoomActions,
  isHost: boolean,
  handlers: RoomHandlers,
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
