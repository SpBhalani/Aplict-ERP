import { describe, expect, it } from 'vitest';
import { defineModule } from './manifest';

const base = { name: 'example', version: '0.1.0', kernel: '^0.1.0', description: 'test module' };

describe('defineModule', () => {
  it('accepts a minimal manifest and fills defaults', () => {
    const m = defineModule(base);
    expect(m.provides).toEqual([]);
    expect(m.ui.menu).toEqual([]);
  });
  it('rejects a required capability without a fallback', () => {
    expect(() =>
      defineModule({ ...base, requires: [{ capability: 'stock.checkLevel', version: 1 }] }),
    ).toThrow(/fallback/);
  });
  it('accepts an optional capability without a fallback', () => {
    expect(() =>
      defineModule({
        ...base,
        requires: [{ capability: 'stock.checkLevel', version: 1, optional: true }],
      }),
    ).not.toThrow();
  });
  it("rejects publishing another module's event", () => {
    expect(() =>
      defineModule({ ...base, publishes: [{ event: 'other.thing-happened', version: 1 }] }),
    ).toThrow(/own events/);
  });
  it('rejects permissions not prefixed with the module name', () => {
    expect(() => defineModule({ ...base, permissions: ['approve'] })).toThrow(/must start with/);
  });
});
