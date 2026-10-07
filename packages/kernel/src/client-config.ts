import { z } from 'zod';

/**
 * clients/<name>/client.json: which modules a client runs and who provides each capability.
 * providers maps "area.question@vN" to "own-module", "fallback" or an adapter name.
 */
export const clientConfigSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9-]*$/),
  core: z.string().min(1),
  modules: z.array(z.string()).default([]),
  providers: z
    .record(z.string().regex(/^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*@v\d+$/), z.string().min(1))
    .default({}),
  adapters: z
    .array(
      z.object({
        name: z.string().min(1),
        capability: z.string().regex(/@v\d+$/),
        file: z.string().min(1),
      }),
    )
    .default([]),
});

export type ClientConfig = z.output<typeof clientConfigSchema>;
