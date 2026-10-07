// PreToolUse (Bash): blocks shell commands that would bypass the gates.
// CI is still the backstop: no text check can catch every way of writing a command.
import { block, overrideOn, readInput } from './lib.mjs';

const cmd = String(readInput().tool_input?.command ?? '');

const rules = [
  [/--no-verify\b/, 'skipping git hooks is not allowed.'],
  [/\bgit\s+commit\b[^|;&]*\s-n\b/, 'skipping git hooks is not allowed.'],
  [/PLATFORM_ALLOW_PROTECTED/, 'the protected-path override is for humans only.'],
  [/\b(tests:lock|task:start|task:done|contracts:snapshot)\b/, 'this command is for humans only.'],
  [/\bgit\s+push\b[^|;&]*(--force\b|\s-f\b|--force-with-lease)/, 'force-pushing is not allowed.'],
  [
    /\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f|checkout\s+--\s)/,
    'destructive git commands need a human.',
  ],
  [/(^|[\s;&|])(npm|yarn)\s/, 'use pnpm only.'],
  [/\b(curl|wget)\b[^|]*\|\s*(sh|bash|zsh)\b/, 'piping downloads into a shell is not allowed.'],
];
for (const [re, msg] of rules) if (re.test(cmd)) block(msg);

const writes = String.raw`(sed\s+-i|tee\s|cp\s|mv\s|rm\s|>>?)`;
const rulePaths = String.raw`(\.claude/|\.github/|tools/|docs/architecture/|tests\.lock\.json|CLAUDE\.md|tasks/ACTIVE|eslint\.config\.mjs|nx\.json|lefthook\.yml)`;
if (new RegExp(`${writes}[^|;&]*${rulePaths}`).test(cmd))
  block('writing to rule or gate files from the shell is not allowed.');
if (!overrideOn() && new RegExp(`${writes}[^|;&]*packages/(kernel|contracts)/`).test(cmd))
  block('kernel/contracts changes need a kernel task started by the human.');
