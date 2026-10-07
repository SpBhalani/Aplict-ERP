// The walls of the architecture. A human-only file (protected path).
import nx from '@nx/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';

const publicApiOnly = {
  group: ['@platform/*/src/*', '@platform/*/src/**', '../../*/src/*'],
  message: 'Import another package only through its public API.',
};
const noQueue = { group: ['bullmq', 'bullmq/*'], message: 'Publish events through the kernel EventBus.' };
const noFrameworks = {
  group: ['@nestjs/*', 'drizzle-orm', 'drizzle-orm/*', 'pg', 'bullmq', 'ioredis', 'fastify'],
  message: 'domain/ and application/ talk to ports only, never to frameworks or the database.',
};

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.nx/**', '**/files/**'] },
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs', '**/*.js'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          allow: [],
          depConstraints: [
            { sourceTag: 'type:contracts', onlyDependOnLibsWithTags: ['type:contracts'] },
            { sourceTag: 'type:kernel', onlyDependOnLibsWithTags: ['type:contracts', 'type:kernel'] },
            { sourceTag: 'type:module', onlyDependOnLibsWithTags: ['type:contracts', 'type:kernel'] },
            { sourceTag: 'type:client', onlyDependOnLibsWithTags: ['type:contracts', 'type:kernel'] },
            { sourceTag: 'type:tool', onlyDependOnLibsWithTags: ['type:contracts', 'type:kernel', 'type:tool'] },
            { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['*'] },
          ],
        },
      ],
      'no-restricted-imports': ['error', { patterns: [publicApiOnly, noQueue] }],
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      'eslint-comments/no-unlimited-disable': 'off',
    },
  },
  {
    files: ['**/domain/**/*.ts', '**/application/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [publicApiOnly, noFrameworks] }] },
  },
  {
    files: ['packages/kernel/src/adapters/events/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [publicApiOnly] }] },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx'],
    plugins: { vitest },
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/expect-expect': 'error',
      'vitest/valid-expect': 'error',
    },
  },
  {
    // Rule-enforcement scripts may print to the console.
    files: ['tools/**/*.ts', '.claude/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
  prettier,
];
