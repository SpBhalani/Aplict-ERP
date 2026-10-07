import { z } from 'zod';

const kebab = /^[a-z][a-z0-9-]*$/;
const semver = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const capabilityRef = z.object({
  capability: z.string().min(3),
  version: z.number().int().positive(),
});
const eventRef = z.object({ event: z.string().min(3), version: z.number().int().positive() });

const requirement = capabilityRef.extend({
  optional: z.boolean().default(false),
  /** How the module copes when no provider exists: 'manual' (a task for a person), 'default' or a named fallback. */
  fallback: z.string().min(1).optional(),
});

export const manifestSchema = z
  .object({
    name: z.string().regex(kebab, 'module names are kebab-case'),
    version: z.string().regex(semver, 'version must be semver, e.g. 0.1.0'),
    kernel: z.string().min(1),
    description: z.string().min(1),
    provides: z.array(capabilityRef).default([]),
    requires: z.array(requirement).default([]),
    publishes: z.array(eventRef).default([]),
    subscribes: z.array(eventRef).default([]),
    ui: z
      .object({
        menu: z
          .array(
            z.object({
              label: z.string(),
              path: z.string().startsWith('/'),
              permission: z.string().optional(),
            }),
          )
          .default([]),
        widgets: z
          .array(z.object({ slot: z.string().min(1), component: z.string().min(1) }))
          .default([]),
      })
      .default({ menu: [], widgets: [] }),
    permissions: z.array(z.string()).default([]),
    settings: z
      .array(
        z.object({
          key: z.string(),
          type: z.enum(['string', 'number', 'boolean', 'json']),
          default: z.unknown(),
        }),
      )
      .default([]),
    records: z.array(z.string()).default([]),
    extensionPoints: z.array(z.string()).default([]),
    jobs: z.array(z.object({ name: z.string(), cron: z.string().optional() })).default([]),
  })
  .superRefine((m, ctx) => {
    m.requires.forEach((r, i) => {
      if (!r.optional && !r.fallback) {
        ctx.addIssue({
          code: 'custom',
          path: ['requires', i, 'fallback'],
          message: `required capability ${r.capability} needs a fallback`,
        });
      }
    });
    const own = (label: string, values: string[]) =>
      values.forEach((v, i) => {
        if (!v.startsWith(`${m.name}.`))
          ctx.addIssue({
            code: 'custom',
            path: [label, i],
            message: `"${v}" must start with "${m.name}."`,
          });
      });
    own('permissions', m.permissions);
    own('records', m.records);
    own('extensionPoints', m.extensionPoints);
    own(
      'settings',
      m.settings.map((s) => s.key),
    );
    own(
      'jobs',
      m.jobs.map((j) => j.name),
    );
    m.publishes.forEach((p, i) => {
      if (!p.event.startsWith(`${m.name}.`))
        ctx.addIssue({
          code: 'custom',
          path: ['publishes', i],
          message: `a module publishes only its own events (${m.name}.*)`,
        });
    });
  });

export type ModuleManifest = z.output<typeof manifestSchema>;
export type ModuleManifestInput = z.input<typeof manifestSchema>;

/** Every module's manifest.ts default-exports defineModule({...}). Invalid manifests throw at load time. */
export function defineModule(input: ModuleManifestInput): ModuleManifest {
  return manifestSchema.parse(input);
}
