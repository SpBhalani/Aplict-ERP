import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

function isParsableUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const configSchema = z.object({
  DATABASE_URL: z.string().min(1).refine(isParsableUrl),
  REDIS_URL: z.string().min(1).refine(isParsableUrl),
  CLIENT: z.string().min(1),
  PORT: z.preprocess(
    (value) => (value === undefined ? '3000' : value),
    z.coerce.number().int().min(1).max(65535),
  ),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(LOG_LEVELS).optional().default('info'),
});

export type KernelConfig = z.output<typeof configSchema>;

/**
 * Fixed, non-secret descriptions for every configuration key. The error
 * message loadConfig throws is built only from this table, keyed by which
 * fields failed validation - never from the invalid value itself and never
 * from a validation library's default message text - so a bad DATABASE_URL
 * or JWT_SECRET can never leak a password or secret into logs.
 */
const DESCRIPTIONS: Record<string, string> = {
  DATABASE_URL: 'DATABASE_URL is required and must be a valid URL',
  REDIS_URL: 'REDIS_URL is required and must be a valid URL',
  CLIENT: 'CLIENT is required',
  PORT: 'PORT must be an integer between 1 and 65535',
  JWT_SECRET: 'JWT_SECRET is required and must be at least 32 characters long',
  LOG_LEVEL: 'LOG_LEVEL must be one of fatal, error, warn, info, debug, trace',
};

/**
 * Validates the process environment into typed kernel settings. Throws one
 * Error naming every invalid or missing key (and no valid ones) if the
 * environment does not pass validation.
 */
export function loadConfig(env: Record<string, string | undefined>): KernelConfig {
  const result = configSchema.safeParse(env);
  if (result.success) {
    return result.data;
  }

  const badKeys = new Set<string>();
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      badKeys.add(key);
    }
  }

  const details = Array.from(badKeys)
    .map((key) => DESCRIPTIONS[key] ?? `${key} is invalid`)
    .join('; ');
  throw new Error(`Invalid kernel configuration: ${details}`);
}
