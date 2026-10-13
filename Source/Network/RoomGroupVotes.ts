/** The names behind each marked group, read back out of storage and written to it. Its own file
 * because these are the only maps in the room keyed by number rather than player id, and the
 * round trip is the fiddly part. Shared, since a mute and a like store the same shape. */
import type { PlayerId } from '@/Core';

type Fields = Map<string, unknown>;

/** The stored pairs of one field, as they came out of storage rather than as an array. */
function rawPairs(fields: Fields, name: string): unknown[] {
  const value = fields.get(name);
  return Array.isArray(value) ? value : [];
}

/** The marks stored under a name, dropping anything that is not one. A group saved with no names
 * on it is left out rather than kept as an empty set: it says the same thing and costs a pair. */
export function toGroupVotes(fields: Fields, name: string): Map<number, Set<PlayerId>> {
  const votes = new Map<number, Set<PlayerId>>();
  for (const pair of rawPairs(fields, name)) {
    if (!Array.isArray(pair)) continue;
    const [groupId, names] = pair;
    if (typeof groupId === 'number' && Array.isArray(names)) {
      votes.set(groupId, new Set(names.filter((entry) => typeof entry === 'string')));
    }
  }
  return votes;
}

/** How a group's marks are written out: one list of names per group, which is the only shape
 * that survives JSON and the only one a mark is ever compared in. */
export function groupVotesOut(votes: ReadonlyMap<number, ReadonlySet<PlayerId>>): unknown[] {
  return [...votes].map(([groupId, marked]) => [groupId, [...marked]]);
}
