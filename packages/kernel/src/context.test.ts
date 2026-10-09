import { describe, expect, it } from 'vitest';
import { currentContext, runWithContext, tryCurrentContext } from './context';

const ctxA = { companyId: 'company-a', actor: 'user-a', correlationId: 'corr-a' };
const ctxB = { companyId: 'company-b', actor: 'user-b', correlationId: 'corr-b' };

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('request context', () => {
  it('makes companyId, actor and correlationId visible inside the context', () => {
    const seen = runWithContext(ctxA, () => currentContext());
    expect(seen).toEqual(ctxA);
  });

  it('returns what the function returns', async () => {
    expect(runWithContext(ctxA, () => 42)).toBe(42);
    await expect(runWithContext(ctxA, async () => 'done')).resolves.toBe('done');
  });

  it('keeps the context across awaits', async () => {
    const seen = await runWithContext(ctxA, async () => {
      await delay(1);
      await Promise.resolve();
      return currentContext();
    });
    expect(seen).toEqual(ctxA);
  });

  it('keeps the context inside timers started within it', async () => {
    const seen = await runWithContext(
      ctxA,
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(currentContext()), 5);
        }),
    );
    expect(seen).toEqual(ctxA);
  });

  it('keeps concurrent contexts apart', async () => {
    const [a, b] = await Promise.all([
      runWithContext(ctxA, async () => {
        await delay(20);
        return currentContext();
      }),
      runWithContext(ctxB, async () => {
        await delay(5);
        return currentContext();
      }),
    ]);
    expect(a).toEqual(ctxA);
    expect(b).toEqual(ctxB);
  });

  it('restores the outer context after a nested one finishes', () => {
    const result = runWithContext(ctxA, () => {
      const inner = runWithContext(ctxB, () => currentContext());
      return { inner, outer: currentContext() };
    });
    expect(result.inner).toEqual(ctxB);
    expect(result.outer).toEqual(ctxA);
  });

  it('leaves no context behind after the function finishes', async () => {
    runWithContext(ctxA, () => undefined);
    expect(tryCurrentContext()).toBeUndefined();
    await runWithContext(ctxA, async () => delay(1));
    expect(tryCurrentContext()).toBeUndefined();
    expect(() =>
      runWithContext(ctxA, () => {
        throw new Error('boom');
      }),
    ).toThrow('boom');
    expect(tryCurrentContext()).toBeUndefined();
  });

  it('currentContext() outside a context throws an error mentioning context', () => {
    expect(() => currentContext()).toThrow(/context/i);
  });

  it('tryCurrentContext() returns undefined outside and the context inside', () => {
    expect(tryCurrentContext()).toBeUndefined();
    expect(runWithContext(ctxA, () => tryCurrentContext())).toEqual(ctxA);
  });
});
