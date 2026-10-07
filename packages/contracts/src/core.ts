import { z } from 'zod';

/** Capability names are business questions: "<area>.<question>", e.g. stock.checkLevel */
export const CAPABILITY_NAME = /^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$/;
/** Event names are past tense: "<module>.<something-happened>", e.g. quote.revision-approved */
export const EVENT_NAME = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/;

export interface CapabilityContract<
  I extends z.ZodType = z.ZodType,
  O extends z.ZodType = z.ZodType,
> {
  readonly kind: 'capability';
  readonly name: string;
  readonly version: number;
  readonly description: string;
  readonly input: I;
  readonly output: O;
}

export interface EventContract<P extends z.ZodType = z.ZodType> {
  readonly kind: 'event';
  readonly name: string;
  readonly version: number;
  readonly description: string;
  readonly payload: P;
}

export type AnyContract = CapabilityContract | EventContract;

export type CapabilityInput<C> =
  C extends CapabilityContract<infer I, z.ZodType> ? z.infer<I> : never;
export type CapabilityOutput<C> =
  C extends CapabilityContract<z.ZodType, infer O> ? z.infer<O> : never;
export type EventPayload<E> = E extends EventContract<infer P> ? z.infer<P> : never;

/** The function shape every provider (module, adapter or fallback) implements. */
export type CapabilityHandler<C extends CapabilityContract> = (
  input: CapabilityInput<C>,
) => Promise<CapabilityOutput<C>>;

function checkVersion(version: number): void {
  if (!Number.isInteger(version) || version < 1)
    throw new Error(`Contract version must be a positive integer, got ${version}`);
}

export function defineCapability<I extends z.ZodType, O extends z.ZodType>(
  c: Omit<CapabilityContract<I, O>, 'kind'>,
): CapabilityContract<I, O> {
  if (!CAPABILITY_NAME.test(c.name))
    throw new Error(`Capability name "${c.name}" must look like area.question`);
  checkVersion(c.version);
  return Object.freeze({ kind: 'capability', ...c });
}

export function defineEvent<P extends z.ZodType>(
  e: Omit<EventContract<P>, 'kind'>,
): EventContract<P> {
  if (!EVENT_NAME.test(e.name))
    throw new Error(`Event name "${e.name}" must look like module.something-happened`);
  checkVersion(e.version);
  return Object.freeze({ kind: 'event', ...e });
}

/** Every event travels in this envelope (handbook chapter 4). */
export function eventEnvelope<P extends z.ZodType>(payload: P) {
  return z.object({
    id: z.string().min(1),
    type: z.string().regex(EVENT_NAME),
    version: z.number().int().positive(),
    occurredAt: z.iso.datetime(),
    companyId: z.string().min(1),
    actor: z.string().min(1),
    correlationId: z.string().min(1),
    data: payload,
  });
}

export const contractKey = (c: AnyContract): string => `${c.kind}:${c.name}@v${c.version}`;
