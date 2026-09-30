import { Transport } from './Transport';
import { describeMessage, RelayUrls, toPayload } from './Payload';
import { wireRoom, type RoomHandlers } from './TrysteroRoom';
import { createLogger } from '@/Core';
import { joinRoom, selfId, type JsonValue, type MessageAction } from 'trystero';

const log = createLogger('TrysteroTransport');

/**
 * Trystero transport implementation.
 */
export class TrysteroTransport implements Transport {
  private room: ReturnType<typeof joinRoom> | null = null;
  private appId: string = 'unorthodox-game'; // Unique app ID for this project
  private roomId: string = '';
  private isHost: boolean = false;
  private playerId: string | null = null; // The game-level id of this peer
  // The Trystero peerId is not the game playerId: the host is addressed as the
  // reserved `host` id in game state but on the wire as its trystero selfId.
  private peerId: string = selfId;

  // Actions for sending messages
  private hostToClientAction: MessageAction<JsonValue> | null = null;
  private clientToHostAction: MessageAction<JsonValue> | null = null;

  // Callbacks for incoming messages and peer leave
  private onMessageCallback: ((message: unknown, fromHost: boolean) => void) | null = null;
  private onPeerLeaveCallback: ((playerId: string) => void) | null = null;

  // Access to the host peerId discovered by the room wiring
  private hostPeer: { get: () => string | null; clear: () => void } | null = null;
  /** Cancels the pending host-lookup retries when the session stops. */
  private disposeRoom: (() => void) | null = null;

  /** The host's trystero peerId, known to clients once it has announced itself. */
  private get hostPeerId(): string | null {
    return this.hostPeer?.get() ?? null;
  }

  start(roomCode: string, _playerName: string, isHost: boolean): void {
    this.roomId = roomCode;
    this.isHost = isHost;

    // Create or join the room. The library's default relays are frequently
    // unreachable, so several well-known nostr relays are configured instead.
    const room = joinRoom(
      {
        appId: this.appId,
        relayConfig: { urls: RelayUrls, redundancy: 3, warnOnRelayFailure: false },
      },
      this.roomId,
    );
    this.room = room;
    log('info', `joining room ${this.roomId} as ${isHost ? 'host' : 'client'} via relays`);

    // Only the direction this peer sends on is created, so a client never
    // listens for its own broadcasts and vice versa.
    const send = room.makeAction(isHost ? 'hostToClient' : 'clientToHost');
    if (isHost) {
      this.hostToClientAction = send;
    } else {
      this.clientToHostAction = send;
    }

    const wired = wireRoom(
      room,
      { hostToClient: this.hostToClientAction, clientToHost: send },
      isHost,
      this.peerId,
      this.roomHandlers(),
    );
    this.hostPeer = wired.hostPeer;
    this.disposeRoom = wired.dispose;
  }

  /** Adapters from the mutable callback fields to the room's handler shape. */
  private roomHandlers(): RoomHandlers {
    return {
      onMessage: (message, fromHost) => this.onMessageCallback?.(message, fromHost),
      onPeerLeave: (peerId) => this.onPeerLeaveCallback?.(peerId),
    };
  }

  stop(): void {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    this.disposeRoom?.();
    this.disposeRoom = null;
    this.hostToClientAction = null;
    this.clientToHostAction = null;
    this.onMessageCallback = null;
    this.onPeerLeaveCallback = null;
    this.playerId = null;
    this.hostPeer?.clear();
    this.hostPeer = null;
  }

  setPlayerId(playerId: string): void {
    this.playerId = playerId;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  /** Convert a message for the wire, logging why it cannot be sent. */
  private prepare(message: unknown, context: string): JsonValue | undefined {
    const payload = toPayload(message);
    if (payload === undefined) {
      log('warn', `${context}: unserialisable payload, dropping`, message);
    }
    return payload;
  }

  sendToHost(message: unknown): void {
    // Only clients should call this
    if (this.isHost) {
      log('warn', 'sendToHost called on the host, ignoring');
      return;
    }
    if (!this.clientToHostAction) {
      log('warn', 'sendToHost before the room was joined, ignoring');
      return;
    }
    if (!this.hostPeerId) {
      // The host has not introduced itself yet, so the message cannot be routed.
      log('warn', 'sendToHost before the host peerId is known, dropping', describeMessage(message));
      return;
    }
    const payload = this.prepare(message, 'sendToHost');
    if (payload === undefined) return;
    // Send the message to the host using the clientToHost action, targeting the host's peerId
    log('debug', 'sending to host', describeMessage(message));
    this.clientToHostAction.send(payload, { target: this.hostPeerId });
  }

  sendToPlayer(playerId: string, message: unknown): void {
    // Only the host should call this
    if (!this.isHost || !this.hostToClientAction) {
      log('warn', 'sendToPlayer called on a client, ignoring');
      return;
    }
    const payload = this.prepare(message, 'sendToPlayer');
    if (payload === undefined) return;
    // Send the message to the specific player using the hostToClient action
    log('debug', 'sending', describeMessage(message), 'to player', playerId);
    this.hostToClientAction.send(payload, { target: playerId });
  }

  broadcast(message: unknown): void {
    // Only the host should call this
    if (!this.isHost || !this.hostToClientAction) {
      log('warn', 'broadcast called on a client, ignoring');
      return;
    }
    const payload = this.prepare(message, 'broadcast');
    if (payload === undefined) return;
    // Send the message to all peers (hostToClient action without target sends to all)
    log('debug', 'broadcasting', describeMessage(message));
    this.hostToClientAction.send(payload);
  }

  onMessage(callback: (message: unknown, fromHost: boolean) => void): void {
    this.onMessageCallback = callback;
  }

  onPeerLeave(callback: (playerId: string) => void): void {
    this.onPeerLeaveCallback = callback;
  }
}