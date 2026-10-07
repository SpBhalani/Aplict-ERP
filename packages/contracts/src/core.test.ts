import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineCapability, defineEvent, eventEnvelope, contractKey } from './core';

describe('contract definitions', () => {
  it('accepts a business-question capability name', () => {
    const c = defineCapability({
      name: 'stock.checkLevel',
      version: 1,
      description: 'x',
      input: z.object({}),
      output: z.object({}),
    });
    expect(contractKey(c)).toBe('capability:stock.checkLevel@v1');
  });
  it('rejects a capability named after a module', () => {
    expect(() =>
      defineCapability({
        name: 'InventoryModuleApi',
        version: 1,
        description: 'x',
        input: z.object({}),
        output: z.object({}),
      }),
    ).toThrow();
  });
  it('rejects version 0', () => {
    expect(() =>
      defineEvent({ name: 'quote.approved', version: 0, description: 'x', payload: z.object({}) }),
    ).toThrow();
  });
  it('validates the event envelope', () => {
    const env = eventEnvelope(z.object({ recordId: z.string() }));
    const ok = env.safeParse({
      id: '1',
      type: 'quote.approved',
      version: 1,
      occurredAt: '2026-01-01T00:00:00Z',
      companyId: 'c',
      actor: 'u',
      correlationId: 'r',
      data: { recordId: 'r1' },
    });
    expect(ok.success).toBe(true);
  });
});
