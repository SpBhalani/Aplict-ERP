import type { Tree } from '@nx/devkit';
import { appendExport, assertMatch, contractConst, contractFile, EVENT } from '../../lib/naming';

export interface EventSchema {
  name: string;
  version?: number;
  description?: string;
}

export default async function eventGenerator(tree: Tree, o: EventSchema) {
  assertMatch(o.name, EVENT, 'Event name');
  const version = o.version ?? 1;
  const constName = contractConst(o.name, version);
  const file = contractFile(o.name, version);
  const path = `packages/contracts/src/events/${file}.ts`;
  if (tree.exists(path))
    throw new Error(
      `${path} already exists. A published version is frozen: use --version=${version + 1}`,
    );
  tree.write(
    path,
    `import { z } from 'zod';
import { defineEvent } from '../core';

/** ${o.description ?? 'TODO: when this event is published'} Payload: IDs plus the few fields listeners need. */
export const ${constName} = defineEvent({
  name: '${o.name}',
  version: ${version},
  description: '${(o.description ?? 'TODO: describe').replace(/'/g, "\\'")}',
  payload: z.object({}),
});
`,
  );
  const index = 'packages/contracts/src/events/index.ts';
  tree.write(
    index,
    appendExport(tree.read(index, 'utf-8') ?? '', `export { ${constName} } from './${file}';`),
  );
  const owner = o.name.split('.')[0];
  return () =>
    console.info(
      `\nCreated ${path}. Fill the payload, add { event: '${o.name}', version: ${version} } to ${owner}'s manifest.publishes, then: pnpm contracts:snapshot && pnpm module-map`,
    );
}
