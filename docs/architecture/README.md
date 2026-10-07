# Architecture documents

Claude Code and every developer read the architecture from this folder.
Export each tab of the two Claude Docs as Markdown (in each doc: tab menu ->
download -> Markdown) and save them here with exactly these names. The rules
in `.claude/rules/` point to these file names.

From **Modular Platform Architecture: How Modules Plug In**:

| Tab                                 | Save as                        |
| ----------------------------------- | ------------------------------ |
| Master document                     | `00-master.md`                 |
| 1 · The big idea                    | `01-big-idea.md`               |
| 2 · The kernel                      | `02-kernel.md`                 |
| 3 · Inside a module                 | `03-inside-a-module.md`        |
| 4 · How modules talk                | `04-how-modules-talk.md`       |
| 5 · Removing and replacing modules  | `05-removing-and-replacing.md` |
| 6 · Data in PostgreSQL              | `06-data.md`                   |
| 7 · Custom code per client          | `07-custom-code.md`            |
| 8 · Speed and AI                    | `08-speed-and-ai.md`           |
| 9 · The tech stack                  | `09-tech-stack.md`             |
| 10 · Deployment on your own servers | `10-deployment.md`             |

From **Platform Playbook: Working with Claude Code**:

| Tab                            | Save as              |
| ------------------------------ | -------------------- |
| Part 2 · Planning and building | `playbook-part-2.md` |

This folder is a protected path: changes need the `architecture-change`
label and an ADR (see docs/adr/).
