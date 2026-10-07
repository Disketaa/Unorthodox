/** The names of every rejected group, read back out of storage, dropping anything that is not
 * one. Its own file because it is the only map in the room whose keys are numbers rather than
 * player ids, and the round trip is the fiddly part of it. */
import type { PlayerId } from '@/Core';

type Fields = Map<string, unknown>;

/** The stored pairs of a rejected group, as they came out of storage rather than as an array. */
function rawPairs(fields: Fields, name: string): unknown[] {
  const value = fields.get(name);
  return Array.isArray(value) ? value : [];
}

export function toRejections(fields: Fields): Map<number, Set<PlayerId>> {
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

/** How a room's rejections are written out: one list of names per group, which is the only shape
 * that survives JSON and the only one a rejection is ever compared in. */
export function rejectionsOut(rejections: ReadonlyMap<number, ReadonlySet<PlayerId>>): unknown[] {
  return [...rejections].map(([groupId, rejected]) => [groupId, [...rejected]]);
}
