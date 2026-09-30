export interface Transport {
  /** Send a message to the host (only clients call this) */
  sendToHost(message: unknown): void;
  /**
   * Send a message to a peer by its transport-level address, which is the id
   * the transport knows the peer by on the wire, not the game player id.
   */
  sendToPeer(peerId: string, message: unknown): void;
  /** Send a message to all players (only host calls this) */
  broadcast(message: unknown): void;
  /**
   * Set callback for when a message is received. The peer id is the sender's
   * transport-level address, so a host can reply to exactly who sent it.
   */
  onMessage(callback: (message: unknown, fromHost: boolean, peerId: string) => void): void;
  /** Set callback for when a peer leaves */
  onPeerLeave(callback: (playerId: string) => void): void;
  /**
   * Set callback for when the host first becomes addressable, so a message
   * held back for lack of a route can be sent straight away rather than on the
   * next retry. Only clients receive this.
   */
  onHostReady(callback: () => void): void;
  /**
   * Whether the host can actually be addressed right now.
   *
   * A client cannot reach the host until it has answered, so asking this is how
   * a caller tells "sent" apart from "queued for later", instead of assuming a
   * send went out. Hosts report false, since they address clients directly.
   */
  isHostAddressable(): boolean;
  /** Start the transport with a room code and player name */
  start(roomCode: string, playerName: string, isHost: boolean): void;
  /** Stop the transport and clean up */
  stop(): void;
  /** Set the player ID for this transport (used for addressing) */
  setPlayerId(playerId: string): void;
  /** Get the player ID for this transport */
  getPlayerId(): string | null;
}