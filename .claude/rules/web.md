---
paths:
  - 'apps/web/**'
  - 'packages/modules/*/ui/**'
  - 'clients/*/ui/**'
---

# Frontend

- A module's screens live in its ui/ folder and reach the shell only
  through ui/register.ts: addRoute, addMenuItem, addWidget(slot).
- Every page and widget is lazy-loaded with lazy(() => import(...)).
- Widgets read data only through their own module's API client, never
  another module's.
- Server data: TanStack Query. Forms: React Hook Form + the same Zod schema
  as the backend contract. Tables: TanStack Table with virtualised rows.
- UI components: Mantine only. Use Mantine props and theme tokens, not
  inline style objects for layout.
- Colours, spacing and fonts come from the theme, so each client can be
  themed without code changes.
- Every list paginates; every action shows loading and error states.
- Menu items and buttons check the user's permission, using the names
  from the module's manifest.
