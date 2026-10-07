import { describe, expect, it } from 'vitest';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import moduleGenerator from './module/generator';
import capabilityGenerator from './capability/generator';
import eventGenerator from './event/generator';
import adapterGenerator from './adapter/generator';
import extensionPointGenerator from './extension-point/generator';
import clientGenerator from './client/generator';

const withContracts = () => {
  const tree = createTreeWithEmptyWorkspace();
  tree.write('packages/contracts/src/capabilities/index.ts', '// generated\nexport {};\n');
  tree.write('packages/contracts/src/events/index.ts', '// generated\nexport {};\n');
  return tree;
};

describe('module generator', () => {
  it('creates every required file with correct tags', async () => {
    const tree = withContracts();
    await moduleGenerator(tree, { name: 'quotes' });
    for (const f of [
      'manifest.ts',
      'src/public-api.ts',
      'ui/register.ts',
      'src/domain/index.ts',
      'src/application/index.ts',
      'src/ports/index.ts',
      'src/adapters/db/index.ts',
      'src/manifest.test.ts',
    ]) {
      expect(tree.exists(`packages/modules/quotes/${f}`), f).toBe(true);
    }
    const project = JSON.parse(tree.read('packages/modules/quotes/project.json', 'utf-8') ?? '{}');
    expect(project.tags).toEqual(['type:module', 'scope:quotes']);
  });
  it('rejects names that are not kebab-case', async () => {
    await expect(moduleGenerator(withContracts(), { name: 'Quotes' })).rejects.toThrow();
  });
  it('refuses to overwrite an existing module', async () => {
    const tree = withContracts();
    await moduleGenerator(tree, { name: 'quotes' });
    await expect(moduleGenerator(tree, { name: 'quotes' })).rejects.toThrow(/already exists/);
  });
});

describe('capability and event generators', () => {
  it('creates a capability and exports it', async () => {
    const tree = withContracts();
    await capabilityGenerator(tree, { name: 'stock.checkLevel' });
    expect(tree.exists('packages/contracts/src/capabilities/stock.check-level.v1.ts')).toBe(true);
    expect(tree.read('packages/contracts/src/capabilities/index.ts', 'utf-8')).toContain(
      'stockCheckLevelV1',
    );
  });
  it('refuses to overwrite a published version', async () => {
    const tree = withContracts();
    await capabilityGenerator(tree, { name: 'stock.checkLevel' });
    await expect(capabilityGenerator(tree, { name: 'stock.checkLevel' })).rejects.toThrow(/frozen/);
  });
  it('creates an event', async () => {
    const tree = withContracts();
    await eventGenerator(tree, { name: 'quote.revision-approved' });
    expect(tree.read('packages/contracts/src/events/index.ts', 'utf-8')).toContain(
      'quoteRevisionApprovedV1',
    );
  });
});

describe('adapter, extension-point and client generators', () => {
  it('creates a client and an adapter with its contract test', async () => {
    const tree = withContracts();
    await capabilityGenerator(tree, { name: 'stock.checkLevel' });
    await clientGenerator(tree, { name: 'client-a' });
    await adapterGenerator(tree, {
      capability: 'stock.checkLevel',
      target: 'erp',
      project: 'client-a',
    });
    expect(
      tree.exists(
        'clients/client-a/src/adapters/capabilities/erp-stock.check-level.v1.adapter.test.ts',
      ),
    ).toBe(true);
  });
  it('refuses an adapter for a capability that does not exist', async () => {
    const tree = withContracts();
    await clientGenerator(tree, { name: 'client-a' });
    await expect(
      adapterGenerator(tree, {
        capability: 'stock.checkLevel',
        target: 'erp',
        project: 'client-a',
      }),
    ).rejects.toThrow(/does not exist/);
  });
  it('creates a hook and exports it from the public API', async () => {
    const tree = withContracts();
    await moduleGenerator(tree, { name: 'quotes' });
    await extensionPointGenerator(tree, { module: 'quotes', name: 'beforeApprove' });
    expect(tree.read('packages/modules/quotes/src/public-api.ts', 'utf-8')).toContain(
      'beforeApprove',
    );
  });
});
