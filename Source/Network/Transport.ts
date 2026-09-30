export interface Transport {
  /** Send a message to the host (only clients call this) */
  sendToHost(message: unknown): void;
  /** Send a message to a specific player (only host calls this) */
  sendToPlayer(playerId: string, message: unknown): void;
  /** Send a message to all players (only host calls this) */
  broadcast(message: unknown): void;
  /** Set callback for when a message is received */
  onMessage(callback: (message: unknown, fromHost: boolean) => void): void;
  /** Set callback for when a peer leaves */
  onPeerLeave(callback: (playerId: string) => void): void;
  /**
   * Set callback for when the transport becomes able to address the host.
   * Only clients receive this; a buffered message can be flushed here.
   */
  onHostReady(callback: () => void): void;
  /** Start the transport with a room code and player name */
  start(roomCode: string, playerName: string, isHost: boolean): void;
  /** Stop the transport and clean up */
  stop(): void;
  /** Set the player ID for this transport (used for addressing) */
  setPlayerId(playerId: string): void;
  /** Get the player ID for this transport */
  getPlayerId(): string | null;
}