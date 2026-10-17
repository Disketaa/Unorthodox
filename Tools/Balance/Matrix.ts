import type { BalanceParams } from './Params.ts';
import type { Formula } from './Formulas.ts';
import { allFormulas, formulaName } from './Formulas.ts';
import { playRoom } from './Simulation.ts';
import { EvenMix, Profiles } from './Strategies.ts';
import { seedOf } from './Random.ts';
import { writeFileSync } from 'node:fs';

/** One line of the matrix: a scoring shape crossed with a duplicate rate and a connection
 * quality, at one room size and one game length. Everything the balance decision turns on is a
 * column here, so two rows can be read against each other without hunting through the report. */
export interface MatrixRow {
  shape: string;
  pairPoints: number;
  /** Share of seats whose answer arrives late, and by how much, as `share@ms`. */
  lag: string;
  playerCount: number;
  rounds: number;
  mean: number;
  spread: number;
  meanMargin: number;
  /** Share of rooms where first and second are level: a game with no single winner. */
  tiePercent: number;
  /** Share of rooms won by one point or less. */
  nearTiePercent: number;
  /** Share of played seat-rounds that scored nothing. */
  zeroRoundPercent: number;
  /** How much writing fast is worth, as a fast seat's mean over a slow seat's. */
  fastOverSlow: number;
  fastWinPercent: number;
  slowWinPercent: number;
  /** Share of the score variance the way a seat played explains, over all four profiles and so
   * comparable with the `C` section of the report. */
  strategyPercent: number;
  /** Played seat-rounds lost to a duplicated answer, and the ones lost to a blank card or a
   * muted card. Nearly all of the zeros are the first, which is the answer to where they come
   * from. */
  zeroFromDuplicatePercent: number;
  zeroFromOtherPercent: number;
}

/** The shapes worth a row: the game as it stands, then the four curves that are still in
 * contention. A row per curve and placement would be sixteen near-identical lines. */
function matrixShapes(): Formula[] {
  const wanted = ['Linear', 'Soft', 'Steep', 'Banded', 'Threshold', 'Rooted'];
  return allFormulas().filter(
    (formula) => formula.shape === 'Legacy' || (formula.shape === 'Bonus' && formula.placement === 'SpeedOnly' && wanted.includes(formula.curve))
  );
}

function quantile(sorted: readonly number[], share: number): number {
  if (sorted.length === 0) return 0;
  const at = Math.min(sorted.length - 1, Math.max(0, Math.round(share * (sorted.length - 1))));
  return sorted[at];
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function variance(values: readonly number[]): number {
  const centre = mean(values);
  return mean(values.map((value) => (value - centre) ** 2));
}

function round2(value: number): string {
  return value.toFixed(2);
}

function round1(value: number): string {
  return value.toFixed(1);
}

/** One row, played out over `roomsPerConfig` rooms on their own seeds. Everything is measured on
 * the same rooms for every row, so a difference between two rows is the setting and not luck. */
function runRow(
  params: BalanceParams,
  formula: Formula,
  pairPoints: number,
  lagShare: number,
  lagMs: number,
  playerCount: number,
  rounds: number
): MatrixRow {
  const withPair: BalanceParams = { ...params, mix: EvenMix, pairPoints };
  const lagged: BalanceParams = { ...withPair, laggingShare: lagShare, lagMs };
  const totals: number[] = [];
  const byProfile: number[][] = Profiles.map(() => []);
  const margins: number[] = [];
  let ties = 0;
  let nearTies = 0;
  let zeroRounds = 0;
  let otherZeroRounds = 0;
  let playedRounds = 0;
  let fastWins = 0;
  let slowWins = 0;

  for (let room = 0; room < params.roomsPerConfig; room += 1) {
    const seed = seedOf(params.seed, playerCount, rounds, 77, room);
    const result = playRoom(lagged, playerCount, rounds, formula, seed);
    totals.push(...result.totals);
    margins.push(result.margin);
    zeroRounds += result.zeroRounds;
    otherZeroRounds += result.otherZeroRounds;
    playedRounds += result.playedRounds;
    if (result.margin === 0) ties += 1;
    if (result.margin <= 1) nearTies += 1;
    Profiles.forEach((profile, index) => {
      byProfile[index].push(...(result.totalsByProfile.get(profile) ?? []));
    });
    fastWins += result.winsByProfile.get('Unique Fast') ?? 0;
    slowWins += result.winsByProfile.get('Unique Slow') ?? 0;
  }

  const sorted = [...totals].sort((a, b) => a - b);
  const grand = mean(totals);
  const fast = byProfile[0];
  const slow = byProfile[1];
  const fastMean = mean(fast);
  const slowMean = mean(slow);
  const between =
    byProfile.reduce(
      (sum, values) => sum + values.length * (mean(values) - grand) ** 2,
      0
    ) / Math.max(1, totals.length);

  return {
    shape: formulaName(formula),
    pairPoints,
    lag: lagMs === 0 ? 'none' : `${Math.round(lagShare * 100)}%@${lagMs}ms`,
    playerCount,
    rounds,
    mean: Number(round1(grand)),
    spread: quantile(sorted, 0.9) - quantile(sorted, 0.1),
    meanMargin: Number(round1(mean(margins))),
    tiePercent: Number(round1((ties / Math.max(1, params.roomsPerConfig)) * 100)),
    nearTiePercent: Number(round1((nearTies / Math.max(1, params.roomsPerConfig)) * 100)),
    zeroRoundPercent: Number(round1((zeroRounds / Math.max(1, playedRounds)) * 100)),
    zeroFromDuplicatePercent: Number(
      round1(((zeroRounds - otherZeroRounds) / Math.max(1, playedRounds)) * 100)
    ),
    zeroFromOtherPercent: Number(round1((otherZeroRounds / Math.max(1, playedRounds)) * 100)),
    fastOverSlow: Number(round2(fastMean / Math.max(0.01, slowMean))),
    fastWinPercent: Number(round1((fastWins / Math.max(1, params.roomsPerConfig)) * 100)),
    slowWinPercent: Number(round1((slowWins / Math.max(1, params.roomsPerConfig)) * 100)),
    strategyPercent: Number(round1((between / Math.max(0.01, variance(totals))) * 100)),
  };
}

/** The duplicate rates and connection qualities worth a row. Zero and one point is the whole
 * argument about a duplicated answer; no lag and a bad one is the whole argument about the
 * timer. */
const PairRates = [0, 1];
const Lags: [number, number][] = [
  [0, 0],
  [0.25, 1200],
];

function header(): string[] {
  return [
    '# Matrix',
    '',
    'Every row is a scoring shape crossed with what a duplicated answer pays and how bad the',
    'connection is. Rooms per row and seed are in `Params.ts`; every row meets the same rooms, so a',
    'difference between two rows is the setting.',
    '',
    'Legacy is the rule the game plays today and it always pays a pair its own point, so its Dup',
    'column is the same room twice and `Dup` does not apply to it. Every other shape pays a',
    'duplicate `pairPoints * mult`, which is 0 unless the column says otherwise.',
    '',
    '- **Tie** — rooms where first and second finished level. This is the number that decides',
    '  whether the final screen has one name on it.',
    '- **Gap 1** — rooms won by a point or less.',
    '- **0-pt** — played seat-rounds that scored nothing.',
    '- **Fast/Slow** — a fast unique writer over a slow one, as a ratio.',
    '- **Play%** — share of the score variance the way a seat played explains.',
    '',
  ];
}

function table(rows: readonly MatrixRow[]): string[] {
  const lines = [
    '| Shape | Dup | Lag | Players | Rounds | Mean | Margin | Tie | Gap 1 | 0-pt | of which dup | Fast/Slow | Fast win | Slow win | Play% |',
    '| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];
  for (const row of rows) {
    lines.push(
      [
        row.shape,
        row.shape === 'Legacy' ? 'n/a' : row.pairPoints,
        row.lag,
        row.playerCount,
        row.rounds,
        row.mean,
        row.meanMargin,
        `${row.tiePercent}%`,
        `${row.nearTiePercent}%`,
        `${row.zeroRoundPercent}%`,
        `${row.zeroFromDuplicatePercent}%`,
        `${round2(row.fastOverSlow)}x`,
        `${row.fastWinPercent}%`,
        `${row.slowWinPercent}%`,
        `${row.strategyPercent}%`,
      ].join(' | ')
    );
  }
  return lines;
}

function csv(rows: readonly MatrixRow[]): string {
  const keys: (keyof MatrixRow)[] = [
    'shape',
    'pairPoints',
    'lag',
    'playerCount',
    'rounds',
    'mean',
    'zeroFromDuplicatePercent',
    'zeroFromOtherPercent',
    'meanMargin',
    'tiePercent',
    'nearTiePercent',
    'zeroRoundPercent',
    'zeroFromDuplicatePercent',
    'zeroFromOtherPercent',
    'fastOverSlow',
    'fastWinPercent',
    'slowWinPercent',
    'strategyPercent',
  ];
  return [keys.join(','), ...rows.map((row) => keys.map((key) => String(row[key])).join(','))].join('\n');
}

export function runMatrix(params: BalanceParams): void {
  const rows: MatrixRow[] = [];
  for (const formula of matrixShapes()) {
    for (const pairPoints of PairRates) {
      for (const [lagShare, lagMs] of Lags) {
        for (const playerCount of params.playerCounts) {
          for (const rounds of params.roundCounts) {
            rows.push(runRow(params, formula, pairPoints, lagShare, lagMs, playerCount, rounds));
          }
        }
      }
    }
  }
  writeFileSync('Tools/Balance/Matrix.md', `${[...header(), ...table(rows)].join('\n')}\n`);
  writeFileSync('Tools/Balance/Matrix.csv', `${csv(rows)}\n`);
  console.log(table(rows).join('\n'));
  console.log('\nWrote Tools/Balance/Matrix.md and Tools/Balance/Matrix.csv');
}
