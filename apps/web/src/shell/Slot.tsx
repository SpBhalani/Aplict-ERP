import { Suspense } from 'react';
import type { ShellRegistry } from './registry';

/** Renders every widget registered for a named slot. Pages keep working if a module is switched off. */
export function Slot({
  registry,
  name,
  context,
}: {
  registry: ShellRegistry;
  name: string;
  context?: Record<string, unknown>;
}) {
  return (
    <Suspense fallback={null}>
      {registry.widgetsFor(name).map((w, i) => {
        const Widget = w.component;
        return <Widget key={`${name}-${i}`} {...(context ?? {})} />;
      })}
    </Suspense>
  );
}
