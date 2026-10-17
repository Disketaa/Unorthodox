import type { BalanceParams } from './Params.ts';

/** What a seat is trying to do, as a balance analyst would name it. The two axes are the two
 * arguments a player actually has in the writing phase: chase the board everybody else is
 * writing, or write something nobody has, and do it fast or take your time over it. */
export type Strategy = 'Unique' | 'Copy';
export type Pace = 'Fast' | 'Slow';

export type ProfileName = `${Strategy} ${Pace}`;

export const Profiles: readonly ProfileName[] = [
  'Unique Fast',
  'Unique Slow',
  'Copy Fast',
  'Copy Slow',
];

/** The share of the room playing each profile. Both mixes are asked for by name in the report,
 * because the interesting question is not "what does a copier earn" but "what does a copier earn
 * in a room where copiers are common", and that second number only exists at a given mix. */
export interface StrategyMix {
  uniqueFast: number;
  uniqueSlow: number;
  copyFast: number;
  copySlow: number;
}

export const EvenMix: StrategyMix = {
  uniqueFast: 0.25,
  uniqueSlow: 0.25,
  copyFast: 0.25,
  copySlow: 0.25,
};

/** Half the room chasing the board, half writing their own: the mix a real room turns out to be
 * once somebody works out that copying is free. */
export const HalfCopyingMix: StrategyMix = {
  uniqueFast: 0.25,
  uniqueSlow: 0.25,
  copyFast: 0.125,
  copySlow: 0.125,
};

export const AllUniqueMix: StrategyMix = {
  uniqueFast: 0.25,
  uniqueSlow: 0.25,
  copyFast: 0,
  copySlow: 0,
};

export const AllCopyMix: StrategyMix = {
  uniqueFast: 0,
  uniqueSlow: 0,
  copyFast: 0.5,
  copySlow: 0.5,
};

export function profileOf(mix: StrategyMix, share: number): ProfileName {
  const order: [ProfileName, number][] = [
    ['Unique Fast', mix.uniqueFast],
    ['Unique Slow', mix.uniqueSlow],
    ['Copy Fast', mix.copyFast],
    ['Copy Slow', mix.copySlow],
  ];
  let draw = share;
  for (const [name, weight] of order) {
    if (draw < weight) return name;
    draw -= weight;
  }
  return order[order.length - 1][0];
}

export function strategyOf(profile: ProfileName): Strategy {
  return profile.startsWith('Copy') ? 'Copy' : 'Unique';
}

export function paceOf(profile: ProfileName): Pace {
  return profile.endsWith('Fast') ? 'Fast' : 'Slow';
}

/** The share of the writing clock a profile's author tends to take. Fast seats sit early in the
 * window and slow seats sit late, and the gap between them is the whole of the speed argument:
 * a slow unique answer and a fast copied one are the two things this tool exists to compare. */
export function biasFor(profile: ProfileName, params: BalanceParams): number {
  return paceOf(profile) === 'Fast' ? -params.paceBonus : params.paceBonus;
}
