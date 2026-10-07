/** Pure text scanners used by the checks; kept separate so they are unit-tested. */

export const schemaNameFor = (moduleName: string): string => moduleName.replace(/-/g, '_');

/** Schemas referenced by Drizzle pgSchema('x') calls and SQL "schema.table" references. */
export function referencedSchemas(source: string): string[] {
  const found = new Set<string>();
  for (const m of source.matchAll(/pgSchema\(\s*['"`]([a-zA-Z0-9_-]+)['"`]/g))
    if (m[1]) found.add(m[1]);
  const sql =
    /\b(?:from|join|into|update|table|references|schema)\s+"?([a-z_][a-z0-9_]*)"?\s*\.\s*"?[a-z_]/gi;
  for (const m of source.matchAll(sql)) if (m[1]) found.add(m[1].toLowerCase());
  return [...found];
}

/** Data-type rule breaches in Drizzle table definitions (handbook chapter 6). */
export function dataTypeProblems(source: string): string[] {
  const problems: string[] = [];
  if (/\b(real|doublePrecision)\s*\(/.test(source))
    problems.push(
      'floating-point column (use numeric or bigint minor units for money and quantities)',
    );
  for (const m of source.matchAll(/\btimestamp\s*\(([^)]*)\)/g)) {
    if (!/withTimezone\s*:\s*true/.test(m[1] ?? ''))
      problems.push('timestamp without { withTimezone: true }');
  }
  if (/\bserial\s*\(|\bbigserial\s*\(/.test(source)) problems.push('serial id (use UUIDv7)');
  return problems;
}

/** Tables defined with Drizzle that have no company_id column. */
export function tablesWithoutCompanyId(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(
    /\.table\(\s*['"`]([a-z0-9_]+)['"`]\s*,\s*\{([\s\S]*?)\}\s*[,)]/g,
  )) {
    if (m[1] && !/company_?[iI]d/.test(m[2] ?? '')) out.push(m[1]);
  }
  return out;
}
