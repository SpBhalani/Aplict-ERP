import type { Tree } from '@nx/devkit';
import {
  appendExport,
  assertMatch,
  CAPABILITY,
  contractConst,
  contractFile,
} from '../../lib/naming';

export interface CapabilitySchema {
  name: string;
  version?: number;
  description?: string;
}

export default async function capabilityGenerator(tree: Tree, o: CapabilitySchema) {
  assertMatch(o.name, CAPABILITY, 'Capability name');
  const version = o.version ?? 1;
  const constName = contractConst(o.name, version);
  const file = contractFile(o.name, version);
  const path = `packages/contracts/src/capabilities/${file}.ts`;
  if (tree.exists(path))
    throw new Error(
      `${path} already exists. A published version is frozen: use --version=${version + 1}`,
    );
  tree.write(
    path,
    `import { z } from 'zod';
import { defineCapability } from '../core';

/** ${o.description ?? 'TODO: the business question this capability answers'} */
export const ${constName} = defineCapability({
  name: '${o.name}',
  version: ${version},
  description: '${(o.description ?? 'TODO: describe').replace(/'/g, "\\'")}',
  input: z.object({
    companyId: z.string().min(1),
  }),
  output: z.object({}),
});
`,
  );
  const index = 'packages/contracts/src/capabilities/index.ts';
  tree.write(
    index,
    appendExport(tree.read(index, 'utf-8') ?? '', `export { ${constName} } from './${file}';`),
  );
  return () =>
    console.info(
      `\nCreated ${path}. Fill input/output, then: pnpm contracts:snapshot && pnpm module-map`,
    );
}
