import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Who and which company a piece of work is for, carried across awaits
 * without being threaded through every function call.
 */
export interface RequestContext {
  companyId: string;
  actor: string;
  correlationId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Runs fn with ctx as the active request context, including inside any awaits it starts. */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/** Returns the active request context, or throws if called outside runWithContext. */
export function currentContext(): RequestContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error('No request context is active; call runWithContext first.');
  }
  return ctx;
}

/** Returns the active request context, or undefined if called outside runWithContext. */
export function tryCurrentContext(): RequestContext | undefined {
  return storage.getStore();
}
