import { Transport } from './Transport';
import { describeMessage, preparePayload } from './Payload';
import { startDiagnostics } from './Diagnostics';
import { openRoom, warmRelays, HostRole, PlayerRole, type RoomHandlers } from './TrysteroRoom';
import { createLogger } from '@/Core';
import { joinRoom, selfId, type JsonValue, type MessageAction } from 'trystero';

const log = createLogger('TrysteroTransport');

export class TrysteroTransport implements Transport {
  private room: ReturnType<typeof joinRoom> | null = null;
  /** Namespaces every room this project opens; two apps sharing it would see each other. */
  private appId: string = 'unorthodox-game';
  private roomId: string = '';
  private isHost: boolean = false;
  /** The game-level id of this peer, assigned by the host on Join. */
  private playerId: string | null = null;
  /** Not the game playerId: the host is `host` in game state but its selfId on the wire. */
  private peerId: string = selfId;

  private hostToClientAction: MessageAction<JsonValue> | null = null;
  private clientToHostAction: MessageAction<JsonValue> | null = null;

  private onMessageCallback: ((message: unknown, fromHost: boolean, peerId: string) => void) | null =
    null;
  private onPeerLeaveCallback: ((playerId: string) => void) | null = null;
  private onHostReadyCallback: (() => void) | null = null;

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
    warmRelays();
    this.roomId = roomCode;
    this.isHost = isHost;
    const opened = openRoom({
      appId: this.appId,
      roomCode: this.roomId,
      isHost,
      handlers: this.roomHandlers(),
    });
    this.room = opened.room;
    this.hostToClientAction = opened.hostToClient;
    this.clientToHostAction = opened.clientToHost;
    this.hostPeer = opened.hostPeer;
    log(
      'info',
      `joined room "${this.roomId}" as ${isHost ? HostRole : PlayerRole}, selfId ${this.peerId}`,
    );
    this.stopDiagnostics = startDiagnostics(() => opened.room.getPeers());
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

  private prepare(message: unknown): JsonValue | undefined {
    return preparePayload(message, 'send', (reason, dropped) => log('warn', reason, dropped));
  }

  sendToHost(message: unknown): void {
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
    const payload = this.prepare(message);
    if (payload === undefined) return;
    log('debug', 'sending to host', describeMessage(message));
    this.clientToHostAction.send(payload, { target: this.hostPeerId });
  }

  /** Reply to a peer using its transport-level address, which is never the game player id: that
   * one is assigned by the host and stays off the wire. */
  sendToPeer(peerId: string, message: unknown): void {
    if (!this.isHost || !this.hostToClientAction) {
      log('warn', 'sendToPeer called on a client, ignoring');
      return;
    }
    const payload = this.prepare(message);
    if (payload === undefined) return;
    log('debug', 'sending', describeMessage(message), 'to peer', peerId);
    this.hostToClientAction.send(payload, { target: peerId });
  }

  broadcast(message: unknown): void {
    // A broadcast before the room exists has nowhere to go, which happens when
    // the host seeds its own lobby entry. Expected, not a fault.
    if (this.room === null) return log('debug', 'broadcast before the room was opened, skipping');
    if (!this.isHost || !this.hostToClientAction) {
      log('warn', 'broadcast called on a client, ignoring');
      return;
    }
    const payload = this.prepare(message);
    if (payload === undefined) return;
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

  /** Whether the host has announced itself over an open peer connection. Until the hello
   * handshake completes there is no address to send to, so this is the only honest answer to
   * "has my join gone out yet". */
  isHostAddressable(): boolean {
    return !this.isHost && this.hostPeerId !== null;
  }
}
