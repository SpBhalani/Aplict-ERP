import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

const DB_PASSWORD = 'hunter2pass';
const JWT_SECRET = 'jwt-secret-value-that-must-stay-hidden-0123456789';

function valid(): Record<string, string | undefined> {
  return {
    DATABASE_URL: `postgres://app:${DB_PASSWORD}@db:5432/erp`,
    REDIS_URL: 'redis://localhost:6379',
    CLIENT: 'dev',
    PORT: '8080',
    JWT_SECRET,
    LOG_LEVEL: 'debug',
  };
}

function errorMessage(env: Record<string, string | undefined>): string {
  try {
    loadConfig(env);
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
  throw new Error('expected loadConfig to throw');
}

const REQUIRED = ['DATABASE_URL', 'REDIS_URL', 'CLIENT', 'JWT_SECRET'] as const;

describe('loadConfig', () => {
  it('returns typed settings for every key when the environment is complete', () => {
    const config = loadConfig(valid());
    expect(config).toEqual({
      DATABASE_URL: `postgres://app:${DB_PASSWORD}@db:5432/erp`,
      REDIS_URL: 'redis://localhost:6379',
      CLIENT: 'dev',
      PORT: 8080,
      JWT_SECRET,
      LOG_LEVEL: 'debug',
    });
    expect(typeof config.PORT).toBe('number');
  });

  it('uses port 3000 when PORT is not set', () => {
    const env = valid();
    delete env.PORT;
    expect(loadConfig(env).PORT).toBe(3000);
  });

  it('uses log level info when LOG_LEVEL is not set', () => {
    const env = valid();
    delete env.LOG_LEVEL;
    expect(loadConfig(env).LOG_LEVEL).toBe('info');
  });

  it.each(REQUIRED)('rejects start-up when required setting %s is missing', (key) => {
    const env = valid();
    delete env[key];
    expect(errorMessage(env)).toContain(key);
  });

  it.each(REQUIRED)('rejects an empty value for required setting %s', (key) => {
    const env = { ...valid(), [key]: '' };
    expect(errorMessage(env)).toContain(key);
  });

  it('rejects a PORT that is not a number', () => {
    expect(errorMessage({ ...valid(), PORT: 'abc' })).toContain('PORT');
  });

  it.each(['0', '65536', '-1'])('rejects a PORT outside 1-65535 (%s)', (port) => {
    expect(errorMessage({ ...valid(), PORT: port })).toContain('PORT');
  });

  it('rejects an unknown LOG_LEVEL', () => {
    expect(errorMessage({ ...valid(), LOG_LEVEL: 'verbose' })).toContain('LOG_LEVEL');
  });

  it('reports every bad key in one error and leaves out the valid ones', () => {
    const env: Record<string, string | undefined> = { ...valid(), PORT: 'abc', LOG_LEVEL: 'loud' };
    delete env.DATABASE_URL;
    delete env.JWT_SECRET;
    let calls = 0;
    let message = '';
    try {
      loadConfig(env);
    } catch (err) {
      calls += 1;
      message = err instanceof Error ? err.message : String(err);
    }
    expect(calls).toBe(1);
    for (const key of ['DATABASE_URL', 'JWT_SECRET', 'PORT', 'LOG_LEVEL']) {
      expect(message).toContain(key);
    }
    expect(message).not.toContain('REDIS_URL');
    expect(message).not.toContain('CLIENT');
  });

  it('never prints the JWT secret or the database password when other settings are invalid', () => {
    const message = errorMessage({ ...valid(), PORT: 'abc', LOG_LEVEL: 'loud', CLIENT: '' });
    expect(message).not.toContain(JWT_SECRET);
    expect(message).not.toContain(DB_PASSWORD);
  });

  it('never prints the database password when DATABASE_URL itself is invalid', () => {
    const message = errorMessage({ ...valid(), DATABASE_URL: `postgres//app:${DB_PASSWORD}@db` });
    expect(message).toContain('DATABASE_URL');
    expect(message).not.toContain(DB_PASSWORD);
  });

  it('never prints the JWT secret when JWT_SECRET itself is invalid (shorter than 32 characters)', () => {
    const shortSecret = 'tiny-secret-x';
    const message = errorMessage({ ...valid(), JWT_SECRET: shortSecret });
    expect(message).toContain('JWT_SECRET');
    expect(message).not.toContain(shortSecret);
  });
});
