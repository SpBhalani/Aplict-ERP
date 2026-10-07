// Shared helpers for the Claude Code hooks. Plain Node: no jq, works on every OS.
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

export const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

export function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

/** Path relative to the repo root, always with forward slashes. */
export function relPath(file) {
  const abs = isAbsolute(file) ? file : resolve(ROOT, file);
  return relative(ROOT, abs).split('\\').join('/');
}

/** Exit code 2 blocks the tool call and shows the message to Claude. */
export function block(message) {
  process.stderr.write(`BLOCKED: ${message}\n`);
  process.exit(2);
}

export function readActive() {
  const file = resolve(ROOT, 'tasks/ACTIVE');
  if (!existsSync(file)) return undefined;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const get = (k) =>
    lines.filter((l) => l.startsWith(`${k}: `)).map((l) => l.slice(k.length + 2).trim());
  return { task: get('task')[0], file: get('file')[0], scope: get('scope') };
}

export const overrideOn = () => process.env.PLATFORM_ALLOW_PROTECTED === '1';

/** Files and folders only humans change (rules and gates). */
export const RULE_PATHS =
  /^(\.claude\/|\.github\/|tools\/|docs\/architecture\/|CLAUDE\.md$|tests\.lock\.json$|tasks\/ACTIVE$|eslint\.config\.mjs$|nx\.json$|lefthook\.yml$|packages\/contracts\/contracts\.snapshot\.json$)/;
export const CORE_PATHS = /^packages\/(kernel|contracts)\//;
