import { describe, it, expect } from 'vitest';
import { scoreSteps, scoreCard, type CardScore } from './Scoring';

function card(over: Partial<CardScore> = {}): CardScore {
  return {
    groupSize: 1,
    isRejected: false,
    isEmpty: false,
    speedShare: 0,
    likes: 0,
    mult: 1,
    ...over,
  };
}

describe('the steps a card counts up through', () => {
  it('makes the steps add up to what the card paid', () => {
    // The only claim a room can check on its own: the figures it watched climb are the figure it
    // was told. A card whose steps do not add to its total is a card the room cannot believe, and
    // it is not something the animation would show as wrong — it would show as a climb that
    // lands somewhere else.
    const cards = [
      card(),
      card({ speedShare: 0.4 }),
      card({ likes: 3 }),
      card({ speedShare: 0.2, likes: 2 }),
      card({ mult: 2, speedShare: 0.5, likes: 1 }),
      card({ groupSize: 2 }),
      card({ groupSize: 2, mult: 2 }),
      card({ groupSize: 3 }),
      card({ isRejected: true, speedShare: 0.1, likes: 5 }),
      card({ speedShare: 1 }),
    ];
    for (const one of cards) {
      const steps = scoreSteps(one);
      expect(steps.base + steps.mult + steps.likes, JSON.stringify(one)).toBe(steps.total);
    }
  });

  it('never has a step below zero', () => {
    // A shared answer is paid its flat rate and nothing else, so it has nothing to climb through.
    // Reading a base off the speed curve anyway made the card's own step negative, and a card
    // counting downwards in a phase about counting upwards.
    for (const size of [2, 3, 4]) {
      const steps = scoreSteps(card({ groupSize: size, speedShare: 0, mult: 2 }));
      expect(steps.base, `group of ${size}`).toBeGreaterThanOrEqual(0);
      expect(steps.mult, `group of ${size}`).toBe(0);
      expect(steps.likes, `group of ${size}`).toBe(0);
    }
  });

  it('has no steps at all for a card that was struck out', () => {
    const steps = scoreSteps(card({ isRejected: true, speedShare: 0.1, likes: 4 }));
    expect(steps).toEqual({ base: 0, mult: 0, likes: 0, total: 0 });
  });

  it('pays a player who wrote nothing nothing', () => {
    // Nobody answered, so no time was ever recorded — and a missing time reads as having arrived
    // on the first tick, which is the fastest an answer can arrive and pays the most. Left
    // unchecked, a round that nobody played was scoring at the top of the board.
    expect(scoreSteps(card({ isEmpty: true, speedShare: 0, groupSize: 1 }))).toEqual({
      base: 0,
      mult: 0,
      likes: 0,
      total: 0,
    });
  });

  it('pays whole points, whatever the multiplier is a share of', () => {
    // The speed scale is whole points and the card's multiplier is not, so multiplying one by the
    // other leaves a fraction — and a fraction in a standing is a standing no game can settle on:
    // twenty-two and a bit is not a figure anybody can finish a game with.
    for (const mult of [1.25, 1.5, 1.75, 2]) {
      for (let share = 0; share <= 1; share += 0.1) {
        const scored = scoreCard(card({ speedShare: share, mult }));
        expect(Number.isInteger(scored.points), `mult ${mult} share ${share}`).toBe(true);
        expect(Number.isInteger(scored.fromSpeed), `mult ${mult} share ${share}`).toBe(true);
      }
    }
  });

  it('shows what the card itself added, and shows nothing for a plain one', () => {
    // The middle step is the multiplier's own share, so a doubled round has a step to show and a
    // plain one has none. It was named a speed bonus, which made it zero on every plain round and
    // left the room looking at one figure with the card's effect nowhere in the count.
    const plain = scoreSteps(card({ speedShare: 0 }));
    expect(plain.base).toBe(20);
    expect(plain.mult).toBe(0);

    const doubled = scoreSteps(card({ speedShare: 0, mult: 2 }));
    expect(doubled.base).toBe(20);
    expect(doubled.mult).toBe(20);
    expect(doubled.total).toBe(40);
  });
});
