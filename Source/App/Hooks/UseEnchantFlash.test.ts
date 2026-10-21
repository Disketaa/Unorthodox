import { describe, it, expect } from 'vitest';
import { flashesFor } from './UseEnchantFlash';
import type { PublicScoreGroup } from '@/Game';

/** One answer card, written by the players named. */
function group(playerIds: string[], groupId = 1): PublicScoreGroup {
  return {
    groupId,
    text: 'кот',
    playerCount: playerIds.length,
    playerIds,
    isEmpty: false,
  };
}

describe('the room being flashed for the card the count is on', () => {
  it('flashes for a card the enchantment reached', () => {
    // The flash is the room being told what the enchantment bought, on that card's own beat.
    expect(flashesFor(group(['p1']), new Set(['p1']), new Set())).toBe(true);
  });

  it('does not flash for a card the enchantment did not reach', () => {
    expect(flashesFor(group(['p1']), new Set(['p2']), new Set())).toBe(false);
  });

  it('does not flash for a card the room has turned down', () => {
    // A struck-out answer is not paid, so the shine and the note would be saying what the
    // enchantment bought of nothing: the room is not flashed and nothing is said.
    expect(flashesFor(group(['p1']), new Set(['p1']), new Set([1]))).toBe(false);
  });

  it('does not flash for a card that is not there', () => {
    expect(flashesFor(undefined, new Set(['p1']), new Set())).toBe(false);
  });
});
