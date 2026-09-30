import { Transport } from './Transport';
import { describeMessage, RelayUrls, toPayload } from './Payload';
import { startDiagnostics } from './Diagnostics';
import {
  wireRoom,
  HelloAction,
  HostRole,
  PlayerRole,
  HostToClientAction,
  ClientToHostAction,
  type RoomHandlers,
} from './TrysteroRoom';
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
  private onMessageCallback: ((message: unknown, fromHost: boolean, peerId: string) => void) | null =
    null;
  private onPeerLeaveCallback: ((playerId: string) => void) | null = null;
  private onHostReadyCallback: (() => void) | null = null;

  // Access to the host peerId discovered by the room wiring
  private hostPeer: { get: () => string | null; clear: () => void } | null = null;
  /** Stops the periodic connection logging. */
  private stopDiagnostics: (() => void) | null = null;
  /** Ensures the unrouteable-send warning is only written once. */
  private warnedNoHost = false;

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
    log(
      'info',
      `joining room "${this.roomId}" as ${isHost ? HostRole : PlayerRole}, selfId ${this.peerId}`,
    );

    // Both directions are created on every peer, because a trystero action is a
    // topic: a peer only receives messages on a channel it has created itself.
    // Creating just the sending direction leaves the far end unsubscribed, so
    // its messages are dropped without a trace.
    this.hostToClientAction = room.makeAction(HostToClientAction);
    this.clientToHostAction = room.makeAction(ClientToHostAction);

    this.hostPeer = wireRoom(
      room,
      {
        hostToClient: this.hostToClientAction,
        clientToHost: this.clientToHostAction,
        hello: room.makeAction(HelloAction),
      },
      isHost,
      this.roomHandlers(),
    );
    this.stopDiagnostics = startDiagnostics(() => room.getPeers());
  }

  /** Adapters from the mutable callback fields to the room's handler shape. */
  private roomHandlers(): RoomHandlers {
    return {
      onMessage: (message, fromHost, peerId) => this.onMessageCallback?.(message, fromHost, peerId),
      onPeerLeave: (peerId) => this.onPeerLeaveCallback?.(peerId),
      onHostReady: () => this.onHostReadyCallback?.(),
    };
  }

  /** Clear every callback and handle, so a stopped transport holds nothing. */
  private releaseCallbacks(): void {
    this.onMessageCallback = null;
    this.onPeerLeaveCallback = null;
    this.onHostReadyCallback = null;
    this.playerId = null;
    this.warnedNoHost = false;
    this.hostPeer?.clear();
    this.hostPeer = null;
  }

  stop(): void {
    void this.room?.leave();
    this.room = null;
    this.stopDiagnostics?.();
    this.stopDiagnostics = null;
    this.hostToClientAction = null;
    this.clientToHostAction = null;
    this.releaseCallbacks();
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
    if (this.isHost || !this.clientToHostAction) {
      log('warn', 'sendToHost called on the host or before joining, ignoring');
      return;
    }
    if (!this.hostPeerId) {
      // The host has not identified itself yet. This repeats on every retry, so
      // it is reported once rather than drowning the rest of the log.
      if (!this.warnedNoHost) {
        this.warnedNoHost = true;
        log('warn', 'no peer connection to the host yet, dropping', describeMessage(message));
      }
      return;
    }
    const payload = this.prepare(message, 'sendToHost');
    if (payload === undefined) return;
    log('debug', 'sending to host', describeMessage(message));
    this.clientToHostAction.send(payload, { target: this.hostPeerId });
  }

  /**
   * Reply to a peer using its transport-level address.
   *
   * The host must answer a `Join` to the peer id the message actually arrived
   * from. A game player id is not usable here: the client invents its own
   * temporary id before it has one, and the host is addressed as `host` in
   * game state but by its trystero selfId on the wire.
   */
  sendToPeer(peerId: string, message: unknown): void {
    if (!this.isHost || !this.hostToClientAction) {
      log('warn', 'sendToPeer called on a client, ignoring');
      return;
    }
    const payload = this.prepare(message, 'sendToPeer');
    if (payload === undefined) return;
    log('debug', 'sending', describeMessage(message), 'to peer', peerId);
    this.hostToClientAction.send(payload, { target: peerId });
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

  onMessage(callback: (message: unknown, fromHost: boolean, peerId: string) => void): void {
    this.onMessageCallback = callback;
  }

  onPeerLeave(callback: (playerId: string) => void): void {
    this.onPeerLeaveCallback = callback;
  }

  onHostReady(callback: () => void): void {
    this.onHostReadyCallback = callback;
  }
}