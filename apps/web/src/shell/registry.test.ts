import { describe, expect, it } from 'vitest';
import { ShellRegistry } from './registry';

const Dummy = () => null;

describe('ShellRegistry', () => {
  it('returns only widgets for the asked slot', () => {
    const r = new ShellRegistry();
    r.addWidget({ slot: 'record.sidebar', component: Dummy });
    r.addWidget({ slot: 'dashboard', component: Dummy });
    expect(r.widgetsFor('record.sidebar')).toHaveLength(1);
  });
  it('refuses the same route twice', () => {
    const r = new ShellRegistry();
    r.addRoute({ path: '/x', component: Dummy });
    expect(() => r.addRoute({ path: '/x', component: Dummy })).toThrow(/twice/);
  });
});
