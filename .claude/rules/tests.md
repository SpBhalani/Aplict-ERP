---
paths:
  - '**/*.test.ts'
  - '**/*.spec.ts'
  - '**/*.test.tsx'
---

# Tests

- Files listed in tests.lock.json are read-only. They define "done".
- Never use .only, .skip, todo or empty tests. Every test has an assertion.
- Domain tests use fake adapters, no database, no network.
- Each capability a module provides has a contract test using
  runCapabilityContract from @platform/contracts/testing; every provider
  must pass the same one.
- Database tests use Testcontainers PostgreSQL, never a shared database.
- Test names say the business rule: "rejects a revision after approval".
- Cover: happy path, invalid input, wrong company_id, duplicate event,
  capability missing (fallback used).
