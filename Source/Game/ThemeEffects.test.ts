import { describe, test, expect } from 'vitest';
import { affectedPlayersFor } from './ThemeEffects';

function rankedPlayers(
  scores: Record<string, number>
): [readonly string[], ReadonlyMap<string, number>] {
  const ids = Object.keys(scores);
  const map = new Map<string, number>();
  for (const id of ids) map.set(id, scores[id]);
  return [ids, map];
}

describe('affectedPlayersFor Alone', () => {
  test('returns empty set when no chooser', () => {
    const [ids, scores] = rankedPlayers({ p1: 10, p2: 5 });
    expect(affectedPlayersFor('Alone', ids, scores, undefined, 'seed')).toEqual(new Set());
  });

  test('returns only the chooser', () => {
    const [ids, scores] = rankedPlayers({ p1: 10, p2: 5 });
    expect(affectedPlayersFor('Alone', ids, scores, 'p2', 'seed')).toEqual(new Set(['p2']));
  });
});

describe('affectedPlayersFor Half', () => {
  test('returns empty set for one player', () => {
    const [ids, scores] = rankedPlayers({ p1: 10 });
    expect(affectedPlayersFor('Half', ids, scores, 'p1', 'seed')).toEqual(new Set());
  });

  test('returns half the room for two players', () => {
    const [ids, scores] = rankedPlayers({ p1: 10, p2: 5 });
    const result = affectedPlayersFor('Half', ids, scores, 'p1', 'seed');
    expect(result.size).toBe(1);
    expect(ids.some((id) => result.has(id))).toBe(true);
  });

  test('returns half the room for four players', () => {
    const [ids, scores] = rankedPlayers({ p1: 10, p2: 8, p3: 6, p4: 4 });
    const result = affectedPlayersFor('Half', ids, scores, 'p1', 'seed');
    expect(result.size).toBe(2);
  });
});

describe('affectedPlayersFor Laggards', () => {
  test('returns lowest-scoring half', () => {
    const [ids, scores] = rankedPlayers({ p1: 10, p2: 8, p3: 6, p4: 4 });
    const result = affectedPlayersFor('Laggards', ids, scores, undefined, 'seed');
    expect(result).toEqual(new Set(['p4', 'p3']));
  });

  test('breaks ties by reverse roster order', () => {
    const [ids, scores] = rankedPlayers({ p1: 5, p2: 5, p3: 5, p4: 5 });
    const result = affectedPlayersFor('Laggards', ids, scores, undefined, 'seed');
    expect(result).toEqual(new Set(['p4', 'p3']));
  });
});

describe('affectedPlayersFor Leaders', () => {
  test('returns highest-scoring half', () => {
    const [ids, scores] = rankedPlayers({ p1: 10, p2: 8, p3: 6, p4: 4 });
    const result = affectedPlayersFor('Leaders', ids, scores, undefined, 'seed');
    expect(result).toEqual(new Set(['p1', 'p2']));
  });

  test('breaks ties by roster order', () => {
    const [ids, scores] = rankedPlayers({ p1: 5, p2: 5, p3: 5, p4: 5 });
    const result = affectedPlayersFor('Leaders', ids, scores, undefined, 'seed');
    expect(result).toEqual(new Set(['p1', 'p2']));
  });
});
