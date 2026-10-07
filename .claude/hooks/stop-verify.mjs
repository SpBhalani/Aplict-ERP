// Stop / SubagentStop: refuses to let Claude finish while checks fail.
import { spawnSync } from 'node:child_process';
import { readInput, ROOT } from './lib.mjs';

readInput();
const status = spawnSync('git', ['status', '--porcelain', '--', 'apps', 'packages', 'clients'], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (!status.stdout?.trim()) process.exit(0); // no code changed: nothing to verify

const r = spawnSync('pnpm', ['-s', 'verify:quick'], {
  cwd: ROOT,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
if (r.status === 0) process.exit(0);
const lines = `${r.stdout ?? ''}\n${r.stderr ?? ''}`.split(/\r?\n/);
const important = lines.filter((l) => /error|FAIL|failed|✗|×|\[[a-z-]+\]|^\s+- /i.test(l));
const shown = (important.length ? important : lines.slice(-30)).slice(0, 30).join('\n');
process.stderr.write(`Not done yet: checks are failing. Fix these, then finish:\n${shown}\n`);
process.exit(2);
