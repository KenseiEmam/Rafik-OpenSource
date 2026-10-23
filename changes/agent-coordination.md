## Changelog

- Agent coordination for contributors working in parallel: `npm run coord:check` lists open PRs in this repository and the landing repository, flags overlap with your branch and between open PRs, shows what landed on `main` since your branch started, new decisions and `[agent-note]` comments. Adds a PR template, a shared decisions log, and per-PR change notes in `changes/` (compiled with `npm run changes:compile`) so PRs no longer conflict on `CHANGELOG.md` and the ledger.

## Ledger

- **23 October — Agent coordination:** Sami and Kensei work with separate agents. Added a protocol in `AGENTS.md` (draft PR at the start of a task, coordination check before starting and before pushing, decisions log, tagged agent notes), a dependency-free check script shared with rafik-landing, a PR template and per-PR change notes. No custom MCP server: GitHub is the shared record. A companion rafik-landing PR adds the same script and protocol. Not yet adopted by CI.
