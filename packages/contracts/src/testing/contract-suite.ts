import { describe, expect, it } from 'vitest';
import type { CapabilityContract, CapabilityHandler, CapabilityInput } from '../core';

export interface ContractCase<C extends CapabilityContract> {
  name: string;
  input: CapabilityInput<C>;
}

/**
 * The shared contract test every provider of a capability must pass:
 * our module, every adapter and the fallback. It checks the provider accepts
 * valid input and always answers in the contract's output shape.
 */
export function runCapabilityContract<C extends CapabilityContract>(
  contract: C,
  providerName: string,
  provider: CapabilityHandler<C>,
  cases: ContractCase<C>[],
): void {
  describe(`${contract.name}@v${contract.version} contract: ${providerName}`, () => {
    it('has at least one case', () => {
      expect(cases.length).toBeGreaterThan(0);
    });
    for (const c of cases) {
      it(`answers in the contract shape: ${c.name}`, async () => {
        expect(contract.input.safeParse(c.input).success).toBe(true);
        const out = await provider(c.input);
        const parsed = contract.output.safeParse(out);
        expect(parsed.success, parsed.success ? '' : String(parsed.error)).toBe(true);
      });
    }
  });
}
