import { readRole, readTag } from './Payload';
import { createLogger } from '@/Core';
import { joinRoom, type JsonValue, type MessageAction } from 'trystero';

const log = createLogger('TrysteroRoom');

export const HelloAction = 'hello';
export const HostToClientAction = 'hostToClient';
export const ClientToHostAction = 'clientToHost';
export const HostRole = 'Host';
export const PlayerRole = 'Player';

export interface RoomHandlers {
  onMessage: (message: JsonValue, fromHost: boolean, peerId: string) => void;
  onPeerLeave: (peerId: string) => void;
  onHostReady: () => void;
}

export interface RoomActions {
  hostToClient: MessageAction<JsonValue> | null;
  clientToHost: MessageAction<JsonValue> | null;
  hello: MessageAction<JsonValue>;
}

export interface HostPeerState {
  get: () => string | null;
  set: (peerId: string) => void;
  clear: () => void;
}

export interface RoomPeers {
  onPeerJoin?: ((peerId: string) => void) | null;
  onPeerLeave?: ((peerId: string) => void) | null;
}

export interface OpenRoom {
  room: ReturnType<typeof joinRoom>;
  hostToClient: MessageAction<JsonValue>;
  clientToHost: MessageAction<JsonValue>;
  hostPeer: HostPeerState;
}

export function createHostPeerState(onFirstKnown: () => void): HostPeerState {
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

export function announceRole(hello: MessageAction<JsonValue>, role: string): void {
  log('info', `announcing role ${role} to the room`);
  hello.send({ type: HelloAction, role });
}

export function wireHello(
  hello: MessageAction<JsonValue>,
  hostPeer: HostPeerState,
  isHost: boolean
): void {
  hello.onMessage = (message: JsonValue, context) => {
    const role = readRole(message);
    if (readTag(message) !== HelloAction || role === undefined) return;
    log('info', `peer ${context.peerId} announced role ${role}`);
    if (role === HostRole && !isHost) {
      log('info', 'host is now addressable', context.peerId);
      hostPeer.set(context.peerId);
    }
  };
}

export function wireActions(
  actions: RoomActions,
  handlers: RoomHandlers,
  isHost: boolean
): void {
  const inbound = isHost ? actions.clientToHost : actions.hostToClient;
  if (!inbound) return;
  inbound.onMessage = (message: JsonValue, context) => {
    handlers.onMessage(message, !isHost, context.peerId);
  };
}

export function wirePeers(
  room: RoomPeers,
  hello: MessageAction<JsonValue>,
  isHost: boolean,
  hostPeer: HostPeerState,
  handlers: RoomHandlers
): void {
  room.onPeerJoin = (peerId) => {
    log('info', 'peer joined the room:', peerId, 'as', isHost ? HostRole : PlayerRole);
    announceRole(hello, isHost ? HostRole : PlayerRole);
  };
  room.onPeerLeave = (peerId) => {
    log('info', 'peer left the room:', peerId);
    if (isHost) {
      handlers.onPeerLeave(peerId);
      return;
    }
    if (peerId === hostPeer.get()) {
      hostPeer.clear();
      handlers.onPeerLeave(peerId);
    }
  };
}

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
