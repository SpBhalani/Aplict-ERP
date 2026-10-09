import { describe, expect, it } from 'vitest';
import { newId } from './ids';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('newId', () => {
  it('returns a lowercase UUID string', () => {
    expect(newId()).toMatch(UUID);
  });

  it('marks the ID as version 7 with the RFC 4122 variant', () => {
    const id = newId();
    expect(id[14]).toBe('7');
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
  });

  it('puts the creation time in milliseconds in the first 48 bits', () => {
    const before = Date.now();
    const id = newId();
    const after = Date.now();
    const ts = parseInt(id.replace(/-/g, '').slice(0, 12), 16);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('1,000 IDs generated in a row are already in sorted order', () => {
    const ids = Array.from({ length: 1000 }, () => newId());
    expect(ids).toEqual([...ids].sort());
  });

  it('1,000 IDs generated in a row are all different', () => {
    const ids = Array.from({ length: 1000 }, () => newId());
    expect(new Set(ids).size).toBe(1000);
  });
});
