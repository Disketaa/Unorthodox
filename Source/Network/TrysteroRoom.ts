import { joinRoom } from 'trystero';
import { roomConfig } from './Signaling';
import { ensureClockCorrected } from './Clock';
import { createLogger } from '@/Core';
import {
  wireRoom,
  HelloAction,
  HostToClientAction,
  ClientToHostAction,
  type RoomHandlers,
  type OpenRoom,
} from './TrysteroRoomInternal';

const log = createLogger('TrysteroRoom');

const RelayWarmupRoom = '_relay-warmup';

let warmRoom: ReturnType<typeof joinRoom> | null = null;

export function resetWarmRelays(): void {
  warmRoom = null;
}

export function warmRelays(): void {
  if (warmRoom !== null) return;
  ensureClockCorrected();
  warmRoom = joinRoom({ ...roomConfig('unorthodox-game'), passive: true }, RelayWarmupRoom);
}

export function openRoom(options: {
  appId: string;
  roomCode: string;
  isHost: boolean;
  handlers: RoomHandlers;
}): OpenRoom {
  const room = joinRoom(roomConfig(options.appId), options.roomCode, {
    onJoinError: ({ peerId, error }) => log('warn', `peer ${peerId} failed:`, error),
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

export {
  HelloAction,
  HostToClientAction,
  ClientToHostAction,
  HostRole,
  PlayerRole,
} from './TrysteroRoomInternal';
export {
  wireRoom,
  createHostPeerState,
  announceRole,
  wireHello,
  wireActions,
  wirePeers,
} from './TrysteroRoomInternal';
export type {
  RoomHandlers,
  RoomActions,
  HostPeerState,
  RoomPeers,
  OpenRoom,
} from './TrysteroRoomInternal';
