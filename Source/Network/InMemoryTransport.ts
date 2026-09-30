import { Transport } from './Transport';

/** Counter behind the generated peer addresses, so tests get unique addresses. */
let nextPeerAddress = 0;

/**
 * In-memory transport for testing without network.
 * All peers share the same transport instance via a static broker.
 */
export class InMemoryTransport implements Transport {
  /** Static map of all peers by their transport-level address */
  private static peersByPeer = new Map<string, {
    transport: InMemoryTransport;
    isHost: boolean;
    receive: (message: unknown, fromHost: boolean, peerId: string) => void;
  }>();

  /** Drop every registered peer, so tests do not leak into one another. */
  static resetPeers(): void {
    InMemoryTransport.peersByPeer.clear();
  }

  /** This peer's transport-level address, assigned when it joins. */
  private peerAddress: string | null = null;
  /** The game player id, which the host assigns and is not routable. */
  private playerId: string | null = null;
  /** Whether this peer is the host, set in start() */
  private isHost: boolean = false;

  /** Callbacks for incoming messages and peer leave */
  private onMessageCallback: ((message: unknown, fromHost: boolean, peerId: string) => void) | null =
    null;
  private onPeerLeaveCallback: ((playerId: string) => void) | null = null;

  /** Callback for receiving messages from the broker */
  private receiveCallback: (message: unknown, fromHost: boolean, peerId: string) => void;

  constructor() {
    this.receiveCallback = (message, fromHost, peerId) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(message, fromHost, peerId);
      }
    };
  }

  start(_roomCode: string, _playerName: string, isHost: boolean): void {
    this.isHost = isHost;
    // The real transport learns its own peer id from the library, so this fake
    // mints one on join to stand in for it.
    this.peerAddress = `peer-${nextPeerAddress++}`;
    InMemoryTransport.peersByPeer.set(this.peerAddress, {
      transport: this,
      isHost,
      receive: this.receiveCallback,
    });
  }

  stop(): void {
    if (this.peerAddress !== null) {
      InMemoryTransport.peersByPeer.delete(this.peerAddress);
      this.peerAddress = null;
    }
    this.playerId = null;
    this.isHost = false;
    this.onMessageCallback = null;
    this.onPeerLeaveCallback = null;
  }

  setPlayerId(playerId: string): void {
    // The game player id is bookkeeping only; it is not a routable address.
    this.playerId = playerId;
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
    const hostEntry = Array.from(InMemoryTransport.peersByPeer.values()).find(
      entry => entry.isHost
    );
    if (hostEntry) {
      // Deliver the message to the host's receive callback (fromHost = false)
      hostEntry.receive(message, false, this.address());
      return;
    }
    // No host is reachable yet, so the message is dropped and the caller's
    // retry is expected to resend it once a host appears.
  }

  /** This peer's transport-level address, which is what a host replies to. */
  private address(): string {
    return this.peerAddress ?? '';
  }

  sendToPeer(peerId: string, message: unknown): void {
    // Only the host should call this
    if (!this.isHost) {
      return;
    }
    // Reply to whichever peer registered under this transport address.
    const entry = InMemoryTransport.peersByPeer.get(peerId);
    entry?.receive(message, true, peerId);
  }

  broadcast(message: unknown): void {
    // Only the host should call this
    if (!this.isHost) {
      return;
    }
    // Send to all clients (peers that are not host)
    for (const [, entry] of InMemoryTransport.peersByPeer) {
      if (!entry.isHost) {
        entry.receive(message, true, this.address());
      }
    }
  }

  onMessage(callback: (message: unknown, fromHost: boolean, peerId: string) => void): void {
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
      for (const [, entry] of InMemoryTransport.peersByPeer) {
        if (entry.transport.onPeerLeaveCallback) {
          entry.transport.onPeerLeaveCallback(playerId);
        }
      }
    }
  }
}