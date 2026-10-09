import { execSync, spawnSync } from 'node:child_process';
import { ROOT } from './lib/workspace';

/**
 * pnpm verify:quick: lint, typecheck and test the projects a change touches,
 * then run every architecture check. Works the same on Windows, macOS and Linux.
 */
const hasRef = (ref: string): boolean => {
  try {
    execSync(`git rev-parse --verify --quiet ${ref}`, { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};
const base = process.env['NX_BASE'] ?? (hasRef('origin/main') ? 'origin/main' : 'main');

const steps: [string, string[]][] = [
  [
    'pnpm',
    [
      'nx',
      'affected',
      '-t',
      'lint',
      'typecheck',
      'test',
      `--base=${base}`,
      '--output-style=static',
      '--parallel=3',
    ],
  ],
  ['pnpm', ['-s', 'arch:check']],
  ['pnpm', ['-s', 'contracts:check']],
  ['pnpm', ['-s', 'tests:verify-lock']],
];

// Never wait for interactive input: this runs inside git hooks and Claude Code hooks.
const env = { ...process.env, NX_TUI: 'false', NX_NO_CLOUD: 'true', NX_INTERACTIVE: 'false' };

for (const [cmd, args] of steps) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    console.error(`\nverify failed at: ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}
console.info('verify passed');
