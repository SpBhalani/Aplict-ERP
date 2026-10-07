/** Minimal YAML front-matter reader for task files: scalars and string lists only. */
export function parseFrontmatter(text: string): Record<string, string | string[]> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m?.[1]) return {};
  const out: Record<string, string | string[]> = {};
  let listKey: string | undefined;
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '');
    const item = /^\s+-\s+(.+)$/.exec(line);
    if (item?.[1] && listKey) {
      (out[listKey] as string[]).push(item[1].trim().replace(/^["']|["']$/g, ''));
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv?.[1]) continue;
    const value = (kv[2] ?? '').trim();
    if (value === '' || value === '[]') {
      out[kv[1]] = [];
      listKey = kv[1];
    } else {
      out[kv[1]] = value.replace(/^["']|["']$/g, '');
      listKey = undefined;
    }
  }
  return out;
}
