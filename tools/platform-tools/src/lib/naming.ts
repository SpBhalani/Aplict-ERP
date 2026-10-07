/** Shared naming rules so every generator names things the same way. */

export const KEBAB = /^[a-z][a-z0-9-]*$/;
export const CAPABILITY = /^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$/;
export const EVENT = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/;

const camel = (s: string): string =>
  s.replace(/[-_.]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase());

/** stock.checkLevel v1 -> stockCheckLevelV1 ; quote.revision-approved v2 -> quoteRevisionApprovedV2 */
export const contractConst = (name: string, version: number): string => `${camel(name)}V${version}`;

/** stock.checkLevel v1 -> stock.check-level.v1 */
export const contractFile = (name: string, version: number): string =>
  `${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}.v${version}`;

export function assertMatch(value: string, re: RegExp, what: string): void {
  if (!re.test(value)) throw new Error(`${what} "${value}" is not valid (${re})`);
}

/** Replace a lone "export {};" placeholder, then append the new export line once. */
export function appendExport(current: string, line: string): string {
  if (current.includes(line)) return current;
  const cleaned = current.replace(/^export \{\};\s*$/m, '').trimEnd();
  return `${cleaned}\n${line}\n`;
}
