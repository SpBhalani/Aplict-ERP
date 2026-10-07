# Platform

Order-to-cash platform for manufacturers: a modular monolith with a kernel,
independent modules and per-client packages. This repository is the finished
**Part 1** of the Platform Playbook: workspace, walls, gates and the Claude Code
setup, all tested. There is no business code yet; that starts with Part 2.

## What's already done for you

| Piece                                                                                                       | Where                   | Status             |
| ----------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------ |
| Nx + pnpm monorepo, TypeScript strict                                                                       | root                    | ready              |
| `api` (NestJS on Fastify), `worker`, `web` (React + Vite + Mantine shell with UI slots)                     | `apps/`                 | ready, with tests  |
| `contracts`: capability and event definitions, shared contract-test suite                                   | `packages/contracts`    | ready, with tests  |
| `kernel`: manifest schema, capability registry, EventBus port, extension points, value types, client config | `packages/kernel`       | ready, with tests  |
| Module boundary rules (modules can't import each other, domain can't import frameworks, public API only)    | `eslint.config.mjs`     | tested             |
| 6 generators: module, capability, event, adapter, extension-point, client                                   | `tools/platform-tools`  | tested             |
| Architecture checks: package shape, manifests, providers, schemas, data types, module map                   | `tools/arch-checks`     | tested             |
| Contract freeze (`contracts:check`), test lock (`tests:lock`), task scope (`task:start`)                    | `tools/arch-checks`     | tested             |
| Commit guards: lint, format, commit message, verify before push                                             | `lefthook.yml`          | ready              |
| CI: all gates, protected-paths rule, optional Claude review                                                 | `.github/workflows`     | ready              |
| Claude Code: CLAUDE.md, 7 rules, settings and permissions, 6 hooks, 4 subagents, 10 skills                  | `CLAUDE.md`, `.claude/` | 24 hook tests pass |

## First-time setup (about 15 minutes)

You need: Node 22 or newer, Git, Docker, and Claude Code. Nothing else; the hooks are plain Node.

```bash
# 1. Install pnpm once (if you don't have it)
corepack enable            # or: npm install -g pnpm@9

# 2. Install everything (also installs the git hooks)
pnpm install

# 3. Prove everything works on your machine
pnpm nx run-many -t lint typecheck test
pnpm -s arch:check
pnpm -s hooks:test         # should print: all 24 hook checks passed

# 4. Local database and Redis (needed from the first kernel task on)
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
```

Then, once:

1. **Export the architecture docs** into `docs/architecture/` using the file
   names listed in `docs/architecture/README.md`.
2. **Push to GitHub** (private repo), then in GitHub: Settings -> Rules ->
   Rulesets -> new branch ruleset on `main`: require a pull request, require
   status checks `gates` and `protected-paths`, block force pushes.
3. **Replace `@your-github-handle`** in `.github/CODEOWNERS`.
4. **Optional Claude review on PRs:** run `claude` in the repo and type
   `/install-github-app`. Otherwise delete `.github/workflows/claude-review.yml`.
5. **Create the label** `architecture-change` in GitHub (Issues -> Labels).

Commit those changes yourself (they touch protected paths, so the PR needs the
`architecture-change` label and an ADR, or push them before turning on the ruleset).

## Daily commands

| Command                                          | What it does                                                                     | Who             |
| ------------------------------------------------ | -------------------------------------------------------------------------------- | --------------- |
| `pnpm -s verify:quick`                           | Lint, typecheck, test what changed, plus every architecture check                | anyone, Claude  |
| `pnpm nx g @platform/tools:module --name=quotes` | New module (also: `capability`, `event`, `adapter`, `extension-point`, `client`) | anyone, Claude  |
| `pnpm module-map`                                | Regenerate `docs/module-map.md`                                                  | anyone, Claude  |
| `pnpm task:start T-001` / `pnpm task:done`       | Set or clear the active task and its scope                                       | **humans only** |
| `pnpm tests:lock <project>`                      | Lock approved tests                                                              | **humans only** |
| `pnpm contracts:snapshot`                        | Freeze new contract versions                                                     | **humans only** |
| `PLATFORM_ALLOW_PROTECTED=1 claude`              | Start Claude for a kernel or contract task                                       | **humans only** |
| `pnpm -s hooks:test`                             | Re-test every Claude Code hook                                                   | anyone          |

## Starting the first piece of work

Follow Part 2 of the Playbook. In short:

```bash
# write docs/specs/<feature>/brief.md, then:
claude                       # Shift+Tab to Plan mode
> /plan-feature docs/specs/<feature>/brief.md
# approve, then for each task:
pnpm task:start T-001
claude
> /new-module <name>   or   /write-tests T-001
pnpm tests:lock module-<name>
claude
> /implement T-001
```

## Troubleshooting

| Problem                                                                            | Fix                                                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| A boundary error you expected doesn't appear, or one appears for a deleted project | `pnpm nx reset` (clears Nx's cached project graph), then lint again                              |
| `Cannot find package '@platform/...'` after creating a module by hand              | Don't create by hand; use the generator. If you must, run `pnpm install`                         |
| Claude says "BLOCKED: no active task"                                              | Run `pnpm task:start <id>` in your own terminal first                                            |
| Claude says a file is outside the task scope                                       | Correct: add it to the task file's `scope:` list and re-run `pnpm task:start`, or split the task |
| Commit refused by commitlint                                                       | Use a Conventional Commit message: `feat(quotes): add revisions`                                 |
| Files show as changed on Windows right after cloning                               | `.gitattributes` forces LF line endings; run `git add --renormalize .` once                      |
| Hooks don't run in Claude Code                                                     | In Claude, run `/hooks` to see them; make sure `node` is on your PATH                            |

## Notes on versions

TypeScript is pinned to `~6.0` because the lint tooling doesn't support
TypeScript 7 yet. ESLint is on 9 for the same reason. Upgrade both together
later, as a gates change with an ADR.
