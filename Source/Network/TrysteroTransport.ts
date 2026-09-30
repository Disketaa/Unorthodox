import { Transport } from './Transport';
import { readHostPeerId, toPayload } from './Payload';
import { joinRoom, selfId, type JsonValue, type MessageAction } from 'trystero';

/** Signaling relays used for matchmaking, tried in order until one connects. */
const RelayUrls = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://nostr.wine',
  'wss://relay.nostr.band',
  'wss://nostr.mom',
];

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
  private onHostReadyCallback: (() => void) | null = null;

  // Store the host's peerId (known to clients)
  private hostPeerId: string | null = null;

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
      // If we are the host, send our trystero peerId to the new peer, so the
      // client knows whom to address on the wire.
      if (this.isHost) {
        this.hostToClientAction?.send({ type: 'HostPeerId', peerId: this.peerId }, { target: peerId });
      }
    };

    // Listen for peers leaving
    room.onPeerLeave = (peerId) => {
      if (this.isHost) {
        // The host only cares about clients leaving.
        this.onPeerLeaveCallback?.(peerId);
        return;
      }
      // A client only cares about the host leaving, and it learns the host's
      // peerId from the announcement above.
      if (peerId === this.hostPeerId) {
        this.hostPeerId = null;
        this.onPeerLeaveCallback?.(peerId);
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
        const wasUnknown = this.hostPeerId === null;
        this.hostPeerId = peerId;
        if (wasUnknown) {
          this.onHostReadyCallback?.();
        }
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
    this.onHostReadyCallback = null;
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

  onHostReady(callback: () => void): void {
    this.onHostReadyCallback = callback;
  }
}