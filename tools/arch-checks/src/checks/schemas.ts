import { basename, join } from 'node:path';
import {
  dataTypeProblems,
  referencedSchemas,
  schemaNameFor,
  tablesWithoutCompanyId,
} from '../lib/scan';
import { moduleDirs, read, rel, walk, type CheckResult } from '../lib/workspace';

const SYSTEM_SCHEMAS = new Set(['public', 'information_schema', 'pg_catalog', 'drizzle']);

/** A module touches only its own schema, and follows the data-type rules. */
export function checkSchemas(): CheckResult {
  const problems: string[] = [];
  for (const dir of moduleDirs()) {
    const own = schemaNameFor(basename(dir));
    const files = walk(join(dir), (p) => /\.(ts|sql)$/.test(p) && !/\.(test|spec)\.ts$/.test(p));
    for (const f of files) {
      const src = read(f);
      for (const s of referencedSchemas(src)) {
        if (s !== own && !SYSTEM_SCHEMAS.has(s))
          problems.push(`${rel(f)}: references schema "${s}"; a module may only use "${own}"`);
      }
      if (/[\\/](db|migrations)[\\/]/.test(f)) {
        for (const p of dataTypeProblems(src)) problems.push(`${rel(f)}: ${p}`);
        for (const t of tablesWithoutCompanyId(src))
          problems.push(`${rel(f)}: table "${t}" has no company_id column`);
      }
    }
  }
  return { check: 'schemas', problems };
}
