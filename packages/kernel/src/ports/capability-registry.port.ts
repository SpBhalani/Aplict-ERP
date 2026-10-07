import type { CapabilityContract, CapabilityHandler } from '@platform/contracts';

export type ProviderKind = 'module' | 'adapter' | 'fallback';

export interface CapabilityProvider<C extends CapabilityContract = CapabilityContract> {
  readonly contract: C;
  readonly kind: ProviderKind;
  readonly providerName: string;
  readonly handle: CapabilityHandler<C>;
}

/** Modules ask for a capability; the registry decides who answers (handbook chapter 5). */
export interface CapabilityRegistry {
  get<C extends CapabilityContract>(contract: C): CapabilityHandler<C>;
  has(contract: CapabilityContract): boolean;
}

export const CAPABILITY_REGISTRY = Symbol('CAPABILITY_REGISTRY');
