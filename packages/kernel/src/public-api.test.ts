import { describe, expect, it } from 'vitest';
import * as api from './public-api';

describe('kernel public API', () => {
  it.each(['loadConfig', 'runWithContext', 'currentContext', 'tryCurrentContext', 'newId'])(
    'exports %s as a function',
    (name) => {
      expect(typeof (api as Record<string, unknown>)[name]).toBe('function');
    },
  );
});
