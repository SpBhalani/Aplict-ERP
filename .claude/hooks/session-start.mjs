// SessionStart: prints the active task's goal and next step. Output becomes context for Claude.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readActive, ROOT } from './lib.mjs';

const active = readActive();
if (!active) {
  console.log(
    'No active task. Planning (/plan-feature) is fine; for anything else ask the human to run: pnpm task:start <id>',
  );
  process.exit(0);
}
console.log(`Active task: ${active.task} | scope: ${active.scope.join(' ')}`);
const file = active.file && resolve(ROOT, active.file);
if (file && existsSync(file)) {
  const text = readFileSync(file, 'utf8');
  const section = (name) => {
    const m = new RegExp(`^## ${name}\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm').exec(text);
    return (m?.[1] ?? '').trim().split(/\r?\n/).filter(Boolean).slice(0, 6);
  };
  for (const l of section('Goal')) console.log(`Goal: ${l}`);
  for (const l of section('Next step')) console.log(`Next: ${l}`);
}
