/** A room as the phase hooks read it, for the tests that drive them. Shared rather than written
 * out per test file, because the shape is the whole of what either hook looks at and two copies
 * of it is two places for a field to be added to one and forgotten in the other. */
import type { SessionPhase, SessionPhaseName } from './UseSessionPhase';

/** The room's own shape, since that is all the hooks read. */
export function phaseOf(name: SessionPhaseName, startedAt = Date.now()): SessionPhase {
  return {
    phase: name,
    durationMs: 63_000,
    phaseStartedAt: startedAt,
    clockOffsetMs: 0,
    answeredAt: undefined,
    pausedAt: undefined,
    editingIds: new Set(),
    playerNames: new Map(),
    playerLooks: new Map(),
    playerPresence: new Map(),
    playerCount: 2,
    submittedCount: 0,
    submittedIds: new Set(),
    turnPlayerId: null,
  };
}
