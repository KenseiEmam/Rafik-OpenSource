# Shared decisions log

Decisions that one contributor (or their agent) learned in a private conversation, but that the other contributor's agent must know. Chat history is private to each agent; this file is not.

**Add an entry in the same PR** when a founder or reviewer instruction changes scope, conventions, environment facts, or what not to do, and the other contributor could otherwise work against it. Examples: "Tasks needs no further polish", "pickers fetch only the five closest matches", "Vercel blocks deployments for commits by X".

- Standing rules for every agent belong in [`AGENTS.md`](../../AGENTS.md). Durable architectural tradeoffs belong in an [ADR](../decisions/README.md). This log is for the dated decision itself and links to those when they exist.
- Newest first. One line each: date · area · who decided · decision · source (PR, issue or comment link).
- Never record credentials, keys, private contact details or athlete data. This repository is public.
- `npm run coord:check` shows entries added on `main` since your branch started.

## Entries

- **2026-10-23 · Process · Sami** — Work in parallel through GitHub: open a draft PR at the start of each task, run `npm run coord:check` before starting and before pushing, record cross-cutting decisions here, use `[agent-note]` comments, and add a change note in `changes/` instead of editing `CHANGELOG.md` or the ledger. See the [coordination guide](coordination.md).
- **2026-10-22 · Web UI · Kensei (review on #139)** — People pickers and assignment search must scale to 1,000–2,000 athletes: fetch only the five closest matches, keep selected people in a separate list, and use a dialog for short focused choices such as choosing an athlete or replacing a plan. Source: [#139 review](https://github.com/Rafik-Athlete-Managment/Rafik-OpenSource/pull/139); rules in [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md).
- **2026-10-22 · Web UI · Kensei (review on #139)** — Editing panels grow with their content (a minimum height, never a fixed-height inner scroller). Source: [#139 review](https://github.com/Rafik-Athlete-Managment/Rafik-OpenSource/pull/139).
- **2026-10-22 · Data · existing rule** — Sample fixtures and seeds follow the one-role-per-membership rule; regenerate `prisma/seed.sql` from the fixtures, never edit it by hand. Source: [#139](https://github.com/Rafik-Athlete-Managment/Rafik-OpenSource/pull/139) (`bb0df03`).
