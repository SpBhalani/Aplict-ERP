import { describe, expect, it } from 'vitest';
import { defineRule, defineHook, rejectWith, HookRejection } from './extension-points';

describe('extension points', () => {
  it('a rule carries its default implementation', () => {
    const price = defineRule<{ base: number }, number>('example.priceRule', (i) => i.base);
    expect(price.defaultImpl({ base: 10 })).toBe(10);
  });
  it('a hook is identified by name', () => {
    expect(defineHook<{ id: string }>('example.beforeApprove').name).toBe('example.beforeApprove');
  });
  it('rejectWith throws a HookRejection', () => {
    expect(() => rejectWith('no')).toThrow(HookRejection);
  });
});
