import { execSync } from 'node:child_process';
import { generateFiles, joinPathFragments, type Tree } from '@nx/devkit';
import { assertMatch, KEBAB } from '../../lib/naming';

export interface ClientSchema {
  name: string;
}

export default async function clientGenerator(tree: Tree, o: ClientSchema) {
  assertMatch(o.name, KEBAB, 'Client name');
  const root = `clients/${o.name}`;
  if (tree.exists(root)) throw new Error(`${root} already exists`);
  generateFiles(tree, joinPathFragments(__dirname, 'files'), root, { name: o.name, tmpl: '' });
  return () => {
    // Link the new workspace package so other tools can resolve it.
    execSync('pnpm install --prefer-offline', { cwd: tree.root, stdio: 'inherit' });
    console.info(
      `\nCreated ${root}. List its modules and providers in client.json, then: pnpm arch:check`,
    );
  };
}
