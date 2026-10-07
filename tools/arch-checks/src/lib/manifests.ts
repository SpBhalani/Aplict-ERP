import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ModuleManifest } from '@platform/kernel';
import { moduleDirs } from './workspace';

export interface LoadedManifest {
  dir: string;
  folder: string;
  manifest?: ModuleManifest;
  error?: string;
}

export async function loadManifests(): Promise<LoadedManifest[]> {
  const out: LoadedManifest[] = [];
  for (const dir of moduleDirs()) {
    const folder = basename(dir);
    const file = join(dir, 'manifest.ts');
    if (!existsSync(file)) {
      out.push({ dir, folder, error: 'manifest.ts is missing' });
      continue;
    }
    try {
      const mod = (await import(pathToFileURL(file).href)) as { default?: ModuleManifest };
      if (!mod.default)
        out.push({ dir, folder, error: 'manifest.ts must default-export defineModule({...})' });
      else out.push({ dir, folder, manifest: mod.default });
    } catch (e) {
      out.push({
        dir,
        folder,
        error: e instanceof Error ? e.message.split('\n').slice(0, 6).join(' ') : String(e),
      });
    }
  }
  return out;
}
