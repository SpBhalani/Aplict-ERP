import type { EventContract, EventPayload } from '@platform/contracts';

/** A database transaction handle. The outbox row is written inside it (handbook chapter 4). */
export interface TransactionHandle {
  readonly id: string;
}

export interface PublishContext {
  companyId: string;
  actor: string;
  correlationId: string;
}

/**
 * The only way modules publish events. The adapter writes an outbox row in the
 * same transaction as the module's change; a relay delivers it later with retries.
 * Modules never import the queue library directly.
 */
export interface EventBus {
  publish<E extends EventContract>(tx: TransactionHandle, event: E, data: EventPayload<E>, ctx: PublishContext): Promise<void>;
}

export const EVENT_BUS = Symbol('EVENT_BUS');
