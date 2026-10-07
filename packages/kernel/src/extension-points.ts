/** Extension points: the only doors client code may use (handbook chapter 7). */

export interface HookContext {
  companyId: string;
  actor: string;
  /** Stop the action with a message shown to the user. */
  reject(message: string): never;
}

/** A before/after hook. Before-hooks may reject; after-hooks may only add work. */
export interface HookPoint<I> {
  readonly kind: 'hook';
  readonly name: string;
  readonly __input?: I;
}

/** A replaceable rule: a calculation or decision a client may swap for its own. */
export interface RulePoint<I, O> {
  readonly kind: 'rule';
  readonly name: string;
  readonly defaultImpl: (input: I) => O;
}

export function defineHook<I>(name: string): HookPoint<I> {
  return Object.freeze({ kind: 'hook', name });
}

export function defineRule<I, O>(name: string, defaultImpl: (input: I) => O): RulePoint<I, O> {
  return Object.freeze({ kind: 'rule', name, defaultImpl });
}

export const rejectWith = (message: string): never => {
  throw new HookRejection(message);
};

export class HookRejection extends Error {
  override readonly name = 'HookRejection';
}
