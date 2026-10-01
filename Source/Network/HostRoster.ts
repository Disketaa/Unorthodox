import { PlayerId, PlayerLook } from '@/Core';

/**
 * Who is at the table, and which seat each name belongs to.
 *
 * The name is the only handle a returning player has: nothing about them is kept
 * in their browser, so the host is what remembers that this name is already
 * seated. Re-joining under a known name reclaims that seat, which is what makes a
 * player who closed the tab come back as the same person. The trade-off is that
 * two people who pick the same name are treated as one.
 */
export class HostRoster {
  private nextId = 1;
  private readonly seatByName = new Map<string, PlayerId>();
  /**
   * The seat each transport address is sitting in.
   *
   * A departure arrives addressed by peer id, and the roster is keyed by seat, so
   * without this the host could only tell that somebody left, never who. A player
   * who reconnects is a new address for the same seat, so the older address is
   * dropped rather than left to claim a second departure.
   */
  private readonly seatByPeerId = new Map<string, PlayerId>();
  /** Seats handed out, so the host knows how many answers to wait for. */
  private readonly seats = new Set<PlayerId>();

  /** Claim a seat for the host itself, which plays under a reserved id. */
  addHost(hostId: PlayerId, name: string): void {
    this.seats.add(hostId);
    this.seatByName.set(name, hostId);
  }

  /**
   * The seat for a name, reusing the one it had before if this player is
   * returning. A brand new name is given the next free seat.
   */
  claimSeat(name: string, peerId: string): PlayerId {
    const known = this.seatByName.get(name);
    const seat = known ?? `p${this.nextId++}`;
    this.seats.add(seat);
    this.seatByName.set(name, seat);
    // The address that just claimed this seat is the one whose departure counts,
    // and any earlier address for the same seat is stale: it has already gone.
    for (const [address, seated] of this.seatByPeerId) {
      if (seated === seat) {
        this.seatByPeerId.delete(address);
      }
    }
    this.seatByPeerId.set(peerId, seat);
    return seat;
  }

  /** The seat behind a transport address, or undefined if it never claimed one. */
  seatForPeer(peerId: string): PlayerId | undefined {
    return this.seatByPeerId.get(peerId);
  }

  /** Forget a departed address, so a stale one cannot claim a departure twice. */
  releasePeer(peerId: string): void {
    this.seatByPeerId.delete(peerId);
  }

  has(playerId: PlayerId): boolean {
    return this.seats.has(playerId);
  }

  get count(): number {
    return this.seats.size;
  }

  clear(): void {
    this.seats.clear();
    this.seatByName.clear();
    this.seatByPeerId.clear();
    this.nextId = 1;
  }
}

/**
 * The character to record for a player who is (or may be) returning.
 *
 * A player the host already knows keeps the character it gave them, and the look
 * they arrive with is ignored: it was rolled on their side and would otherwise
 * overwrite the record that survived their tab closing. Only a player with no
 * record yet brings their own look into the room.
 */
export function resolveLook(
  knownLook: PlayerLook | undefined,
  incomingLook: PlayerLook,
): PlayerLook {
  return knownLook ?? incomingLook;
}
