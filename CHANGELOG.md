# Rafik web change history

Update this file whenever further implementation changes land. Keep the companion backend ledger, architecture and verification records consistent. This is implemented change history, not the remaining-product backlog.

## R4 — Team and business operations · 23 September 2026

- Added optional Teams, Business and Support destinations under More. Solo entry/Today do not require team or commercial setup. Client Today surfaces pending enrollment/handoff decisions.
- Added real team creation/rename/closure, staff invitation/acceptance/role change/ownership transfer/removal, scoped roster, client consent/handoff, group create/rename/archive and reviewed bulk assignment. Shared plan import opens an independently editable plan; staff file access uses existing private Storage/downloads.
- Added `teams/commands.ts` and `CommandStatus.vue`: one account/screen-scoped exact command persisted before dispatch, visible retry after a lost acknowledgement, confirmed rejection releases the form. Team invite links are recovered from acknowledged command payloads and retained only on the initiating device.
- Added account state/event history and explicitly local owner-only provider simulation. Support cases include team/private audience selection, typed draft recovery, team-admin response and resolve/reopen. Added file-owner visibility/revocation of team grants, deletion preflight and R4 export data.
- Preserved existing Vue modules/design/language/theme conventions; added responsive team rows and controls, contextual errors and local preview buttons for Nour/Dalia. Generated database types updated from the new local schema.
- Added isolated fresh-identity browser fixtures, R4 workflow/failure checks and a reproducible 176-layout matrix. Architecture and maintenance instructions updated with the corresponding backend phase. The full revamp still requires R5 integrated readiness and later release/native gates.

## R3 — Broader service delivery · 22 September 2026

- Added the optional More hub and coach/client nutrition, appointment and resource routes. Preserved the existing visual system and primary training/coaching navigation. Client workspaces link to nutrition/appointments/resources; Today shows real bookings in the next seven days.
- Added manual meal recording, saved foods, correction/removal, per-relationship visibility, portion-scaled known nutrient totals and versioned coach guidance. Optional detail is collapsed; empty nutrition metrics are hidden. Client scope survives refresh through the route query.
- Added availability preview/publication, bounded weekly/fortnightly slots, timezone display, booking, rescheduling, cancellation/history and coach attendance. Pending calendar commands survive reload with their exact request IDs.
- Added real private file upload/download, recoverable pending uploads, explicit relationship sharing/revocation and recoverable deletion. Conversations support shared file attachments and show unavailable files after access is revoked. Account export includes all R3 tables; account deletion cleans owned bytes before deleting Auth data.
- Added nutrition calculation tests, six browser scenarios across Chromium/WebKit and a 128-layout R3 visual matrix. Query-only navigation now preserves input focus. Phone workspace navigation wraps to keep More visible, Safari selects retain touch-sized styling, and quick links reach entry forms without scrolling through records. Updated generated SQL types, bilingual errors, README and cross-repository maintenance docs.

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
