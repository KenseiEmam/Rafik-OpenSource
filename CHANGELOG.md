# Rafik web change history

Update this file whenever further implementation changes land. Keep the companion backend ledger, architecture and verification records consistent. This is implemented change history, not the remaining-product backlog.

## R2 — Ongoing coaching · 22 September 2026

- Added `src/features/ongoing/`: template editor; check-in/assessment assignment and history; draft/submission/correction/review screen; conversations; progress; contextual Today activity; shared module types and pure helpers.
- Added private routes for coach/client check-ins and response details, template editing, conversations and progress. Added navigation and client-workspace links without changing the approved visual direction. Workout review and response pages link to contextual conversation.
- Progress displays real completed exercise results with unit-aware trends and exact values, current-cycle schedule counts, and optional private/shared body measurements with correction/removal.
- Reusable forms support text, numeric and yes/no answers, optional units/bounds, ordered questions and required fields. Assigned snapshots survive template edits. Compatible assessment history stays separated by definition revision.
- Messages use persisted local send commands, server deduplication, unread summaries, bounded history loading and visible-page refresh. Failed acknowledgements can be retried after reload without another message. No outbound notification or attachment provider.
- Added server/device draft recovery, stale-edit recovery, archived-state handling, bilingual copy, phone layouts and light/dark styling. Account export now includes the five new domains.
- Regenerated SQL types; added pure trend/state tests and browser journeys for check-in review/correction, assessment comparison/cancellation, measurement sharing and dropped-message acknowledgement.
- Expanded READMEs and added this change history. The backend [maintainer guide](../rafik-api/docs/implementation/maintainer-guide.md) explains the full file map and development workflow. `AGENTS.md` now requires documentation updates with further work.

## R1 — Daily coaching · 22 September 2026 · `8097f0d`

Expanded the client workspace/roster lifecycle, custom exercise catalog, richer multiweek programming, assignment schedules, timed/distance/effort recording, per-set targets, group guidance, prior performance and coach actual-result review. Added regression and rendered checks while retaining the new visual system.

## Foundation · 22 September 2026 · `a6afdc3`

Rebuilt the web application in Vue 3/TypeScript with English/Arabic and light/dark support; useful public workout sample, local Auth/invitations, immutable published plans, durable workout logging/sync/recovery, coach review, account/help tools, tests and production shell caching. Old web source remains at `a0c723e`.

[Current status](../rafik-api/docs/implementation/ledger.md) · [Architecture](../rafik-api/docs/implementation/architecture.md) · [Runbook](../rafik-api/docs/implementation/runbook.md) · [Verification](../rafik-api/docs/implementation/verification.md)
