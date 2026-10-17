import type { BalanceParams } from './Params.ts';

/** What one card on the board is worth, everything a curve is allowed to look at. `speedShare`
 * is the share of the writing clock the author took, 0 for the first keystroke and 1 for the
 * grace period running out. `likes` is the count the room drew, already excluding the author. */
export interface CardScore {
  isUnique: boolean;
  isMuted: boolean;
  isBlank: boolean;
  speedShare: number;
  mult: number;
  likes: number;
  /** How many players wrote the same answer, which only the legacy rule reads. */
  groupSize: number;
}

export type SpeedCurve = 'Linear' | 'Soft' | 'Steep' | 'Banded' | 'Rooted' | 'Threshold';
export type MultPlacement = 'SpeedOnly' | 'Whole' | 'LikesOnly';
export type Shape = 'Legacy' | 'Bonus';

/** A scoring shape: the game's own rule, or the new one with its curve and its multiplier
 * placement. Every shape is scored the same way below, so the tables compare like with like. */
export type Formula =
  | { shape: 'Legacy' }
  | { shape: 'Bonus'; curve: SpeedCurve; placement: MultPlacement };

export const SpeedCurves: readonly SpeedCurve[] = [
  'Linear',
  'Soft',
  'Steep',
  'Banded',
  'Rooted',
  'Threshold',
];

export const MultPlacements: readonly MultPlacement[] = ['SpeedOnly', 'Whole', 'LikesOnly'];

/** One shape per cell of the report, so every curve and every placement is on the same table as
 * every other. `Legacy` first, since it is the number the game plays today. */
export function allFormulas(): Formula[] {
  const formulas: Formula[] = [{ shape: 'Legacy' }];
  for (const curve of SpeedCurves) {
    for (const placement of MultPlacements) {
      formulas.push({ shape: 'Bonus', curve, placement });
    }
  }
  return formulas;
}

/** Every shape a bonus curve can be worth before the multiplier. All of them spend the same
 * budget, so the tables compare where the points land rather than how many there are. */
export function speedPoints(curve: SpeedCurve, speedShare: number, params: BalanceParams): number {
  const left = Math.max(0, 1 - speedShare);
  switch (curve) {
    case 'Linear':
      return params.speedMaxPoints * left;
    // Half way between `Linear` and `Steep`: still a curve rather than shelves, and it keeps the
    // last third of the clock worth something, which is where a thoughtful answer lands.
    case 'Soft':
      return params.speedMaxPoints * Math.pow(left, 1.5);
    // Rewards being first hard and being last barely, which is what a rule with a real curve at
    // the top of it looks like: the difference between 4s and 8s is the round.
    case 'Steep':
      return params.speedMaxPoints * left * left;
    // Three flat shelves, so a card can be read at a glance and a player knows what aiming for
    // is worth without doing arithmetic.
    case 'Banded': {
      if (speedShare <= 1 / 3) return params.speedMaxPoints;
      if (speedShare <= 2 / 3) return params.speedMaxPoints / 2;
      return params.speedMaxPoints / 4;
    }
    // Gentle at the top and steep at the bottom: the opposite trade to `Steep`, for a room whose
    // answers mostly land late and where `Steep` would flatten the whole board to zero.
    case 'Rooted':
      return params.speedMaxPoints * Math.sqrt(left);
    // A gate, then a curve: nothing for a late answer, everything for an early one.
    case 'Threshold': {
      const gate = 1 / 4;
      if (speedShare <= gate) return params.speedMaxPoints;
      const past = (speedShare - gate) / (1 - gate);
      return params.speedMaxPoints * Math.max(0, 1 - past);
    }
  }
}

function legacyPoints(card: CardScore): number {
  if (card.groupSize === 1) return 3;
  if (card.groupSize === 2) return 1;
  return 0;
}

/** What one card pays out. A card nobody wrote and a card the host struck out pay nothing, and a
 * card somebody else wrote first pays the flat duplicate rate rather than the speed scale. */
export function scoreCard(
  formula: Formula,
  card: CardScore,
  params: BalanceParams
): { points: number; fromSpeed: number; fromLikes: number } {
  if (card.isBlank || card.isMuted) {
    return { points: 0, fromSpeed: 0, fromLikes: 0 };
  }
  if (formula.shape === 'Legacy') {
    const points = legacyPoints(card);
    return { points, fromSpeed: points, fromLikes: 0 };
  }
  // No speed, because the room already had the idea, and no likes, because a like is the room
  // finding something once.
  if (!card.isUnique) {
    return {
      points: card.groupSize === 2 ? params.pairPoints * card.mult : 0,
      fromSpeed: 0,
      fromLikes: 0,
    };
  }
  const rawSpeed = speedPoints(formula.curve, card.speedShare, params);
  const speed = params.roundSpeedBeforeMult ? Math.round(rawSpeed) : rawSpeed;
  const likes = card.likes * params.pointsPerLike;
  const points =
    formula.placement === 'SpeedOnly'
      ? speed * card.mult + likes
      : formula.placement === 'Whole'
        ? (speed + likes) * card.mult
        : speed + likes * card.mult;
  return { points: Math.round(points), fromSpeed: Math.round(points - likes), fromLikes: Math.round(likes) };
}

/** One line of prose per shape, so the report says what each row is rather than leaving the
 * reader to work it out from the column headers. */
export function describeFormula(formula: Formula): string {
  if (formula.shape === 'Legacy') return 'unique 3 / pair 1 / three or more 0';
  const curves: Record<SpeedCurve, string> = {
    Linear: 'speed x time left',
    Soft: 'speed x time left to the power 1.5',
    Steep: 'speed x time left squared',
    Banded: '20 / 10 / 5 over thirds of the clock',
    Rooted: 'speed x root of time left',
    Threshold: '20 for the first quarter, then falling to 0',
  };
  const placements: Record<MultPlacement, string> = {
    SpeedOnly: '(speed x mult) + likes',
    Whole: '(speed + likes) x mult',
    LikesOnly: 'speed + (likes x mult)',
  };
  return `${curves[formula.curve]}, ${placements[formula.placement]}`;
}

export function formulaName(formula: Formula): string {
  if (formula.shape === 'Legacy') return 'Legacy';
  return `${formula.curve} / ${formula.placement}`;
}
