import { DefaultParams, applyOverrides } from './Params.ts';
import type { BalanceParams } from './Params.ts';
import { allFormulas, formulaName } from './Formulas.ts';
import type { Formula, Shape, SpeedCurve, MultPlacement } from './Formulas.ts';
import { runConfig } from './Simulation.ts';
import type { ConfigResult } from './Simulation.ts';
import { analyse } from './Analysis.ts';
import type { MixRun } from './Analysis.ts';
import {
  AllCopyMix,
  AllUniqueMix,
  EvenMix,
  HalfCopyingMix,
} from './Strategies.ts';
import {
  renderComeback,
  renderCsv,
  renderEnchant,
  renderFormula,
  renderHeader,
  renderStrategies,
  renderVariance,
} from './Report.ts';
import { writeFileSync } from 'node:fs';



/** The shapes to run. `--shapes=Bonus` runs every curve and placement; `--shapes=Legacy` runs
 * the game as it stands today. Nothing given means all of them. */
function selectedFormulas(): Formula[] {
  const arg = process.argv.find((value) => value.startsWith('--shapes='));
  const all = allFormulas();
  if (arg === undefined) return all;
  const wanted = arg.slice('--shapes='.length).split(',');
  // A token naming a whole shape, `Soft/SpeedOnly`, is matched whole. Anything else is a curve
  // or a placement on its own and keeps the room: `--shapes=Soft` is all three of that curve.
  const exact = wanted.filter((token) => token.includes('/'));
  if (exact.length > 0) {
    return all.filter((formula) => {
      const name = formulaName(formula).replace(/\s+/g, '');
      return exact.some((token) => token.replace(/\s+/g, '') === name);
    });
  }
  const keepsShape = (shape: Shape): boolean => wanted.includes(shape);
  const keepsCurve = (curve: SpeedCurve): boolean => wanted.includes(curve);
  const keepsPlacement = (placement: MultPlacement): boolean => wanted.includes(placement);
  return all.filter((formula) => {
    if (formula.shape === 'Legacy') return keepsShape('Legacy');
    return keepsShape('Bonus') || keepsCurve(formula.curve) || keepsPlacement(formula.placement);
  });
}

/** The room mixes the strategy tables are run at. Even first: it is the one the other three
 * questions are asked against. */
const AllMixes: MixRun[] = [
  { name: 'Even', mix: EvenMix },
  { name: 'Half copying', mix: HalfCopyingMix },
  { name: 'All unique', mix: AllUniqueMix },
  { name: 'All copying', mix: AllCopyMix },
];

function selectedMixes(): MixRun[] {
  const arg = process.argv.find((value) => value.startsWith('--mixes='));
  if (arg === undefined) return AllMixes;
  const wanted = arg.slice('--mixes='.length).split(',');
  return AllMixes.filter((mix) => wanted.some((name) => mix.name.toLowerCase().startsWith(name.toLowerCase())));
}

const params: BalanceParams = applyOverrides(DefaultParams, process.argv.slice(2));

const formulas = selectedFormulas();
const results: ConfigResult[] = [];
for (const formula of formulas) {
  for (const playerCount of params.playerCounts) {
    for (const rounds of params.roundCounts) {
      results.push(runConfig(params, formula, playerCount, rounds));
    }
  }
}

const mixes = selectedMixes();
const analysisPlayerCount = params.playerCounts[params.playerCounts.length - 1];
const analysisRounds = params.roundCounts[params.roundCounts.length - 1];
const analyses = formulas.map((formula) => ({
  formula,
  bundle: analyse(params, formula, analysisPlayerCount, analysisRounds, mixes),
}));

const markdown = [
  renderHeader(params),
  ...formulas.map((formula) =>
    renderFormula(
      params,
      results.filter((result) => result.formula === formula)
    )
  ),
  '## Questions',
  '',
  `A, B and C are asked at ${analysisPlayerCount} players over ${analysisRounds} rounds, and D at the same size.`,
  '',
  ...analyses.flatMap(({ formula, bundle }) => [
    `### ${formulaName(formula)}`,
    '',
    renderEnchant(bundle, analysisPlayerCount, analysisRounds),
    '',
    renderComeback(bundle, analysisPlayerCount, analysisRounds),
    '',
    renderVariance(bundle, analysisPlayerCount, analysisRounds),
    '',
    renderStrategies(bundle, analysisPlayerCount, analysisRounds, mixes),
    '',
  ]),
].join('\n');

writeFileSync('Tools/Balance/Report.md', `${markdown}\n`);
writeFileSync('Tools/Balance/Report.csv', `${renderCsv(results)}\n`);
console.log(markdown);
console.log('\nWrote Tools/Balance/Report.md and Tools/Balance/Report.csv');
