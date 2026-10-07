import { allContracts } from '@platform/contracts';
import { loadManifests } from '../lib/manifests';
import { rel, type CheckResult } from '../lib/workspace';

export async function checkManifests(): Promise<CheckResult> {
  const problems: string[] = [];
  const known = new Set(allContracts.map((c) => `${c.kind}:${c.name}@v${c.version}`));
  for (const m of await loadManifests()) {
    const where = rel(m.dir);
    if (m.error || !m.manifest) {
      problems.push(`${where}: ${m.error}`);
      continue;
    }
    const man = m.manifest;
    if (man.name !== m.folder)
      problems.push(`${where}: manifest name "${man.name}" must equal folder name "${m.folder}"`);
    for (const p of man.provides)
      if (!known.has(`capability:${p.capability}@v${p.version}`))
        problems.push(`${where}: provides unknown capability ${p.capability}@v${p.version}`);
    for (const r of man.requires)
      if (!known.has(`capability:${r.capability}@v${r.version}`))
        problems.push(`${where}: requires unknown capability ${r.capability}@v${r.version}`);
    for (const e of [...man.publishes, ...man.subscribes])
      if (!known.has(`event:${e.event}@v${e.version}`))
        problems.push(`${where}: unknown event ${e.event}@v${e.version}`);
  }
  return { check: 'manifests', problems };
}
