import { describe, expect, it } from 'vitest';
import { parseFrontmatter } from './frontmatter';

describe('parseFrontmatter', () => {
  it('reads scalars and lists', () => {
    const fm = parseFrontmatter(
      '---\nid: T-001\nscope:\n  - packages/modules/x/\n  - docs/specs/y/\nstatus: planned   # comment\n---\nbody',
    );
    expect(fm).toEqual({
      id: 'T-001',
      scope: ['packages/modules/x/', 'docs/specs/y/'],
      status: 'planned',
    });
  });
  it('returns nothing without front matter', () => {
    expect(parseFrontmatter('# just a title')).toEqual({});
  });
});
