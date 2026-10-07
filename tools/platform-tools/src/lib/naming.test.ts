import { describe, expect, it } from 'vitest';
import { appendExport, contractConst, contractFile } from './naming';

describe('naming', () => {
  it('builds contract constant names', () => {
    expect(contractConst('stock.checkLevel', 1)).toBe('stockCheckLevelV1');
    expect(contractConst('quote.revision-approved', 2)).toBe('quoteRevisionApprovedV2');
  });
  it('builds contract file names', () => {
    expect(contractFile('stock.checkLevel', 1)).toBe('stock.check-level.v1');
  });
  it('replaces the placeholder export and never duplicates', () => {
    const once = appendExport('// header\nexport {};\n', "export { a } from './a';");
    expect(once).toBe("// header\nexport { a } from './a';\n");
    expect(appendExport(once, "export { a } from './a';")).toBe(once);
  });
});
