import { Transport } from './Transport';
import { joinRoom, type JsonValue, type MessageAction } from 'trystero';

/**
 * Trystero can only carry structured-clone/JSON payloads. Protocol messages are
 * plain JSON objects, so anything else is rejected rather than sent blindly.
 */
function toPayload(message: unknown): JsonValue | undefined {
  if (typeof message === 'string' || typeof message === 'number' || typeof message === 'boolean') {
    return message;
  }
  if (message === null || Array.isArray(message) || typeof message === 'object') {
    return { ...message };
  }
  return undefined;
}

/**
 * Read the host's peerId out of the internal `HostPeerId` announcement.
 * Returns undefined for any other message.
 */
function readHostPeerId(message: JsonValue): string | undefined {
  if (typeof message !== 'object' || message === null || Array.isArray(message)) {
    return undefined;
  }
  const record: Record<string, unknown> = { ...message };
  if (record.type !== 'HostPeerId') {
    return undefined;
  }
  return typeof record.peerId === 'string' ? record.peerId : undefined;
}

/**
 * Trystero transport implementation.
 */
export class TrysteroTransport implements Transport {
  private room: ReturnType<typeof joinRoom> | null = null;
  private appId: string = 'unorthodox-game'; // Unique app ID for this project
  private roomId: string = '';
  private isHost: boolean = false;
  private playerId: string | null = null; // This will be set to the Trystero peerId

  // Actions for sending messages
  private hostToClientAction: MessageAction<JsonValue> | null = null;
  private clientToHostAction: MessageAction<JsonValue> | null = null;

  // Callbacks for incoming messages and peer leave
  private onMessageCallback: ((message: unknown, fromHost: boolean) => void) | null = null;
  private onPeerLeaveCallback: ((playerId: string) => void) | null = null;

  // Store the host's peerId (known to clients)
  private hostPeerId: string | null = null;

  start(roomCode: string, _playerName: string, isHost: boolean): void {
    this.roomId = roomCode;
    this.isHost = isHost;

    // Create or join the room
    const room = joinRoom({ appId: this.appId }, this.roomId);
    this.room = room;

    // Set up room event listeners
    this.setupRoomListeners(room);

    // Create actions based on whether we are host or client
    if (this.isHost) {
      this.hostToClientAction = room.makeAction('hostToClient');
      this.setupHostToClientAction();
    } else {
      this.clientToHostAction = room.makeAction('clientToHost');
      this.setupClientToHostAction();
    }

    // If we are the host, we need to announce our peerId to any clients that join later
    // We'll do that in the onPeerJoin listener
  }

  private setupRoomListeners(room: ReturnType<typeof joinRoom>): void {
    // Listen for peers joining
    room.onPeerJoin = (peerId) => {
      // If we are the host, send our peerId to the new peer
      if (this.isHost && this.playerId) {
        this.hostToClientAction?.send({ type: 'HostPeerId', peerId: this.playerId }, { target: peerId });
      }
    };

    // Listen for peers leaving
    room.onPeerLeave = (peerId) => {
      // If the leaving peer is the host, clear the hostPeerId
      if (peerId === this.hostPeerId) {
        this.hostPeerId = null;
      }
      // Notify the onPeerLeave callback
      if (this.onPeerLeaveCallback && this.playerId) {
        this.onPeerLeaveCallback(peerId);
      }
    };
  }

  private setupHostToClientAction(): void {
    if (!this.hostToClientAction) return;
    this.hostToClientAction.onMessage = (message: JsonValue) => {
      // Only the host sends on this action, so anything arriving is from the host.
      if (this.onMessageCallback) {
        this.onMessageCallback(message, true);
      }
    };
  }

  private setupClientToHostAction(): void {
    if (!this.clientToHostAction) return;
    this.clientToHostAction.onMessage = (message: JsonValue) => {
      // The host announces its peerId on join; that is internal plumbing, not a
      // protocol message, so it is consumed here rather than propagated.
      const peerId = readHostPeerId(message);
      if (peerId !== undefined) {
        this.hostPeerId = peerId;
        return;
      }
      if (this.onMessageCallback) {
        this.onMessageCallback(message, false);
      }
    };
  }

  stop(): void {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    this.hostToClientAction = null;
    this.clientToHostAction = null;
    this.onMessageCallback = null;
    this.onPeerLeaveCallback = null;
    this.playerId = null;
    this.hostPeerId = null;
  }

  setPlayerId(playerId: string): void {
    this.playerId = playerId;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  sendToHost(message: unknown): void {
    // Only clients should call this
    if (this.isHost || !this.clientToHostAction || !this.hostPeerId) {
      return;
    }
    const payload = toPayload(message);
    if (payload === undefined) {
      return;
    }
    // Send the message to the host using the clientToHost action, targeting the host's peerId
    this.clientToHostAction.send(payload, { target: this.hostPeerId });
  }

  sendToPlayer(playerId: string, message: unknown): void {
    // Only the host should call this
    if (!this.isHost || !this.hostToClientAction) {
      return;
    }
    const payload = toPayload(message);
    if (payload === undefined) {
      return;
    }
    // Send the message to the specific player using the hostToClient action
    this.hostToClientAction.send(payload, { target: playerId });
  }

  broadcast(message: unknown): void {
    // Only the host should call this
    if (!this.isHost || !this.hostToClientAction) {
      return;
    }
    const payload = toPayload(message);
    if (payload === undefined) {
      return;
    }
    // Send the message to all peers (hostToClient action without target sends to all)
    this.hostToClientAction.send(payload);
  }

  onMessage(callback: (message: unknown, fromHost: boolean) => void): void {
    this.onMessageCallback = callback;
  }

  onPeerLeave(callback: (playerId: string) => void): void {
    this.onPeerLeaveCallback = callback;
  }
}