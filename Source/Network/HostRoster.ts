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
  /**
   * The seats of players who have dropped.
   *
   * Held apart from the seat map rather than by removing the seat, because a player
   * who loses the connection has not given up their place: the room is waiting on
   * them, not counting them out.
   */
  private readonly goneSeats = new Set<PlayerId>();

  /**
   * The browser behind each seat, so a returning player can be recognised without
   * having been seen to leave.
   *
   * Keyed by seat rather than by name, because the seat is what a claim reclaims and
   * what the answers are attached to. A browser that vanishes and comes back finds its
   * own entry, which is what lets a refresh keep the seat even when the departure
   * notice never arrived.
   */
  private readonly browserBySeat = new Map<PlayerId, string>();

  /** Claim a seat for the host itself, which plays under a reserved id. */
  addHost(hostId: PlayerId, name: string): void {
    this.seats.add(hostId);
    this.seatByName.set(name, hostId);
  }

  /**
   * The seat for a name, reusing the one it had before if this player is
   * returning. A brand new name is given the next free seat.
   */
  claimSeat(name: string, peerId: string, browserId: string): PlayerId {
    const known = this.seatByName.get(name);
    const seat = known ?? `p${this.nextId++}`;
    this.seats.add(seat);
    this.seatByName.set(name, seat);
    this.browserBySeat.set(seat, browserId);
    // The address that just claimed this seat is the one whose departure counts,
    // and any earlier address for the same seat is stale: it has already gone.
    for (const [address, seated] of this.seatByPeerId) {
      if (seated === seat) {
        this.seatByPeerId.delete(address);
      }
    }
    this.seatByPeerId.set(peerId, seat);
    // Claiming a seat is proof of life, so this player is waiting on the answer.
    this.goneSeats.delete(seat);
    return seat;
  }

  /** The seat behind a transport address, or undefined if it never claimed one. */
  seatForPeer(peerId: string): PlayerId | undefined {
    return this.seatByPeerId.get(peerId);
  }

  /** The address a seat is sitting at, or undefined if it is not connected. */
  addressForSeat(playerId: PlayerId): string | undefined {
    for (const [address, seated] of this.seatByPeerId) {
      if (seated === playerId) {
        return address;
      }
    }
    return undefined;
  }

  /** Forget a departed address, so a stale one cannot claim a departure twice. */
  releasePeer(peerId: string): void {
    this.seatByPeerId.delete(peerId);
  }

  /** Note that the player in this seat has dropped off the network. */
  markGone(playerId: PlayerId): void {
    this.goneSeats.add(playerId);
  }

  /**
   * Give a seat up at the host's word, unlike a departure.
   *
   * Everything the seat was remembered by goes with it, so the name is free again
   * and the player's own late departure cannot mark a seat that no longer exists.
   */
  releaseSeat(playerId: PlayerId): void {
    this.seats.delete(playerId);
    this.goneSeats.delete(playerId);
    this.browserBySeat.delete(playerId);
    for (const [name, seated] of this.seatByName) {
      if (seated === playerId) {
        this.seatByName.delete(name);
      }
    }
    for (const [address, seated] of this.seatByPeerId) {
      if (seated === playerId) {
        this.seatByPeerId.delete(address);
      }
    }
  }

  /**
   * Whether this name is taken by someone who is still here.
   *
   * A name belonging to a player who has dropped is free again, because the name is
   * the only handle the room has and that player is not in it. The host's own name
   * counts as taken: the host is playing, and a second player wearing its name would
   * be indistinguishable from it in every answer and every score.
   *
   * A browser that already holds the name is not an impostor either, and this is the
   * case that a dropped seat alone does not cover. Whether the host heard the previous
   * connection leave is a fact about relays, and relays fail: a player who refreshed
   * while one was refusing writes would otherwise be locked out of a room it is
   * demonstrably talking to, under a name that can never be freed again while the host's
   * page lives. The browser answering for the name is the evidence, and it is evidence
   * the room asked for rather than inferred.
   */
  isNameActive(name: string, browserId: string): boolean {
    const seat = this.seatByName.get(name);
    if (seat === undefined || !this.seats.has(seat) || this.goneSeats.has(seat)) {
      return false;
    }
    return this.browserBySeat.get(seat) !== browserId;
  }

  has(playerId: PlayerId): boolean {
    return this.seats.has(playerId);
  }

  /**
   * How many answers the room is still waiting for.
   *
   * Seats minus the players who have dropped, so a disconnected player does not
   * hold the round open for an answer that can no longer arrive. The seat is kept
   * either way, so a player who comes back is waited for again from that moment.
   */
  get count(): number {
    return this.seats.size - this.goneSeats.size;
  }

  clear(): void {
    this.seats.clear();
    this.seatByName.clear();
    this.seatByPeerId.clear();
    this.goneSeats.clear();
    this.browserBySeat.clear();
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
