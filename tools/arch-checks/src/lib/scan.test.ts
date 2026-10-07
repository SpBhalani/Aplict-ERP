import { describe, expect, it } from 'vitest';
import { dataTypeProblems, referencedSchemas, schemaNameFor, tablesWithoutCompanyId } from './scan';

describe('referencedSchemas', () => {
  it('finds Drizzle pgSchema names', () => {
    expect(referencedSchemas(`const s = pgSchema('quotes');`)).toEqual(['quotes']);
  });
  it('finds schema-qualified SQL references', () => {
    expect(referencedSchemas('SELECT * FROM orders.lines JOIN quotes.items ON 1=1')).toEqual([
      'orders',
      'quotes',
    ]);
  });
  it('turns kebab module names into schema names', () => {
    expect(schemaNameFor('quote-revisions')).toBe('quote_revisions');
  });
});

describe('dataTypeProblems', () => {
  it('flags floats and timestamps without time zone', () => {
    const p = dataTypeProblems(`price: real('price'), at: timestamp('at')`);
    expect(p).toHaveLength(2);
  });
  it('accepts timestamptz', () => {
    expect(dataTypeProblems(`at: timestamp('at', { withTimezone: true })`)).toEqual([]);
  });
});

describe('tablesWithoutCompanyId', () => {
  it('flags a table missing company_id', () => {
    expect(tablesWithoutCompanyId(`s.table('items', { id: uuid('id') })`)).toEqual(['items']);
  });
  it('accepts a table with company_id', () => {
    expect(
      tablesWithoutCompanyId(`s.table('items', { id: uuid('id'), companyId: uuid('company_id') })`),
    ).toEqual([]);
  });
});
