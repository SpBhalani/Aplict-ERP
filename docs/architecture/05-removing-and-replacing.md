# Chapter 5 · Removing and replacing modules

A module can be removed safely because nobody depends on the module; they depend on a **capability**, a business question with a fixed shape. When the module goes, an **adapter** or a **fallback** answers the same question instead.

## The idea in one picture: a wall socket

Your phone charger doesn't care whether the electricity comes from the power grid, a generator or a solar panel. It only cares that the socket gives the right voltage in the right shape. A capability is the socket. The module, the adapter and the fallback are three different power sources.

## The three kinds of provider

| Provider   | What it is                                       | When a client gets it                                             | Example                                                                    |
| ---------- | ------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Our module | The full feature, with its own data and screens  | The client buys and uses that module                              | Our stock module answers "check stock level" from our own tables           |
| Adapter    | A translator to a system the client already has  | The client keeps their own ERP or accounting system for that area | The adapter asks the client's ERP and converts the answer into our shape   |
| Fallback   | The simplest thing that keeps the system working | Neither of the above, or during onboarding                        | Always answer "assume available", or create a task for a person to confirm |

The adapter's translation job has a name: an **anti-corruption layer**. The client's system has its own names and shapes; the adapter converts them so they never leak into our code.

## In code: three classes, one interface

```typescript
// packages/contracts: the capability, owned by nobody in particular
export interface StockLevelCapability {
  checkLevel(itemId: string, siteId: string): Promise<{ available: number; unit: string }>;
}

// Provider 1: our module
class OwnStockLevel implements StockLevelCapability {
  /* reads our tables */
}

// Provider 2: adapter to the client's ERP
class ErpStockLevel implements StockLevelCapability {
  async checkLevel(itemId, siteId) {
    const raw = await this.erpClient.get(`/inventory/${this.map.item(itemId)}`);
    return { available: raw.qty_on_hand - raw.qty_reserved, unit: this.map.unit(raw.uom) };
  }
}

// Provider 3: fallback
class ManualStockLevel implements StockLevelCapability {
  async checkLevel() {
    return { available: Number.MAX_SAFE_INTEGER, unit: 'each' };
  } // "assume yes"
}
```

## Choosing the provider per client

Each client's configuration says which provider answers which capability:

```yaml
# clients/client-b/capabilities.yaml
stock.checkLevel: erp-adapter # this client keeps their ERP for stock
pricing.getPrice: own-module
tax.calculate: own-module
customer.creditHold: fallback # not used yet; always "not on hold"
```

At start-up the loader reads this file, checks every required capability has exactly one provider, and wires it in through NestJS dependency injection. If one is missing, the app refuses to start and says which capability is unprovided. Failing loudly at start is far better than failing quietly in the middle of a user's work.

## Step by step: switching a module off for a client

1. **List what it provided.** The loader reads the module's manifest: its capabilities and the events it publishes.
2. **Pick replacements.** In the client's configuration, point each capability to an adapter or fallback.
3. **Handle its events.** If the client's own system can tell us when things change (a webhook, or a file or database table we can check every few minutes), the adapter publishes the same events. If not, those events simply stop, and every listener was built to cope with silence.
4. **Switch it off.** Remove it from the client's module list. Its menu items, pages and widgets vanish from the UI; pages with its slots still render.
5. **Keep its data.** The module's schema is archived, not deleted, in case the client switches it back on.
6. **Run the client's tests.** The pipeline runs every contract test for that client before deploying (chapter 7).

## Required or optional?

In the manifest, each capability a module needs is marked:

- **Required:** the module cannot work without an answer. It must have a provider or a fallback, or the loader stops.
- **Optional:** the module works without it, just with less. For example, a screen shows extra information when a capability exists and hides that panel when it doesn't.

## Adding a module we never planned

The same rules work in reverse. A brand-new module, ours or written for one client, fits in as long as it has a manifest, offers and uses capabilities, publishes and listens to events, and keeps its own data. The rest of the system does not need to know it exists.

## Remember

- Depend on the question (capability), never on who answers it (module).
- Three possible answerers: our module, an adapter, a fallback. Exactly one per capability per client.
- The app refuses to start if a required capability has no provider.
