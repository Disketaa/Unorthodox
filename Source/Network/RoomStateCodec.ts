/** The host's game state read back out of plain data, guarded field by field: a cast promises a
 * * shape nothing checked. The guards are here; the phase each set of fields describes is in
 * RoomStatePhases, and the writing half is RoomStateEncoder. */
import type { HostState, Player, Pace } from '@/Game';
import { isThemeId, type PlayerId, type ThemeId } from '@/Core';
import { phaseFrom } from './RoomStatePhases';

/** Plain data as name/value pairs, so a value can be read without a cast. `Object.entries` is *
 * what makes this possible: it reads an object of unknown shape where reading a property off
 * the unknown would need a cast to say what it was. */
export type Fields = Map<string, unknown>;

export function fieldsOf(value: unknown): Fields {
  return value !== null && typeof value === 'object' ? new Map(Object.entries(value)) : new Map();
}

export function text(fields: Fields, name: string): string {
  const value = fields.get(name);
  return typeof value === 'string' ? value : '';
}

export function number(fields: Fields, name: string): number {
  const value = fields.get(name);
  return typeof value === 'number' ? value : 0;
}

export function rawPairs(fields: Fields, name: string): unknown[] {
  const value = fields.get(name);
  return Array.isArray(value) ? value : [];
}

/** A stored list of pairs back as a map, dropping anything that is not one. Guarded rather than
 * * cast, because what is in storage was written by an older version of these files or by
 * nothing at all, and an entry that does not look like what it claims is not a seat. */
export function toMap<V>(
  pairs: readonly unknown[],
  isValue: (value: unknown) => value is V
): Map<PlayerId, V> {
  const map = new Map<PlayerId, V>();
  for (const pair of pairs) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    const [key, value] = pair;
    if (typeof key === 'string' && isValue(value)) map.set(key, value);
  }
  return map;
}

/** The guards the three kinds of stored map are read back through. */
export const isNumber = (value: unknown): value is number => typeof value === 'number';
export const isPlayer = (value: unknown): value is Player =>
  typeof value === 'object' && value !== null;

/** The rounds played in each theme, keyed by theme. The key is guarded as well as the count: a *
 * count filed under a name this build has no card for is a count nothing can ever read. */
export function themeRoundsFrom(fields: Fields): Map<ThemeId, number> {
  const counts = new Map<ThemeId, number>();
  for (const pair of rawPairs(fields, 'themeRounds')) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    const [theme, count] = pair;
    if (isThemeId(theme) && isNumber(count)) counts.set(theme, count);
  }
  return counts;
}

/** The stored pace, or Standard when what is in storage names a pace this build has dropped: *
 * every phase is timed off the pace, so an unrecognised one is a room that cannot start. */
export function paceFrom(fields: Fields): Pace {
  const value = fields.get('pace');
  return value === 'Fast' ? 'Fast' : 'Standard';
}

/** The theme the room settled on, or undefined when nothing is stored or what is stored is not *
 * one this build has. The bank is drawn from the theme, so a theme that cannot be named is a
 * card that cannot be drawn, which is the same as no theme having been chosen. */
export function themeFrom(fields: Fields): ThemeId | undefined {
  const value = fields.get('theme');
  return isThemeId(value) ? value : undefined;
}

/** The clock every timed phase carries, counted from the host that started it. */
export function clockOf(fields: Fields): { durationMs: number; startedAt: number } {
  return { durationMs: number(fields, 'durationMs'), startedAt: number(fields, 'startedAt') };
}

/** The room's turn, absent in a room stored before turns existed. */
function turnFrom(fields: Fields): PlayerId | null {
  const value = fields.get('turnPlayerId');
  return typeof value === 'string' ? value : null;
}

/** What every phase of a stored room carries whatever it is doing. One shape, because the seats,
 * * the totals and the turn all outlive the phase they were written in. */
export interface Members {
  scores: Map<PlayerId, number>;
  players: Map<PlayerId, Player>;
  turnPlayerId: PlayerId | null;
  pace: Pace;
  themeRounds: Map<ThemeId, number>;
}

/** The seats, totals, turn, pace and theme counts a stored room comes back with. */
function membersFrom(fields: Fields): Members {
  return {
    scores: toMap(rawPairs(fields, 'scores'), isNumber),
    players: toMap(rawPairs(fields, 'players'), isPlayer),
    turnPlayerId: turnFrom(fields),
    pace: paceFrom(fields),
    themeRounds: themeRoundsFrom(fields),
  };
}

/** The state back, or undefined when what was stored is not a state we can resume. */
export function decodeRoomState(stored: unknown): HostState | undefined {
  const fields = fieldsOf(stored);
  return phaseFrom(fields, membersFrom(fields));
}
