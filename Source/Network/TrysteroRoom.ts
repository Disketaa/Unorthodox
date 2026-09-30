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
}

/** The two message actions a room can hold, one per direction. */
export interface RoomActions {
  hostToClient: MessageAction<JsonValue> | null;
  clientToHost: MessageAction<JsonValue>;
}

/** The message a client broadcasts when it does not yet know the host's peerId. */
export const RequestHostPeerId = 'RequestHostPeerId';

/** The message the host answers with, naming the peerId to address. */
export const HostPeerIdMessage = 'HostPeerId';

/** How long a client keeps asking for the host before giving up. */
const HostRequestTimeoutMs = 20_000;
const HostRequestIntervalMs = 2_000;

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
  isHost: boolean,
  selfPeerId: string,
): void {
  if (actions.hostToClient) {
    actions.hostToClient.onMessage = (message: JsonValue) => {
      // Only the host sends on this action, so anything arriving is from the host.
      handlers.onMessage(message, true);
    };
  }

  actions.clientToHost.onMessage = (message: JsonValue) => {
    // The host names its peerId on join; that is internal plumbing, not a
    // protocol message, so it is consumed here rather than propagated.
    const hostId = readHostPeerId(message);
    if (hostId !== undefined) {
      log('info', 'learned host peerId', hostId);
      hostPeer.set(hostId);
      return;
    }
    if (isRequestForHostPeerId(message)) {
      log('debug', 'a client is asking who the host is');
      // Answer every listener, not just the asker, so clients that raced the
      // handshake do not each have to ask again.
      actions.hostToClient?.send({ type: HostPeerIdMessage, peerId: selfPeerId });
      return;
    }
    log('debug', 'client received', describeMessage(message), 'from host');
    handlers.onMessage(message, false);
  };
}

function isRequestForHostPeerId(message: JsonValue): boolean {
  if (typeof message !== 'object' || message === null || Array.isArray(message)) {
    return false;
  }
  return Reflect.get(message, 'type') === RequestHostPeerId;
}

/**
 * Ask the host who it is, repeatedly, until it answers.
 *
 * A client that arrives after the host never sees a peer-join event, so the
 * host has no reason to announce itself first. Broadcasting the question makes
 * the handshake work in both arrival orders.
 */
function requestHostPeerId(
  actions: RoomActions,
  hostPeer: HostPeerState,
  isHost: boolean,
): () => void {
  if (isHost || hostPeer.get() !== null) {
    return () => undefined;
  }
  const ask = () => {
    if (hostPeer.get() !== null) {
      return;
    }
    log('debug', 'asking the room who the host is');
    actions.clientToHost.send({ type: RequestHostPeerId });
  };
  // The first ask can land before the host has connected, so it repeats.
  const timer = setInterval(ask, HostRequestIntervalMs);
  setTimeout(() => clearInterval(timer), HostRequestTimeoutMs);
  return () => clearInterval(timer);
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
 * A client that arrives after the host never sees a peer-join event, so it asks
 * the room who the host is and retries until it gets an answer. That makes the
 * handshake work regardless of which side joined first.
 */
export function wireRoom(
  room: { onPeerJoin?: (peerId: string) => void; onPeerLeave?: (peerId: string) => void },
  actions: RoomActions,
  isHost: boolean,
  selfPeerId: string,
  handlers: RoomHandlers,
): { hostPeer: HostPeerState; dispose: () => void } {
  const hostPeer = createHostPeerState(() => {
    log('info', 'host is now addressable');
  });
  wirePeers(room, actions, isHost, selfPeerId, hostPeer, handlers);
  wireActions(actions, hostPeer, handlers, isHost, selfPeerId);
  const stopAsking = requestHostPeerId(actions, hostPeer, isHost);
  return { hostPeer, dispose: stopAsking };
}
