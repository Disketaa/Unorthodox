import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BudgetBytes = 200 * 1024;

test('production JavaScript stays under the gzip budget', async () => {
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
    stdio: 'inherit',
  });

  const directory = join('dist', 'assets');
  const sizes = readdirSync(directory)
    .filter((file) => file.endsWith('.js'))
    .map((file) => {
      const raw = readFileSync(join(directory, file));
      return { file, raw: raw.length, gzip: gzipSync(raw).length };
    });
  const total = sizes.reduce((sum, entry) => sum + entry.gzip, 0);

  console.log(`\nBundle budget: ${total} / ${BudgetBytes} bytes gzip`);
  for (const entry of sizes) {
    console.log(`  ${entry.file}: ${entry.raw} raw, ${entry.gzip} gzip`);
  }

  expect(total).toBeLessThanOrEqual(BudgetBytes);
});
