import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isTestFile, sha256 } from './lib/hash';
import { projectRoots, read, rel, ROOT, walk } from './lib/workspace';

const FILE = join(ROOT, 'tests.lock.json');
type Lock = { files: Record<string, string> };
const lock: Lock = existsSync(FILE) ? (JSON.parse(read(FILE)) as Lock) : { files: {} };
const [mode, target] = process.argv.slice(2);

if (mode === 'lock') {
  if (!target) {
    console.error('usage: pnpm tests:lock <project-name or folder>   (humans only)');
    process.exit(1);
  }
  const dir = projectRoots().get(target) ?? resolve(ROOT, target);
  if (!existsSync(dir)) {
    console.error(`no project or folder "${target}"`);
    process.exit(1);
  }
  const files = walk(dir, isTestFile);
  if (files.length === 0) {
    console.error(`no test files found in ${rel(dir)}`);
    process.exit(1);
  }
  for (const f of files) lock.files[rel(f)] = sha256(read(f));
  lock.files = Object.fromEntries(
    Object.entries(lock.files).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(FILE, `${JSON.stringify(lock, null, 2)}\n`);
  console.info(`locked ${files.length} test file(s) in ${rel(dir)}. Commit tests.lock.json now.`);
} else if (mode === 'verify') {
  const problems: string[] = [];
  for (const [f, h] of Object.entries(lock.files)) {
    const p = join(ROOT, f);
    if (!existsSync(p)) problems.push(`${f}: locked test was deleted`);
    else if (sha256(read(p)) !== h) problems.push(`${f}: locked test was changed`);
  }
  if (problems.length) {
    problems.forEach((p) => console.error(`- ${p}`));
    console.error(
      'Locked tests define "done". If a test is really wrong, a human re-locks it in a separate commit.',
    );
    process.exit(1);
  }
  console.info(`tests:verify-lock passed (${Object.keys(lock.files).length} locked files)`);
} else {
  console.error('usage: tests-lock.ts lock <project> | verify');
  process.exit(1);
}
