import { existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFrontmatter } from './lib/frontmatter';
import { read, ROOT } from './lib/workspace';

const TASKS = join(ROOT, 'tasks');
const ACTIVE = join(TASKS, 'ACTIVE');
const [mode, id] = process.argv.slice(2);

if (mode === 'start') {
  if (!id) {
    console.error('usage: pnpm task:start <task-id>   (humans only)');
    process.exit(1);
  }
  const file = readdirSync(TASKS).find((f) => f.startsWith(`${id}-`) || f === `${id}.md`);
  if (!file) {
    console.error(`no task file tasks/${id}-*.md`);
    process.exit(1);
  }
  const fm = parseFrontmatter(read(join(TASKS, file)));
  const scope = Array.isArray(fm['scope']) ? fm['scope'] : [];
  if (scope.length === 0) {
    console.error(`tasks/${file} has no scope list in its front matter`);
    process.exit(1);
  }
  if (fm['status'] === 'done') {
    console.error(`tasks/${file} is already done`);
    process.exit(1);
  }
  const lines = [
    `task: ${id}`,
    `file: tasks/${file}`,
    ...scope.map((s) => `scope: ${s.endsWith('/') ? s : `${s}/`}`),
  ];
  writeFileSync(ACTIVE, `${lines.join('\n')}\n`);
  console.info(`active task: ${id}\n${lines.slice(2).join('\n')}\nNow start Claude Code: claude`);
} else if (mode === 'done') {
  if (existsSync(ACTIVE)) rmSync(ACTIVE);
  console.info('active task cleared. Set its status to done in the task file.');
} else {
  console.error('usage: task.ts start <id> | done');
  process.exit(1);
}
