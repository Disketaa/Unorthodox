import type { BalanceParams } from './Params.ts';
import type { Formula } from './Formulas.ts';
import { playRoom } from './Simulation.ts';
import { EvenMix, Profiles } from './Strategies.ts';
import { seedOf } from './Random.ts';
import { writeFileSync } from 'node:fs';

/** The answer bank swept: how many distinct answers a round is drawn from, and how steeply the
 * popular ones are popular. Together they decide how often the room collides with itself, and a
 * collision is the one thing that costs a player the whole round. */
export interface SweepRow {
  answerBankSize: number;
  popularitySkew: number;
  playerCount: number;
  /** Share of submitted seat-rounds that landed on an answer somebody else had written, over the
   * whole room. Half of this is the copying profile rather than the bank. */
  duplicatePercent: number;
  /** The same, over the seats that write their own answers. This is the bank on its own, with
   * the room's habit of copying taken out. */
  ownDuplicatePercent: number;
  /** Share of played seat-rounds that scored nothing at all. */
  zeroRoundPercent: number;
  /** Mean final score, and how far apart a good seat and a poor one end up. */
  mean: number;
  spread: number;
  tiePercent: number;
  fastOverSlow: number;
}

function formulaOf(curve: 'Soft' | 'Linear'): Formula {
  return { shape: 'Bonus', curve, placement: 'SpeedOnly' };
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function quantile(sorted: readonly number[], share: number): number {
  if (sorted.length === 0) return 0;
  const at = Math.min(sorted.length - 1, Math.max(0, Math.round(share * (sorted.length - 1))));
  return sorted[at];
}

function runOne(
  params: BalanceParams,
  curve: 'Soft' | 'Linear',
  playerCount: number,
  bankSize: number,
  skew: number
): SweepRow {
  const shaped: BalanceParams = { ...params, mix: EvenMix, answerBankSize: bankSize, popularitySkew: skew };
  const totals: number[] = [];
  const byProfile = Profiles.map(() => [] as number[]);
  let duplicated = 0;
  let played = 0;
  let zeroRounds = 0;
  let ties = 0;
  let ownDuplicated = 0;

  for (let room = 0; room < params.roomsPerConfig; room += 1) {
    const result = playRoom(shaped, playerCount, params.roundCounts[0], formulaOf(curve), seedOf(params.seed, playerCount, bankSize, 31, room));
    totals.push(...result.totals);
    duplicated += result.duplicates;
    played += result.playedRounds;
    zeroRounds += result.zeroRounds;
    if (result.margin === 0) ties += 1;
    ownDuplicated +=
      (result.duplicatesByProfile.get('Unique Fast') ?? []).reduce((sum, value) => sum + value, 0) +
      (result.duplicatesByProfile.get('Unique Slow') ?? []).reduce((sum, value) => sum + value, 0);
    Profiles.forEach((profile, index) => {
      byProfile[index].push(...(result.totalsByProfile.get(profile) ?? []));
    });
  }

  const sorted = [...totals].sort((a, b) => a - b);
  const rooms = Math.max(1, params.roomsPerConfig);
  const rounds = params.roundCounts[0];
  // Half the seats under an even mix write their own answers, so their seat-rounds are half the
  // room's less the blank cards the model lays down.
  const ownSeatRounds = rooms * rounds * playerCount * 0.5 * (1 - params.blankRate);
  return {
    answerBankSize: bankSize,
    popularitySkew: skew,
    playerCount,
    duplicatePercent: Number(((duplicated / Math.max(1, played)) * 100).toFixed(1)),
    ownDuplicatePercent: Number(((ownDuplicated / Math.max(1, ownSeatRounds)) * 100).toFixed(1)),
    zeroRoundPercent: Number(((zeroRounds / Math.max(1, played)) * 100).toFixed(1)),
    mean: Number(mean(totals).toFixed(1)),
    spread: quantile(sorted, 0.9) - quantile(sorted, 0.1),
    tiePercent: Number(((ties / rooms) * 100).toFixed(1)),
    fastOverSlow: Number((mean(byProfile[0]) / Math.max(0.01, mean(byProfile[1]))).toFixed(2)),
  };
}

/** The banks worth a row: a narrow one where the room keeps colliding and a wide one where almost
 * every answer is unique, with the skew between those two crossed over the room sizes that decide
 * whether a collision is likely at all. */
const Banks = [16, 32, 64, 128];
const Skews = [0.6, 0.9, 1.3];

export function runSweep(params: BalanceParams, curve: 'Soft' | 'Linear'): void {
  const rows: SweepRow[] = [];
  for (const bankSize of Banks) {
    for (const skew of Skews) {
      for (const playerCount of params.playerCounts) {
        rows.push(runOne(params, curve, playerCount, bankSize, skew));
      }
    }
  }

  const lines = [
    `# Bank sweep (${curve})`,
    '',
    'How alike a room is, and what it costs. The bank is how many distinct answers a round is',
    'drawn from and the skew is how steeply the popular ones are popular; between them they',
    'decide how often the room collides with itself.',
    '',
    `Duplicate is the share of submitted seat-rounds that landed on an answer somebody else had`,
    `already written. 0-pt is the share of played seat-rounds that scored nothing. Rooms per row:`,
    `${params.roomsPerConfig}, rounds ${params.roundCounts[0]}, seed ${params.seed}.`,
    '',
    '| Bank | Skew | Players | Duplicate (room) | Duplicate (own) | 0-pt | Mean | Spread | Tie | Fast/Slow |',
    '| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows.map((row) =>
      [
        row.answerBankSize,
        row.popularitySkew,
        row.playerCount,
        `${row.duplicatePercent}%`,
        `${row.ownDuplicatePercent}%`,
        `${row.zeroRoundPercent}%`,
        row.mean,
        row.spread,
        `${row.tiePercent}%`,
        `${row.fastOverSlow}x`,
      ].join(' | ')
    ),
    '',
  ];

  const csv = [
    'answerBankSize,popularitySkew,players,duplicatePercent,ownDuplicatePercent,zeroRoundPercent,mean,spread,tiePercent,fastOverSlow',
    ...rows.map((row) =>
      [
        row.answerBankSize,
        row.popularitySkew,
        row.playerCount,
        row.duplicatePercent,
        row.ownDuplicatePercent,
        row.zeroRoundPercent,
        row.mean,
        row.spread,
        row.tiePercent,
        row.fastOverSlow,
      ].join(',')
    ),
  ].join('\n');

  writeFileSync('Tools/Balance/BankSweep.md', `${lines.join('\n')}\n`);
  writeFileSync('Tools/Balance/BankSweep.csv', `${csv}\n`);
  console.log(lines.join('\n'));
  console.log('Wrote Tools/Balance/BankSweep.md and Tools/Balance/BankSweep.csv');
}
