import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { allContracts } from '@platform/contracts';
import { describeContract, diffSnapshot, snapshotKey, type Snapshot } from './lib/snapshot';
import { read, ROOT } from './lib/workspace';

const FILE = join(ROOT, 'packages/contracts/contracts.snapshot.json');
const saved: Snapshot = existsSync(FILE) ? (JSON.parse(read(FILE)) as Snapshot) : {};
const current: Snapshot = Object.fromEntries(
  allContracts.map((c) => [snapshotKey(c), describeContract(c)]),
);
const diff = diffSnapshot(saved, current);
const mode = process.argv[2];

if (diff.changed.length || diff.removed.length) {
  for (const k of diff.changed)
    console.error(`- ${k} changed. A published version is frozen: generate a new version instead.`);
  for (const k of diff.removed)
    console.error(
      `- ${k} was removed. Published versions are removed only in a planned major release (human edit + ADR).`,
    );
  process.exit(1);
}

if (mode === 'snapshot') {
  const next = Object.fromEntries(
    Object.entries({ ...saved, ...current }).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.info(diff.added.length ? `snapshotted: ${diff.added.join(', ')}` : 'no new contracts');
} else if (diff.added.length) {
  for (const k of diff.added)
    console.error(
      `- ${k} is new and not snapshotted: run pnpm contracts:snapshot in the contract task.`,
    );
  process.exit(1);
} else {
  console.info('contracts:check passed');
}
