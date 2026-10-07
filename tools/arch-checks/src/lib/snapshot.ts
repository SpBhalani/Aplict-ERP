import { z } from 'zod';
import type { AnyContract } from '@platform/contracts';

export type Snapshot = Record<string, unknown>;

export const snapshotKey = (c: AnyContract): string => `${c.kind}:${c.name}@v${c.version}`;

export function describeContract(c: AnyContract): unknown {
  return c.kind === 'capability'
    ? {
        kind: c.kind,
        name: c.name,
        version: c.version,
        input: z.toJSONSchema(c.input),
        output: z.toJSONSchema(c.output),
      }
    : { kind: c.kind, name: c.name, version: c.version, payload: z.toJSONSchema(c.payload) };
}

export interface SnapshotDiff {
  added: string[];
  changed: string[];
  removed: string[];
}

/** A published version is frozen: any change to an existing entry is a breaking change. */
export function diffSnapshot(saved: Snapshot, current: Snapshot): SnapshotDiff {
  const added = Object.keys(current).filter((k) => !(k in saved));
  const removed = Object.keys(saved).filter((k) => !(k in current));
  const changed = Object.keys(current).filter(
    (k) => k in saved && JSON.stringify(saved[k]) !== JSON.stringify(current[k]),
  );
  return { added, changed, removed };
}
