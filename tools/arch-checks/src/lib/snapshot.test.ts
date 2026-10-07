import { describe, expect, it } from 'vitest';
import { diffSnapshot } from './snapshot';
import { sha256 } from './hash';

describe('diffSnapshot', () => {
  it('reports added, changed and removed contracts', () => {
    const d = diffSnapshot({ a: 1, b: 2 }, { b: 3, c: 4 });
    expect(d).toEqual({ added: ['c'], changed: ['b'], removed: ['a'] });
  });
});

describe('sha256', () => {
  it('ignores Windows line endings', () => {
    expect(sha256('a\r\nb')).toBe(sha256('a\nb'));
  });
});
