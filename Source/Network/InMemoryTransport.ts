import { Transport } from './Transport';

/**
 * In-memory transport for testing without network.
 * All peers share the same transport instance via a static broker.
 */
export class InMemoryTransport implements Transport {
  /** Static map of all peers by playerId */
  private static peersById = new Map<string, {
    transport: InMemoryTransport;
    isHost: boolean;
    receive: (message: unknown, fromHost: boolean) => void;
  }>();

  /** Player ID of this peer, set via setPlayerId() */
  private playerId: string | null = null;
  /** Whether this peer is the host, set in start() */
  private isHost: boolean = false;

  /** Callbacks for incoming messages and peer leave */
  private onMessageCallback: ((message: unknown, fromHost: boolean) => void) | null = null;
  private onPeerLeaveCallback: ((playerId: string) => void) | null = null;

  /** Callback for receiving messages from the broker */
  private receiveCallback: (message: unknown, fromHost: boolean) => void;

  constructor() {
    this.receiveCallback = (message, fromHost) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(message, fromHost);
      }
    };
  }

  start(_roomCode: string, _playerName: string, isHost: boolean): void {
    this.isHost = isHost;
    // We don't generate a playerId here; it will be set later via setPlayerId
  }

  stop(): void {
    if (this.playerId) {
      InMemoryTransport.peersById.delete(this.playerId);
      this.playerId = null;
    }
    this.isHost = false;
    this.onMessageCallback = null;
    this.onPeerLeaveCallback = null;
  }

  setPlayerId(playerId: string): void {
    // If we already had a playerId, remove the old entry
    if (this.playerId) {
      InMemoryTransport.peersById.delete(this.playerId);
    }
    this.playerId = playerId;
    // Register this peer in the static broker
    InMemoryTransport.peersById.set(this.playerId, {
      transport: this,
      isHost: this.isHost,
      receive: this.receiveCallback
    });
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  sendToHost(message: unknown): void {
    // Only clients should call this
    if (this.isHost) {
      return;
    }
    // Find the host peer
    const peers = Array.from(InMemoryTransport.peersById.values());
    const hostEntry = peers.find(
      entry => entry.isHost
    );
    if (hostEntry) {
      // Deliver the message to the host's receive callback (fromHost = false)
      hostEntry.receive(message, false);
    }
  }

  sendToPlayer(playerId: string, message: unknown): void {
    // Only the host should call this
    if (!this.isHost) {
      return;
    }
    const targetEntry = InMemoryTransport.peersById.get(playerId);
    if (targetEntry) {
      // Deliver the message to the target peer's receive callback (fromHost = true)
      targetEntry.receive(message, true);
    }
  }

  broadcast(message: unknown): void {
    // Only the host should call this
    if (!this.isHost) {
      return;
    }
    // Send to all clients (peers that are not host)
    for (const [, entry] of InMemoryTransport.peersById) {
      if (!entry.isHost) {
        entry.receive(message, true);
      }
    }
  }

  onMessage(callback: (message: unknown, fromHost: boolean) => void): void {
    this.onMessageCallback = callback;
  }

  onPeerLeave(callback: (playerId: string) => void): void {
    this.onPeerLeaveCallback = callback;
  }

  /**
   * Call this to simulate a peer leaving.
   * This should be called by the test when they want to disconnect a peer.
   */
  simulateLeave(): void {
    const playerId = this.playerId;
    if (playerId !== null) {
      this.stop();
      // Notify all other peers about this peer leaving
      for (const [, entry] of InMemoryTransport.peersById) {
        if (entry.transport.onPeerLeaveCallback) {
          entry.transport.onPeerLeaveCallback(playerId);
        }
      }
    }
  }
}