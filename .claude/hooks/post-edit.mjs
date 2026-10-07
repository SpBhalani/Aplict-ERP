// PostToolUse (Edit|Write|MultiEdit): lints the edited file and shows Claude the first errors.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readInput, ROOT } from './lib.mjs';

const file = readInput().tool_input?.file_path;
if (!file || !/\.(ts|tsx|mjs)$/.test(file)) process.exit(0);
const eslint = resolve(ROOT, 'node_modules/eslint/bin/eslint.js');
const r = spawnSync(process.execPath, [eslint, '--max-warnings=0', '--format=unix', file], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (r.status === 0) process.exit(0);
const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split(/\r?\n/).slice(0, 20).join('\n');
process.stderr.write(`Lint errors in ${file}. Fix them before continuing:\n${out}\n`);
process.exit(2);
