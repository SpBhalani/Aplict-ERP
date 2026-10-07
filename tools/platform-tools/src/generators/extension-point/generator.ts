import type { Tree } from '@nx/devkit';
import { appendExport, assertMatch, KEBAB } from '../../lib/naming';

export interface ExtensionPointSchema {
  module: string;
  name: string;
  kind?: 'hook' | 'rule';
}

export default async function extensionPointGenerator(tree: Tree, o: ExtensionPointSchema) {
  assertMatch(o.module, KEBAB, 'Module');
  assertMatch(o.name, /^[a-z][a-zA-Z0-9]*$/, 'Extension point name');
  const root = `packages/modules/${o.module}`;
  if (!tree.exists(`${root}/manifest.ts`)) throw new Error(`${root} is not a module`);
  const full = `${o.module}.${o.name}`;
  const file = `${root}/src/extension-points/${o.name}.ts`;
  if (tree.exists(file)) throw new Error(`${file} already exists`);
  const Input = `${o.name.charAt(0).toUpperCase()}${o.name.slice(1)}Input`;
  tree.write(
    file,
    o.kind === 'rule'
      ? `import { defineRule } from '@platform/kernel';

/** Input given to client code. Keep it small and typed. */
export interface ${Input} {
  companyId: string;
}

/** Replaceable rule ${full}: clients may swap this calculation for their own. */
export const ${o.name} = defineRule<${Input}, unknown>('${full}', (input) => {
  void input;
  throw new Error('${full}: default implementation not written yet');
});
`
      : `import { defineHook } from '@platform/kernel';

/** Input given to client code. Keep it small and typed; never pass whole records. */
export interface ${Input} {
  companyId: string;
}

/** Hook ${full}: client code may run here, and a before-hook may reject. */
export const ${o.name} = defineHook<${Input}>('${full}');
`,
  );
  const api = `${root}/src/public-api.ts`;
  tree.write(
    api,
    appendExport(
      tree.read(api, 'utf-8') ?? '',
      `export { ${o.name}, type ${Input} } from './extension-points/${o.name}';`,
    ),
  );
  return () =>
    console.info(
      `\nCreated ${file}. Add '${full}' to manifest.extensionPoints, then: pnpm module-map`,
    );
}
