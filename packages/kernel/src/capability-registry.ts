import { contractKey, type CapabilityContract, type CapabilityHandler } from '@platform/contracts';
import type { CapabilityProvider, CapabilityRegistry } from './ports/capability-registry.port';

/** Provider choice per capability for one client, e.g. { "stock.checkLevel@v1": "erp-adapter" }. */
export type ProviderSelection = Record<string, string>;

export class InMemoryCapabilityRegistry implements CapabilityRegistry {
  private readonly chosen = new Map<string, CapabilityProvider>();

  constructor(providers: CapabilityProvider[], selection: ProviderSelection) {
    const byKey = new Map<string, CapabilityProvider[]>();
    for (const p of providers) {
      const k = `${p.contract.name}@v${p.contract.version}`;
      byKey.set(k, [...(byKey.get(k) ?? []), p]);
    }
    for (const [k, list] of byKey) {
      const wanted = selection[k];
      const pick = wanted
        ? list.find((p) => p.providerName === wanted)
        : list.length === 1
          ? list[0]
          : undefined;
      if (wanted && !pick) throw new Error(`Provider "${wanted}" selected for ${k} does not exist`);
      if (!pick)
        throw new Error(
          `${k} has ${list.length} providers; choose one in the client's capabilities.yaml`,
        );
      this.chosen.set(contractKey(pick.contract), pick);
    }
  }

  has(contract: CapabilityContract): boolean {
    return this.chosen.has(contractKey(contract));
  }

  get<C extends CapabilityContract>(contract: C): CapabilityHandler<C> {
    const p = this.chosen.get(contractKey(contract));
    if (!p)
      throw new Error(
        `No provider for ${contractKey(contract)}. Every required capability needs a provider or fallback.`,
      );
    return p.handle as unknown as CapabilityHandler<C>;
  }
}
