import { execSync } from 'node:child_process';
import { generateFiles, joinPathFragments, type Tree } from '@nx/devkit';
import { assertMatch, KEBAB } from '../../lib/naming';

export interface ModuleSchema {
  name: string;
  description?: string;
}

export default async function moduleGenerator(tree: Tree, options: ModuleSchema) {
  assertMatch(options.name, KEBAB, 'Module name');
  const root = `packages/modules/${options.name}`;
  if (tree.exists(root)) throw new Error(`${root} already exists`);
  generateFiles(tree, joinPathFragments(__dirname, 'files'), root, {
    name: options.name,
    schema: options.name.replace(/-/g, '_'),
    description: options.description ?? 'TODO: describe this module',
    tmpl: '',
  });
  return () => {
    // Link the new workspace package so other tools can resolve it.
    execSync('pnpm install --prefer-offline', { cwd: tree.root, stdio: 'inherit' });
    console.info(
      `\nCreated ${root}. Next: fill manifest.ts from the approved spec, then run: pnpm module-map`,
    );
  };
}
