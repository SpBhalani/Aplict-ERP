import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
export const rel = (p: string): string => relative(ROOT, p).split('\\').join('/');

export const listDirs = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir).filter((d) => statSync(join(dir, d)).isDirectory() && !d.startsWith('.'))
    : [];

export const moduleDirs = (): string[] =>
  listDirs(join(ROOT, 'packages/modules')).map((d) => join(ROOT, 'packages/modules', d));
export const clientDirs = (): string[] =>
  listDirs(join(ROOT, 'clients')).map((d) => join(ROOT, 'clients', d));

/** All files under dir matching the predicate, skipping node_modules and build output. */
export function walk(dir: string, keep: (file: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'dist', 'coverage', '.nx'].includes(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p, keep));
    else if (keep(p)) out.push(p);
  }
  return out;
}

export const read = (p: string): string => readFileSync(p, 'utf8');

/** Map of Nx project name -> root folder, read from every project.json. */
export function projectRoots(): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of walk(ROOT, (p) => p.endsWith('project.json'))) {
    const json = JSON.parse(read(f)) as { name?: string };
    if (json.name) map.set(json.name, dirname(f));
  }
  return map;
}

export interface CheckResult {
  check: string;
  problems: string[];
}
