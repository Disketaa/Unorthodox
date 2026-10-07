/** The host's game state, as plain data and back again. Split from the storage that holds it, so
 * a round's shape can be checked without a tab. Written out per phase and read back field by
 * field, because a cast promises a shape nothing checked. */
import type { HostState, Player, Pace } from '@/Game';
import type { PlayerId } from '@/Core';
import { rejectionsOut, toRejections } from './RoomRejections';

/** Plain data as name/value pairs, so a value can be read without a cast. `Object.entries` is
 * what makes this possible: it reads an object of unknown shape where reading a property off
 * the unknown would need a cast to say what it was. */
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

/** A stored list of pairs back as a map, dropping anything that is not one. Guarded rather than
 * cast, because what is in storage was written by an older version of this file or by nothing
 * at all, and an entry that does not look like what it claims is not a seat. */
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

/** The stored pace, or Standard when what is in storage names a pace this build has dropped:
 * every phase is timed off the pace, so an unrecognised one is a room that cannot start. */
function paceFrom(fields: Fields): Pace {
  const value = fields.get('pace');
  return value === 'Fast' ? 'Fast' : 'Standard';
}

/** The state as plain data, one shape per phase. */
export function encodeRoomState(state: HostState): Record<string, unknown> {
  const scores = [...state.cumulativeScores.entries()];
  // Every phase writes the roster out: the seats are how a returning player is recognised and how
  // the bar of players knows who to draw, so a resumed room without them is a room of faceless seats.
  const members = {
    players: [...state.players.entries()],
    scores,
    turnPlayerId: state.turnPlayerId,
    pace: state.pace,
  };
  if (state.phase === 'Lobby') {
    return { ...members, phase: state.phase, pace: state.pace };
  }
  if (state.phase === 'Choosing') {
    return { ...members, phase: state.phase, durationMs: state.durationMs, startedAt: state.startedAt };
  }
  if (state.phase === 'Final') {
    return { ...members, phase: state.phase };
  }
  // Every remaining phase is timed and reads the same clock: how long it runs, and when it started,
  // which is what a phase resumed after a refresh counts from.
  const clock = { durationMs: state.durationMs, startedAt: state.startedAt };
  if (state.phase === 'Writing') {
    return { ...members, ...clock, phase: state.phase, topic: state.topic, answers: [...state.answers] };
  }
  if (state.phase === 'Reviewing') {
    return {
      ...members,
      ...clock,
      phase: state.phase,
      topic: state.topic,
      answers: [...state.answers],
      rejections: rejectionsOut(state.groupRejections),
    };
  }
  if (state.phase === 'Scores') {
    return { ...members, ...clock, phase: state.phase, round: [...state.scores] };
  }
  // unreachable
  return {};
}

/** The clock every timed phase carries, counted from the host that started it. */
function clockOf(fields: Fields): { durationMs: number; startedAt: number } {
  return { durationMs: number(fields, 'durationMs'), startedAt: number(fields, 'startedAt') };
}

/** What every phase of a stored room carries whatever it is doing. One shape, because the seats,
 * the totals and the turn all outlive the phase they were written in. */
interface Members {
  scores: Map<PlayerId, number>;
  players: Map<PlayerId, Player>;
  turnPlayerId: PlayerId | null;
  pace: Pace;
}

/** The room's turn, absent in a room stored before turns existed. */
function turnFrom(fields: Fields): PlayerId | null {
  const value = fields.get('turnPlayerId');
  return typeof value === 'string' ? value : null;
}

/** The seats, totals, turn and pace a stored room comes back with. */
function membersFrom(fields: Fields): Members {
  return {
    scores: toMap(rawPairs(fields, 'scores'), isNumber),
    players: toMap(rawPairs(fields, 'players'), isPlayer),
    turnPlayerId: turnFrom(fields),
    pace: paceFrom(fields),
  };
}

/** The two untimed phases, which carry no clock at all. */
function plainFrom(fields: Fields, members: Members): HostState | undefined {
  const { scores, players, turnPlayerId, pace } = members;
  switch (fields.get('phase')) {
    case 'Lobby':
      return {
        phase: 'Lobby',
        players,
        cumulativeScores: scores,
        turnPlayerId,
        pace,
      };
    case 'Final':
      return { phase: 'Final', players, cumulativeScores: scores, turnPlayerId, pace };
    default:
      return undefined;
  }
}

/** The three timed phases, which all read the same clock, roster and turn. */
function timedFrom(fields: Fields, members: Members): HostState | undefined {
  const { scores, players, turnPlayerId, pace } = members;
  const common = {
    ...clockOf(fields),
    topic: text(fields, 'topic'),
    answers: toMap(rawPairs(fields, 'answers'), isText),
    players,
    cumulativeScores: scores,
    turnPlayerId,
    pace,
  };
  switch (fields.get('phase')) {
    case 'Choosing':
      return { phase: 'Choosing', ...common };
    case 'Writing':
      return { phase: 'Writing', ...common };
    case 'Reviewing':
      return { phase: 'Reviewing', ...common, groupRejections: toRejections(fields) };
    case 'Scores':
      return {
        phase: 'Scores',
        ...clockOf(fields),
        scores: toMap(rawPairs(fields, 'round'), isNumber),
        players,
        cumulativeScores: scores,
        turnPlayerId,
        pace,
      };
    default:
      return undefined;
  }
}

/** The state back, or undefined when what was stored is not a state we can resume. */
export function decodeRoomState(stored: unknown): HostState | undefined {
  const fields = fieldsOf(stored);
  const members = membersFrom(fields);
  return plainFrom(fields, members) ?? timedFrom(fields, members);
}
