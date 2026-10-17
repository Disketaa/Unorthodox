import type { ConfigResult } from './Simulation.ts';
import type { BalanceParams } from './Params.ts';
import { describeFormula, formulaName } from './Formulas.ts';
import type { AnalysisBundle, MixRun } from './Analysis.ts';

function fixed(value: number, places = 1): string {
  return value.toFixed(places);
}

/** One markdown table per shape: the rows are room sizes crossed with round counts, and the
 * columns are what a balance decision is read off. Percentages are of the configuration's own
 * points, so the speed and like columns of two shapes can be compared directly. */
export function renderFormula(params: BalanceParams, results: readonly ConfigResult[]): string {
  const lines: string[] = [];
  lines.push(`## ${formulaName(results[0].formula)}`);
  lines.push('');
  lines.push(`${describeFormula(results[0].formula)}.`);
  lines.push('');
  lines.push('| Players | Rounds | Mean | Median | p10 | p90 | Max | Spread | Speed % | Likes % | Win margin | 0-pt rounds | Tie | Gap 1 |');
  lines.push('| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const result of results) {
    lines.push(
      [
        result.playerCount,
        result.rounds,
        fixed(result.mean),
        result.median,
        result.p10,
        result.p90,
        result.max,
        result.spread,
        `${fixed(result.speedSharePercent)}%`,
        `${fixed(100 - result.speedSharePercent)}%`,
        fixed(result.meanMargin),
        `${fixed(result.zeroRoundRate * 100)}%`,
        `${fixed(result.tieRatePercent)}%`,
        `${fixed(result.nearTieRatePercent)}%`,
      ].join(' | ')
    );
  }
  lines.push('');
  lines.push(
    `Rooms per row: ${params.roomsPerConfig}. Seed ${params.seed}. Percentiles are over every seat of every room.`
  );
  return lines.join('\n');
}

/** The same numbers as a CSV, for opening in a spreadsheet and sorting by hand. One file for all
 * shapes, with the shape as a column, because that is what a pivot table wants. */
export function renderCsv(results: readonly ConfigResult[]): string {
  const header = [
    'shape',
    'formula',
    'players',
    'rounds',
    'mean',
    'median',
    'p10',
    'p90',
    'max',
    'spread',
    'speedSharePercent',
    'likesSharePercent',
    'meanMargin',
    'medianMargin',
    'tieRatePercent',
    'nearTieRatePercent',
    'deadSeatRate',
    'zeroRoundRate',
  ];
  const rows = results.map((result) =>
    [
      formulaName(result.formula),
      describeFormula(result.formula),
      result.playerCount,
      result.rounds,
      fixed(result.mean, 2),
      result.median,
      result.p10,
      result.p90,
      result.max,
      result.spread,
      result.speedSharePercent,
      fixed(100 - result.speedSharePercent, 2),
      fixed(result.meanMargin, 2),
      result.medianMargin,
      fixed(result.tieRatePercent, 2),
      fixed(result.nearTieRatePercent, 2),
      fixed(result.deadSeatRate, 4),
      fixed(result.zeroRoundRate, 4),
    ].join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

/** A. Enchantments, read as point share against round share. */
export function renderEnchant(bundle: AnalysisBundle, players: number, rounds: number): string {
  const lines = [`#### A. Enchantments at ${players} players, ${rounds} rounds`, ''];
  lines.push('| Mult | Rounds | Round share | Points | Point share | Per seat-round | vs plain |');
  lines.push('| ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const row of bundle.enchant.rows) {
    lines.push(
      [
        `x${row.mult}`,
        row.rounds,
        `${fixed(row.roundSharePercent)}%`,
        row.points,
        `${fixed(row.pointSharePercent)}%`,
        fixed(row.perSeatRound, 2),
        `${fixed(row.againstPlain, 2)}x`,
      ].join(' | ')
    );
  }
  return lines.join('\n');
}

/** B. Comebacks, read off the cumulative totals at each checkpoint. */
export function renderComeback(bundle: AnalysisBundle, players: number, rounds: number): string {
  const lines = [`#### B. Comeback at ${players} players, ${rounds} rounds`, ''];
  lines.push(`Winner led after round 1 in ${fixed(bundle.comeback.finalWinnerWasFirstLeaderPercent)}% of rooms.`);
  lines.push('');
  lines.push('| After round | Leader changed | Mean gap 1st-2nd | Winner mean rank |');
  lines.push('| ---: | ---: | ---: | ---: |');
  for (const row of bundle.comeback.rows) {
    lines.push(
      [row.round, `${fixed(row.leaderChangedPercent)}%`, fixed(row.meanGap), fixed(row.winnerMeanRank)].join(' | ')
    );
  }
  return lines.join('\n');
}

/** C. The draw against the play. */
export function renderVariance(bundle: AnalysisBundle, players: number, rounds: number): string {
  const variance = bundle.variance;
  return [
    `#### C. Draw vs play at ${players} players, ${rounds} rounds`,
    '',
    `- Variance of a final score: ${fixed(variance.totalVariance, 1)}`,
    `- Explained by which way the seat played: ${fixed(variance.strategySharePercent)}%`,
    `- Left to the draw: ${fixed(variance.drawSharePercent)}%`,
  ].join('\n');
}

/** D. What each way of playing earns, at every mix asked for. */
export function renderStrategies(
  bundle: AnalysisBundle,
  players: number,
  rounds: number,
  mixes: readonly MixRun[]
): string {
  const lines = [`#### D. Ways of playing at ${players} players, ${rounds} rounds`, ''];
  lines.push('| Mix | Way of playing | Mean score | Win rate | Top 3 | Mean rank | Duplicated |');
  lines.push('| --- | --- | ---: | ---: | ---: | ---: | ---: |');
  bundle.strategies.forEach((analysis, index) => {
    const name = mixes[index]?.name ?? analysis.mixName;
    for (const row of analysis.rows) {
      lines.push(
        [
          name,
          row.profile,
          fixed(row.meanScore),
          `${fixed(row.winRatePercent)}%`,
          `${fixed(row.topThreeRatePercent)}%`,
          fixed(row.meanRank, 2),
          `${fixed(row.duplicateRatePercent)}%`,
        ].join(' | ')
      );
    }
  });
  return lines.join('\n');
}

/** The prose above the tables, so a reader knows what the numbers were run against before
 * reading any of them. */
export function renderHeader(params: BalanceParams): string {
  return [
    '# Balance',
    '',
    'Generated by `Tools/Balance/Balance.ts`. Every number below is a seeded simulation of a room,',
    'not a prediction: the answers, the speed and the likes are drawn, so the tables answer "what',
    'does this formula do to a room" and not "how will this room play".',
    '',
    'A duplicated answer scores nothing at all, under every shape, likes included. A muted card and',
    'a blank card likewise. A unique answer scores by the shape in its table.',
    '',
    '## Parameters',
    '',
    `- Rooms per configuration: ${params.roomsPerConfig}, seed ${params.seed}`,
    `- Writing window: ${params.writingMs / 1000}s, top of the speed scale ${params.speedMaxPoints} points, ${params.pointsPerLike} per like`,
    `- Rounds with no enchantment: ${params.unenchantedRate * 100}%, multipliers ${params.mults.join(', ')}`,
    `- Blank answers ${params.blankRate * 100}%, muted cards ${params.muteRate * 100}%, copied answers ${params.echoRate * 100}%`,
    `- Bank of ${params.answerBankSize} answers, popularity skew ${params.popularitySkew}`,
    `- Answers land between ${(params.speedLowShare * 100).toFixed(0)}% and ${((params.speedLowShare + params.speedSpread) * 100).toFixed(0)}% of the clock, plus or minus ${params.writerSpread * 100}% per player`,
    `- Likes: at most ${params.maxLikes} a card, given at ${(params.likeGenerosity * 100).toFixed(0)}% generosity`,
    '',
  ].join('\n');
}
