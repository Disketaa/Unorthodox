import { PlayerId, PlayerLook } from '@/Core';
import { GameConfig } from '@/Game';

/** Who is at the table, and which seat each name belongs to. The name is the only handle a
 * returning player has, so the host remembers that this name is seated, and two people picking
 * the same name are one person as far as the room is concerned. */
export class HostRoster {
  private nextId = 1;
  private readonly seatByName = new Map<string, PlayerId>();
  /** The seat each transport address is sitting in. A departure arrives addressed by peer id
   * while the roster is keyed by seat, so without this the host could only tell that somebody
   * left, never who. */
  private readonly seatByPeerId = new Map<string, PlayerId>();
  /** Seats handed out, so the host knows how many answers to wait for. */
  private readonly seats = new Set<PlayerId>();
  /** The seats of players who have dropped. Held apart from the seat map rather than removed,
   * because a player who loses the connection has not given up their place: the room is waiting
   * on them, not counting them out. */
  private readonly goneSeats = new Set<PlayerId>();

  /** The browser behind each seat. Keyed by seat because the seat is what a claim reclaims, and
   * a browser that vanishes and comes back finds its own entry, which is what lets a refresh
   * keep its seat. */
  private readonly browserBySeat = new Map<PlayerId, string>();

  /** Claim a seat for the host itself, which plays under a reserved id. */
  addHost(hostId: PlayerId, name: string): void {
    this.seats.add(hostId);
    this.seatByName.set(name, hostId);
  }

  /** Take the roster back out of a room this tab was already hosting. A refreshed host has the
   * room's state again but not the seats it is keyed by. Only names and seats come back, and a
   * returning player re-establishes their own by claiming the seat. */
  restore(players: readonly (readonly [PlayerId, { name: string }])[]): void {
    players.forEach(([playerId, player]) => {
      if (this.seats.has(playerId)) return;
      this.seats.add(playerId);
      this.seatByName.set(player.name, playerId);
      // Everyone restored counts as dropped until they claim their seat again, which is also
      // what lets them claim it: a seat held by a browser this tab knows nothing about would
      // turn a returning player into an impostor.
      this.goneSeats.add(playerId);
    });
  }

  /** Whether this name already holds a seat in the room. What decides a join once the room has
   * started: whoever was in the lobby at the start is let back in and nobody else is, so a
   * returning player keeps their score and their answer. */
  hasSeatForName(name: string): boolean {
    const seat = this.seatByName.get(name);
    return seat !== undefined && this.seats.has(seat);
  }

  /** Whether the room has a seat left to give. Counted over seats rather than connected players,
   * so a dropped player still holds theirs and a connection can never become a reason to lock
   * somebody out. */
  get hasRoom(): boolean {
    return this.seats.size < GameConfig.limits.maxPlayers;
  }

  /** The seat for a name, reusing the one it had before if this player is returning. */
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

  /** Give a seat up at the host's word, unlike a departure. Everything the seat was remembered
   * by goes with it, so the name is free again and the player's own late departure cannot mark
   * a seat that no longer exists. */
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

  /** Whether this name is taken by someone who is still here. A browser answering for a name is
   * never an impostor, and a dropped seat does not cover it: relays fail, so a player who
   * refreshed mid-refusal would be locked out for good. */
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

  /** How many answers the room is still waiting for. Seats minus the players who have dropped,
   * so a disconnected player does not hold the round open. The seat is kept either way, so a
   * player who comes back is waited for again. */
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

/** The character to record for a player who is (or may be) returning. A player the host already
 * knows keeps the character it gave them and the look they arrive with is ignored: it was
 * rolled on their side and would overwrite the record that survived. */
export function resolveLook(
  knownLook: PlayerLook | undefined,
  incomingLook: PlayerLook,
): PlayerLook {
  return knownLook ?? incomingLook;
}
