// PreToolUse (Edit|Write|MultiEdit): blocks edits to tests locked in tests.lock.json.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { block, readInput, relPath, ROOT } from './lib.mjs';

const file = readInput().tool_input?.file_path;
const lockFile = resolve(ROOT, 'tests.lock.json');
if (!file || !existsSync(lockFile)) process.exit(0);
const rel = relPath(file);
const lock = JSON.parse(readFileSync(lockFile, 'utf8'));
if (lock.files && Object.hasOwn(lock.files, rel)) {
  block(
    `${rel} is a locked test. Locked tests are the spec: change the code so they pass. If you believe the test is wrong, stop and explain why to the human.`,
  );
}
