import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineCapability } from '@platform/contracts';
import { InMemoryCapabilityRegistry } from './capability-registry';

const stock = defineCapability({
  name: 'stock.checkLevel', version: 1, description: 'stock level',
  input: z.object({ itemId: z.string() }), output: z.object({ available: z.number() }),
});
const own = { contract: stock, kind: 'module' as const, providerName: 'own-module', handle: async () => ({ available: 5 }) };
const fallback = { contract: stock, kind: 'fallback' as const, providerName: 'fallback', handle: async () => ({ available: 0 }) };

describe('InMemoryCapabilityRegistry', () => {
  it('uses the only provider when there is one', async () => {
    const r = new InMemoryCapabilityRegistry([own], {});
    expect(await r.get(stock)({ itemId: 'a' })).toEqual({ available: 5 });
  });
  it('uses the selected provider when there are several', async () => {
    const r = new InMemoryCapabilityRegistry([own, fallback], { 'stock.checkLevel@v1': 'fallback' });
    expect(await r.get(stock)({ itemId: 'a' })).toEqual({ available: 0 });
  });
  it('refuses to start when several providers exist and none is selected', () => {
    expect(() => new InMemoryCapabilityRegistry([own, fallback], {})).toThrow(/choose one/);
  });
  it('fails loudly when a capability has no provider', () => {
    const r = new InMemoryCapabilityRegistry([], {});
    expect(() => r.get(stock)).toThrow(/No provider/);
  });
});
