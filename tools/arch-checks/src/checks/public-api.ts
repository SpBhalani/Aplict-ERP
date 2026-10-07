import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { clientDirs, moduleDirs, rel, type CheckResult } from '../lib/workspace';

/** Every module and client package has the files the architecture requires. */
export function checkPackageShape(): CheckResult {
  const problems: string[] = [];
  for (const dir of moduleDirs()) {
    for (const f of [
      'manifest.ts',
      'src/public-api.ts',
      'project.json',
      'package.json',
      'ui/register.ts',
    ]) {
      if (!existsSync(join(dir, f)))
        problems.push(`${rel(dir)}: missing ${f} (create modules only with the generator)`);
    }
    for (const layer of ['domain', 'application', 'ports', 'adapters']) {
      if (!existsSync(join(dir, 'src', layer))) problems.push(`${rel(dir)}: missing src/${layer}/`);
    }
  }
  for (const dir of clientDirs()) {
    for (const f of ['client.json', 'project.json', 'package.json']) {
      if (!existsSync(join(dir, f))) problems.push(`${rel(dir)}: missing ${f}`);
    }
  }
  return { check: 'package-shape', problems };
}
