import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { clientConfigSchema, type ModuleManifest } from '@platform/kernel';
import { loadManifests } from '../lib/manifests';
import { clientDirs, read, rel, type CheckResult } from '../lib/workspace';

/** Every client: each required capability of its enabled modules has exactly one valid provider. */
export async function checkProviders(): Promise<CheckResult> {
  const problems: string[] = [];
  const manifests = new Map<string, ModuleManifest>();
  for (const m of await loadManifests()) if (m.manifest) manifests.set(m.folder, m.manifest);
  for (const dir of clientDirs()) {
    const where = rel(dir);
    const file = join(dir, 'client.json');
    if (!existsSync(file)) {
      problems.push(`${where}: client.json is missing`);
      continue;
    }
    const parsed = clientConfigSchema.safeParse(JSON.parse(read(file)));
    if (!parsed.success) {
      problems.push(
        `${where}/client.json: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`,
      );
      continue;
    }
    const cfg = parsed.data;
    const enabled = cfg.modules.map((name) => ({ name, m: manifests.get(name) }));
    for (const e of enabled)
      if (!e.m) problems.push(`${where}: enables unknown module "${e.name}"`);
    const provided = new Set(
      enabled.flatMap((e) => e.m?.provides.map((p) => `${p.capability}@v${p.version}`) ?? []),
    );
    const adapters = new Map(cfg.adapters.map((a) => [a.name, a]));
    for (const e of enabled) {
      for (const r of e.m?.requires ?? []) {
        const key = `${r.capability}@v${r.version}`;
        const choice = cfg.providers[key];
        if (!choice) {
          if (!r.optional && !provided.has(key))
            problems.push(
              `${where}: ${e.name} requires ${key}; set providers["${key}"] to "fallback", "own-module" or an adapter`,
            );
          continue;
        }
        if (choice === 'own-module' && !provided.has(key))
          problems.push(`${where}: ${key} set to own-module but no enabled module provides it`);
        if (choice !== 'own-module' && choice !== 'fallback') {
          const a = adapters.get(choice);
          if (!a)
            problems.push(
              `${where}: ${key} uses adapter "${choice}" that is not listed in adapters`,
            );
          else if (a.capability !== key)
            problems.push(`${where}: adapter "${choice}" provides ${a.capability}, not ${key}`);
          else if (!existsSync(join(dir, a.file)))
            problems.push(`${where}: adapter file ${a.file} does not exist`);
        }
      }
    }
  }
  return { check: 'providers', problems };
}
