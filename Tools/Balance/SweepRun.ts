import { DefaultParams, applyOverrides } from './Params.ts';
import { runSweep } from './Sweep.ts';

const curve = process.argv.includes('--linear') ? 'Linear' : 'Soft';
runSweep(applyOverrides(DefaultParams, process.argv.slice(2)), curve);
