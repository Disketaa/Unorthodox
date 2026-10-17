import { DefaultParams, applyOverrides } from './Params.ts';
import { runMatrix } from './Matrix.ts';

runMatrix(applyOverrides(DefaultParams, process.argv.slice(2)));
