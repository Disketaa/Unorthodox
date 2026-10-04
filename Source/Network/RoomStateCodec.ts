import type { HostState, Player } from '@/Game';
import type { PlayerId } from '@/Core';

/**
 * The host's game state, as plain data and back again.
 *
 * Split from the storage that holds it, so a round's shape can be checked without a tab.
 * Written out per phase and read back field by field, because a cast promises a shape nothing
 * checked.
 */

/**
 * Plain data as name/value pairs, so a value can be read without a cast.
 *
 * `Object.entries` is what makes this possible: it reads an object of unknown shape where
 * reading a property off the unknown would need a cast to say what it was.
 */
type Fields = Map<string, unknown>;

function fieldsOf(value: unknown): Fields {
  return value !== null && typeof value === 'object' ? new Map(Object.entries(value)) : new Map();
}

function text(fields: Fields, name: string): string {
  const value = fields.get(name);
  return typeof value === 'string' ? value : '';
}

function number(fields: Fields, name: string): number {
  const value = fields.get(name);
  return typeof value === 'number' ? value : 0;
}

function rawPairs(fields: Fields, name: string): unknown[] {
  const value = fields.get(name);
  return Array.isArray(value) ? value : [];
}

/**
 * A stored list of pairs back as a map, dropping anything that is not one.
 *
 * Guarded rather than cast, because what is in storage was written by an older version of this
 * file or by nothing at all, and an entry that does not look like what it claims is not a seat.
 */
function toMap<V>(
  pairs: readonly unknown[],
  isValue: (value: unknown) => value is V,
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
const isNumber = (value: unknown): value is number => typeof value === 'number';
const isText = (value: unknown): value is string => typeof value === 'string';
const isPlayer = (value: unknown): value is Player => typeof value === 'object' && value !== null;

/** The state as plain data, one shape per phase. */
export function encodeRoomState(state: HostState): Record<string, unknown> {
  const scores = [...state.cumulativeScores.entries()];
  // Every phase writes the roster out: the seats are how a returning player is recognised and how
  // the bar of players knows who to draw, so a resumed room without them is a room of faceless seats.
  const members = { players: [...state.players.entries()], scores };
  if (state.phase === 'Lobby') {
    return { ...members, phase: state.phase, pace: state.pace };
  }
  if (state.phase === 'Final') {
    return { ...members, phase: state.phase };
  }
  // Every remaining phase is timed and reads the same clock: how long it runs, and when it started,
  // which is what a phase resumed after a refresh counts from.
  const clock = { durationMs: state.durationMs, startedAt: state.startedAt };
  if (state.phase === 'Scores') {
    return { ...members, ...clock, phase: state.phase, round: [...state.scores] };
  }
  const answers = [...state.answers];
  if (state.phase === 'Writing') {
    return { ...members, ...clock, phase: state.phase, topic: state.topic, answers };
  }
  return {
    ...members,
    ...clock,
    phase: state.phase,
    topic: state.topic,
    answers,
    // The sets go out as lists of names: the only shape that survives JSON, and the only one a
    // rejection is ever compared in.
    rejections: [...state.groupRejections].map(([groupId, rejected]) => [groupId, [...rejected]]),
  };
}

/** The stored names of every rejected group, dropping anything that is not one. */
function toRejections(fields: Fields): Map<number, Set<PlayerId>> {
  const rejections = new Map<number, Set<PlayerId>>();
  for (const pair of rawPairs(fields, 'rejections')) {
    if (!Array.isArray(pair)) continue;
    const [groupId, names] = pair;
    if (typeof groupId === 'number' && Array.isArray(names)) {
      rejections.set(groupId, new Set(names.filter((entry) => typeof entry === 'string')));
    }
  }
  return rejections;
}

/** The clock every timed phase carries, counted from the host that started it. */
function clockOf(fields: Fields): { durationMs: number; startedAt: number } {
  return { durationMs: number(fields, 'durationMs'), startedAt: number(fields, 'startedAt') };
}

/** The two untimed phases, which carry no clock at all. */
function plainFrom(
  fields: Fields,
  members: { scores: Map<PlayerId, number>; players: Map<PlayerId, Player> },
): HostState | undefined {
  const { scores, players } = members;
  switch (fields.get('phase')) {
    case 'Lobby':
      return {
        phase: 'Lobby',
        players,
        cumulativeScores: scores,
        pace: fields.get('pace') === 'Fast' ? 'Fast' : 'Standard',
      };
    case 'Final':
      return { phase: 'Final', players, cumulativeScores: scores };
    default:
      return undefined;
  }
}

/** The three timed phases, which all read the same clock and the same roster. */
function timedFrom(
  fields: Fields,
  members: { scores: Map<PlayerId, number>; players: Map<PlayerId, Player> },
): HostState | undefined {
  const clock = clockOf(fields);
  const topic = text(fields, 'topic');
  const answers = toMap(rawPairs(fields, 'answers'), isText);
  const { scores, players } = members;
  switch (fields.get('phase')) {
    case 'Writing':
      return { phase: 'Writing', ...clock, topic, answers, players, cumulativeScores: scores };
    case 'Reviewing':
      return {
        phase: 'Reviewing',
        ...clock,
        topic,
        answers,
        groupRejections: toRejections(fields),
        players,
        cumulativeScores: scores,
      };
    case 'Scores':
      return {
        phase: 'Scores',
        ...clock,
        scores: toMap(rawPairs(fields, 'round'), isNumber),
        players,
        cumulativeScores: scores,
      };
    default:
      return undefined;
  }
}

/** The state back, or undefined when what was stored is not a state we can resume. */
export function decodeRoomState(stored: unknown): HostState | undefined {
  const fields = fieldsOf(stored);
  const members = {
    scores: toMap(rawPairs(fields, 'scores'), isNumber),
    players: toMap(rawPairs(fields, 'players'), isPlayer),
  };
  return plainFrom(fields, members) ?? timedFrom(fields, members);
}
