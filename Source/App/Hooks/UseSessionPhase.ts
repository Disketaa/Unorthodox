import { PlayerId, PlayerLook, hostTimeToLocal } from '@/Core';
import { PublicPlayer, PublicState } from '@/Game';
import type { PhaseName } from '@/Game';

/** Every phase a player can be in, which is what the screens are chosen from. Connecting is the
 * one that is not a game phase: it is what this browser is in before the host has said
 * anything, so nothing about it comes from the phase table. */
export type SessionPhaseName = PhaseName | 'Connecting';

export interface SessionPhase {
  phase: SessionPhaseName;
  durationMs: number;
  /** When the phase started, on this device's clock. The host's own start time, converted
   * through the measured clock offset: counting from when the message arrived would restart the
   * countdown for a client that joined late or caught up. */
  phaseStartedAt: number;
  /** When the phase's own answer was given, where it has one and the room is holding it on
   * screen. The countdown stops here rather than at the end of the duration, so a phase the
   * room has already answered is not shown counting down over an answer nobody can change. */
  answeredAt: number | undefined;
  /** When the room was held, on this device's clock, or undefined while it is running. The
   * moment every countdown freezes at, so a client that joins or refreshes mid-hold draws the
   * clock as it stood when the room stopped rather than counting the hold away. */
  pausedAt: number | undefined;
  /** Skew between the host's clock and this device's. */
  clockOffsetMs: number;
  playerNames: ReadonlyMap<PlayerId, string>;
  playerLooks: ReadonlyMap<PlayerId, PlayerLook>;
  /** Who is still on the line, which only the host can see change. */
  playerPresence: ReadonlyMap<PlayerId, boolean>;
  playerCount: number;
  submittedCount: number;
  /** Who has sent an answer in the phase in view, which is only ever the writing phase. Empty
   * everywhere else, so a seat is never left marked at work by a round that has already moved
   * on. */
  submittedIds: ReadonlySet<PlayerId>;
  /** Who among those is writing over the answer they sent, which puts them back at work. */
  editingIds: ReadonlySet<PlayerId>;
  /** Whose turn it is in the room, or null before anyone has had one. Sent by every phase, so
   * this is the room's and not the round's. */
  turnPlayerId: PlayerId | null;
}

/** The room, read as the three lookups the screens ask it for. The roster arrives in every
 * phase, so this is derived on each render rather than accumulated in a ref: a refreshed client
 * is handed the room back by the state it is sent. */
function readRoster(players: readonly PublicPlayer[]) {
  const names = new Map<PlayerId, string>();
  const looks = new Map<PlayerId, PlayerLook>();
  const presence = new Map<PlayerId, boolean>();
  players.forEach((player) => {
    names.set(player.id, player.name);
    looks.set(player.id, player.look);
    presence.set(player.id, player.isOnline);
  });
  return { names, looks, presence };
}

/** Only the timed phases carry a duration; Lobby and Final have none. */
function readDurationMs(publicState: PublicState | undefined): number {
  return publicState !== undefined && 'durationMs' in publicState ? publicState.durationMs : 0;
}

/** The host's start time of the current phase, or 0 for untimed phases. */
function readStartedAt(publicState: PublicState | undefined): number {
  return publicState !== undefined && 'startedAt' in publicState ? publicState.startedAt : 0;
}

/** How much of the phase's clock runs before the room can see it, which is the count-in and only
 * ever on the first phase of a game. Absent from an older host, which had no count-in to hide. */
function readLeadInMs(publicState: PublicState | undefined): number {
  return publicState?.phase === 'Choosing' ? (publicState.leadInMs ?? 0) : 0;
}

/** Read the current phase, the host's clock, and the room as it stands. */
export function useSessionPhase(
  publicState: PublicState | undefined,
  clockOffsetMs: number
): SessionPhase {
  const roster = readRoster(publicState?.players ?? []);
  // The clock runs from the end of the lead-in, not from the moment the host pressed Start, so
  // both the start and the length it is measured against move by it. A phase shown counting down
  // from behind a count-in it was not visible for would read short of full the instant it appears.
  const leadInMs = readLeadInMs(publicState);
  const startedAt = hostTimeToLocal(readStartedAt(publicState), clockOffsetMs) + leadInMs;

  return {
    phase: publicState?.phase ?? 'Connecting',
    durationMs: Math.max(0, readDurationMs(publicState) - leadInMs),
    phaseStartedAt: startedAt,
    answeredAt:
      publicState?.phase === 'Choosing' && publicState.answeredAt !== undefined
        ? hostTimeToLocal(publicState.answeredAt, clockOffsetMs)
        : undefined,
    pausedAt:
      publicState?.pausedAt !== undefined
        ? hostTimeToLocal(publicState.pausedAt, clockOffsetMs)
        : undefined,
    clockOffsetMs,
    playerNames: roster.names,
    playerLooks: roster.looks,
    playerPresence: roster.presence,
    playerCount: roster.names.size,
    submittedCount: publicState?.phase === 'Writing' ? publicState.submittedCount : 0,
    submittedIds:
      publicState?.phase === 'Writing'
        ? new Set(publicState.submittedIds ?? [])
        : new Set<PlayerId>(),
    editingIds:
      publicState?.phase === 'Writing'
        ? new Set(publicState.editingIds ?? [])
        : new Set<PlayerId>(),
    turnPlayerId: publicState?.turnPlayerId ?? null,
  };
}
