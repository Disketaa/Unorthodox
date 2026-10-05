export interface Transport {
  /** Only clients call this. A host has nobody above it to address. */
  sendToHost(message: unknown): void;
  /** Send a message to a peer by its transport-level address, which is the id the transport
   * knows the peer by on the wire, not the game player id. */
  sendToPeer(peerId: string, message: unknown): void;
  /** Only the host calls this. */
  broadcast(message: unknown): void;
  /** Set callback for when a message is received. The peer id is the sender's transport-level
   * address, so a host can reply to exactly who sent it. */
  onMessage(callback: (message: unknown, fromHost: boolean, peerId: string) => void): void;
  /** Set callback for when a peer leaves */
  onPeerLeave(callback: (playerId: string) => void): void;
  /** Set callback for when the host first becomes addressable, so a message held back for lack
   * of a route can be sent straight away rather than on the next retry. Only clients receive
   * this. */
  onHostReady(callback: () => void): void;
/** Whether the host can actually be addressed right now. A client cannot reach the host until it
 * has answered, so this is how a caller tells "sent" apart from "queued for later". Hosts
 * report false, since they address clients directly. */
  isHostAddressable(): boolean;
  /** Start the transport. This is where it learns whether it is the host. */
  start(roomCode: string, playerName: string, isHost: boolean): void;
  /** Stop the transport and clean up */
  stop(): void;
  /** The game player id, which the host assigns and is never routable on the wire. */
  setPlayerId(playerId: string): void;
  getPlayerId(): string | null;
}