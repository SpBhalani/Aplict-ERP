import type { Tree } from '@nx/devkit';
import { assertMatch, CAPABILITY, contractConst, contractFile, KEBAB } from '../../lib/naming';

export interface AdapterSchema {
  capability: string;
  version?: number;
  target: string;
  project: string;
  kind?: 'module' | 'client';
}

export default async function adapterGenerator(tree: Tree, o: AdapterSchema) {
  assertMatch(o.capability, CAPABILITY, 'Capability name');
  assertMatch(o.target, KEBAB, 'Target');
  const version = o.version ?? 1;
  const constName = contractConst(o.capability, version);
  const contractPath = `packages/contracts/src/capabilities/${contractFile(o.capability, version)}.ts`;
  if (!tree.exists(contractPath))
    throw new Error(
      `Capability ${o.capability}@v${version} does not exist. Create it first in a contract task.`,
    );
  const root =
    (o.kind ?? 'client') === 'module' ? `packages/modules/${o.project}` : `clients/${o.project}`;
  if (!tree.exists(root)) throw new Error(`${root} does not exist`);
  const base = `${o.target}-${contractFile(o.capability, version)}`;
  const dir = `${root}/src/adapters/capabilities`;
  const providerName = `${o.target}-adapter`;
  const exportName = `${constName}From${o.target.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase())}`;
  tree.write(
    `${dir}/${base}.adapter.ts`,
    `import { ${constName}, type CapabilityHandler } from '@platform/contracts';
import type { CapabilityProvider } from '@platform/kernel';

/**
 * Provides ${o.capability}@v${version} from ${o.target}. Translate their names, units and errors
 * into ours here; nothing of theirs leaks out of this file (anti-corruption layer).
 */
const handle: CapabilityHandler<typeof ${constName}> = async (input) => {
  void input;
  throw new Error('${providerName}: not implemented yet');
};

export const ${exportName}: CapabilityProvider<typeof ${constName}> = {
  contract: ${constName},
  kind: 'adapter',
  providerName: '${providerName}',
  handle,
};
`,
  );
  tree.write(
    `${dir}/${base}.adapter.test.ts`,
    `import { ${constName} } from '@platform/contracts';
import { runCapabilityContract } from '@platform/contracts/testing';
import { ${exportName} } from './${base}.adapter';

// The shared contract test: the same one every provider of ${o.capability}@v${version} must pass.
// Add real cases (and a fake ${o.target} client) before implementing.
runCapabilityContract(${constName}, '${providerName}', ${exportName}.handle, []);
`,
  );
  return () =>
    console.info(
      `\nCreated ${dir}/${base}.adapter.ts and its contract test.` +
        ((o.kind ?? 'client') === 'client'
          ? `\nAdd to ${root}/client.json -> adapters: { "name": "${providerName}", "capability": "${o.capability}@v${version}", "file": "src/adapters/capabilities/${base}.adapter.ts" } and providers["${o.capability}@v${version}"] = "${providerName}"`
          : ''),
    );
}
