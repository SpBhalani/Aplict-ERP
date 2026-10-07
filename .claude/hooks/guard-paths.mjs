// PreToolUse (Edit|Write|MultiEdit|NotebookEdit): blocks edits outside the active task's scope,
// to rule and gate files, and to kernel/contracts unless a human started a kernel task.
import {
  block,
  CORE_PATHS,
  overrideOn,
  readActive,
  readInput,
  relPath,
  RULE_PATHS,
} from './lib.mjs';

const input = readInput();
const file = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
if (!file) process.exit(0);
const rel = relPath(file);

if (rel.startsWith('..')) block(`${file} is outside the repository.`);
if (RULE_PATHS.test(rel))
  block(
    `${rel} is a rule or gate file. Only humans change these (see "How the rules themselves change"). Stop and explain what you think should change.`,
  );
if (CORE_PATHS.test(rel) && !overrideOn())
  block(
    `${rel} is kernel/contracts code. It needs a kernel or contract task started by the human. Stop and explain the change you think is needed.`,
  );
if (/^(tasks\/|docs\/specs\/|docs\/adr\/)/.test(rel)) process.exit(0); // task notes, specs and ADR drafts

const active = readActive();
if (!active) block('no active task. Ask the human to run: pnpm task:start <id>');
if (active.scope.some((s) => rel.startsWith(s))) process.exit(0);
block(
  `${rel} is outside this task's scope (${active.scope.join(' ')}). If the task really needs it, stop and ask the human to re-scope or split the task.`,
);
