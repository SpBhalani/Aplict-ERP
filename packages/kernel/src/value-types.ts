/** Shared value types (handbook chapter 6). Modules never redefine these. */

/** Exact money: amount in minor units (paise, cents) as bigint, plus ISO currency. */
export interface Money {
  readonly minor: bigint;
  readonly currency: string;
}

export const money = (minor: bigint, currency: string): Money => {
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error(`Invalid currency ${currency}`);
  return { minor, currency };
};

export const addMoney = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) throw new Error(`Cannot add ${a.currency} to ${b.currency}`);
  return { minor: a.minor + b.minor, currency: a.currency };
};

/** A quantity always carries its unit. Value is a decimal string to stay exact. */
export interface Quantity {
  readonly value: string;
  readonly unit: string;
}

export type Id = string & { readonly __brand: 'Id' };
