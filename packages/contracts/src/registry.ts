import type { AnyContract } from './core';
import * as capabilities from './capabilities/index';
import * as events from './events/index';

const isContract = (v: unknown): v is AnyContract =>
  typeof v === 'object' && v !== null && 'kind' in v && 'name' in v && 'version' in v;

/** Every published contract. Used by contracts:check and the module map. */
export const allContracts: readonly AnyContract[] = [
  ...Object.values(capabilities),
  ...Object.values(events),
].filter(isContract);
