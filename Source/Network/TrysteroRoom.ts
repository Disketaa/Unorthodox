import { describeMessage, readHostPeerId } from './Payload';
import { createLogger } from '@/Core';
import type { JsonValue, MessageAction } from 'trystero';

const log = createLogger('TrysteroRoom');

/** Callbacks the room wiring reports back through. */
export interface RoomHandlers {
  /** A protocol message arrived, tagged with the direction it came from. */
  onMessage: (message: JsonValue, fromHost: boolean) => void;
  /** A peer left; clients only receive this for the host. */
  onPeerLeave: (peerId: string) => void;
  /** The host peerId became known, so buffered messages can be flushed. */
  onHostReady: () => void;
}

/** The two message actions a room can hold, one per direction. */
export interface RoomActions {
  hostToClient: MessageAction<JsonValue> | null;
  clientToHost: MessageAction<JsonValue>;
}

/** Holds the host peerId a client has learned, and reports the first time it lands. */
interface HostPeerState {
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
      const wasUnknown = hostPeerId === null;
      hostPeerId = peerId;
      if (wasUnknown) {
        onFirstKnown();
      }
    },
  };
}

/** Wire the message actions, consuming the host's peerId announcement. */
function wireActions(
  actions: RoomActions,
  hostPeer: HostPeerState,
  handlers: RoomHandlers,
): void {
  if (actions.hostToClient) {
    actions.hostToClient.onMessage = (message: JsonValue) => {
      // Only the host sends on this action, so anything arriving is from the host.
      handlers.onMessage(message, true);
    };
  }

  actions.clientToHost.onMessage = (message: JsonValue) => {
    // The host announces its peerId on join; that is internal plumbing, not a
    // protocol message, so it is consumed here rather than propagated.
    const peerId = readHostPeerId(message);
    if (peerId !== undefined) {
      log('info', 'learned host peerId', peerId);
      hostPeer.set(peerId);
      return;
    }
    log('debug', 'client received', describeMessage(message), 'from host');
    handlers.onMessage(message, false);
  };
}

/** Wire peer join and leave for the room. */
function wirePeers(
  room: { onPeerJoin?: (peerId: string) => void; onPeerLeave?: (peerId: string) => void },
  actions: RoomActions,
  isHost: boolean,
  selfPeerId: string,
  hostPeer: HostPeerState,
  handlers: RoomHandlers,
): void {
  room.onPeerJoin = (peerId) => {
    log('info', 'peer joined the room:', peerId, 'as', isHost ? 'host' : 'client');
    if (isHost && actions.hostToClient) {
      actions.hostToClient.send({ type: 'HostPeerId', peerId: selfPeerId }, { target: peerId });
    }
  };

  room.onPeerLeave = (peerId) => {
    log('info', 'peer left the room:', peerId);
    if (isHost) {
      // The host only cares about clients leaving.
      handlers.onPeerLeave(peerId);
      return;
    }
    // A client only cares about the host leaving, and it learns the host's
    // peerId from the announcement above.
    if (peerId === hostPeer.get()) {
      hostPeer.clear();
      handlers.onPeerLeave(peerId);
    }
  };
}

/**
 * Wire up peer lifecycle and message delivery for a joined room.
 *
 * The host announces its trystero peerId to each client as it arrives, so a
 * client learns whom to address before it can send anything.
 */
export function wireRoom(
  room: { onPeerJoin?: (peerId: string) => void; onPeerLeave?: (peerId: string) => void },
  actions: RoomActions,
  isHost: boolean,
  selfPeerId: string,
  handlers: RoomHandlers,
): HostPeerState {
  const hostPeer = createHostPeerState(() => {
    log('info', 'host is now addressable, flushing buffered messages');
    handlers.onHostReady();
  });
  wirePeers(room, actions, isHost, selfPeerId, hostPeer, handlers);
  wireActions(actions, hostPeer, handlers);
  return hostPeer;
}
