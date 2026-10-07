import { checkManifests } from './checks/manifests';
import { checkPackageShape } from './checks/public-api';
import { checkProviders } from './checks/providers';
import { checkSchemas } from './checks/schemas';
import { checkModuleMap } from './module-map';
import type { CheckResult } from './lib/workspace';

/** pnpm arch:check: runs every architecture check and prints only failures. */
const results: CheckResult[] = [
  checkPackageShape(),
  await checkManifests(),
  await checkProviders(),
  checkSchemas(),
  await checkModuleMap(),
];

const failed = results.filter((r) => r.problems.length > 0);
if (failed.length === 0) {
  console.info('arch:check passed');
} else {
  for (const r of failed) {
    console.error(`\n[${r.check}]`);
    for (const p of r.problems.slice(0, 20)) console.error(`  - ${p}`);
    if (r.problems.length > 20) console.error(`  ... and ${r.problems.length - 20} more`);
  }
  process.exit(1);
}
