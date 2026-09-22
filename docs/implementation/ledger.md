# Revamp execution ledger

Updated 22 September 2026. **A working local web/backend foundation is implemented on `codex/revamp`; the full Rafik revamp is incomplete.** The user correctly rejected the narrow core as a complete replacement. Read [revamp coverage and corrected execution scope](revamp-coverage.md) before continuing. The E01–E12 statuses below describe only the initial slice, not whole-product completion.

| Unit | Status | Evidence / boundary |
|---|---|---|
| E01 Foundations | Implemented locally | Node/CLI/dependency pins, fresh Vite/Supabase configuration, synthetic reset, remote-link guard, generated types, CI definitions |
| E02 Minimal domain | Implemented and database-tested | Ten tables, explicit transactional commands, stable occurrences, immutable prescriptions, bounded values, unit/timezone rules, no orchestration triggers |
| E03 UI/UX | Initial slice implemented and visually inspected | Sample, basic client logging and basic coach tasks; Manrope/Noto Arabic; responsive light/dark/RTL; broader product surfaces remain missing |
| E04 Entry/Auth | Implemented and browser-tested | Useful public sample; email code in local test inbox; private verified invitation; guest work preserved and adopted after sign-in |
| E05 Durable recording | Implemented and fault-tested | IndexedDB writes, stable operation receipts, serial/cross-tab sync, offline recording, production shell cache, retry and explicit conflict recovery |
| E06 Plan/results correctness | Implemented and tested | Fixed publication revisions; started snapshots survive updates; actual set/note correction preserves completion; contextual feedback refreshes |
| E07 Coach work surface | Implemented core | Starter, duplicate/adapt, recoverable drafts, preview, publication, link invitation, explicit reassignment and actual-result review |
| E08 Content | Implemented | Eight bilingual exercises and two starter sessions, one canonical content source, generated seed/web outputs, documented asset provenance |
| E09 Necessary operations | Implemented locally | Truthful save states, bounded local diagnostics, help, data export/deletion, account settings; local mail only; no added worker/provider chain |
| E10 Verification | Local checks passed; physical-device/participant gates remain | See `verification.md` for exact browser/database/build coverage and WebKit offline-test method |
| E11 Hosting | Prepared, deferred | New-project release steps in `runbook.md`; no hosted project, deployment or old-backend change |
| E12 Usefulness/business observations | Materials prepared; not claimed as completed research | Demo, observation scripts, outcome ledger and iteration rules in `pilot.md`; no outreach/payments sent |
| Native app | Deferred as instructed | No application source changes |

## R1 — Daily coaching expansion

**Implemented locally. The complete revamp remains in progress; R2 ongoing coaching is also implemented locally (below); R3–R5 remain open.** The first checkpoint was committed as backend `dc60441` and frontend `a6afdc3`, both on `codex/revamp`. No push was made.

- Client workspace with private goals/constraints/notes, revision conflict checks and device draft recovery; overview, current plan/schedule and training history.
- Searchable active/archived roster and archive/reactivate commands. Archived relationships cannot start new assigned sessions; history and already started work remain usable.
- Exercise library with equipment/movement filters, private custom exercises, editing/retirement, bilingual instructions and optional HTTPS demonstration links. Fourteen authored shared exercises now cover strength, timed and distance examples. No media-upload service yet.
- Schema-2 plans: 1–12 cycle weeks, day offsets/rest days, exercise ordering, custom exercises, strength/time/distance prescriptions, optional RPE and per-set targets, and group labels. The logger guides consecutive groups and starts rest after the final exercise in a round. Publication captures exercise instructions.
- Client-specific flexible/cycle assignment with start/end dates, a bounded three-week coach schedule and two-week client schedule, skip/move/restore, and immutable started occurrences. Dates follow the client's timezone.
- Timed/distance actuals and effort extend the existing durable logger and correction/retry protocol. Previous performance is looked up per exercise. Coach review compares actuals with individual targets.
- Export includes the newly owned catalog, coaching context and schedule data. No additional runtime service, hosted provider or native dependency.

**Verification:** 51 rollback database assertions; both migrations + synthetic seed + both suites also pass in a disposable database without resetting the preview. Supabase schema lint passes. Twenty browser scenarios cover Chromium and phone-sized WebKit; 224 route/width/language/theme layouts have no overflow or page errors, with checked accessibility states passing. Build/type checks and five unit/data tests pass, including calendar-date and timezone boundary checks. See `verification.md` and the R1 evidence files for exact boundaries.

**Still outside R1:** exercise-alternative management/client substitutions, richer progression analytics, check-ins/assessments, conversations, nutrition, appointment booking, file uploads, organizations/teams and billing. The current cycle is a repeating training prescription, not an appointment calendar. Group guidance is explicit round navigation, not an automatic workout-completion engine. These limits must not be represented as a finished full revamp.

**Next after R1:** R2 ongoing coaching, now implemented below. Keep the corrected coverage register; finish each feature's backend, UI and failure states together.

## R2 — Ongoing coaching

**Implemented locally; the full revamp remains in progress.** R3 nutrition/booking/resources, R4 team/business operations and R5 integrated readiness remain open. No hosting or native work was performed.

- Coach/client progress pages read completed actual sets, with date filters, explicitly separated strength/time/distance trends, normalized kg display and exact result lists. Single records are shown as first results, not artificial trends. Current-cycle schedule counts distinguish completed/in-progress/skipped/rest/outstanding; they are labelled as the current configuration, not a historical adherence claim.
- Optional client-owned weight/waist measurements support explicit units, personal or per-relationship sharing, correction and removal. Coach views expose only explicitly shared records.
- Reusable versioned check-in/assessment templates with 1–10 text/number/yes-no fields, ordering, required flags, units/bounds and recoverable editor drafts. One-off or 2–12 weekly/fortnightly assignments copy immutable questions/units. No conditional form engine or scheduler.
- Clients can save server/device drafts, submit and correct; corrections preserve original submission time and clear obsolete review. Coaches review a specific revision with feedback or cancel an unsubmitted occurrence. Compatible assessment results can be compared across occurrences of the same template revision.
- Participant inbox and persistent conversations, verified workout/response links, incoming unread counts, monotonic read cursors, latest-50/older paging and visible-page refresh. A dropped send acknowledgement persists the exact command for retry after reload. Assignment series have the same stable-request recovery. Confirmed validation rejections unlock correction instead of trapping the user in retry.
- Both Today pages link to real due/review/unread work. Client workspaces link to progress/check-ins/messages. Account export includes new domains. Seeded reflection/assessment/conversation examples are synthetic local-only fixtures; only additive rows were applied to the existing preview.
- Added a cross-repository [maintainer guide](maintainer-guide.md), root READMEs/changelogs and durable AGENTS instructions to update architecture/file/workflow/status/verification records with every future change, as explicitly requested by the user.

**Verification:** 93 rollback database assertions (27 core, 24 R1, 42 R2); all three migrations, synthetic fixtures and suites pass in a disposable database. Schema lint passes. Eight unit/data tests pass. The final full suite passes all 30 browser scenarios across Chromium and phone-sized WebKit, including ten R2 cases and all twenty foundation/R1 regressions. Render checks cover 224 existing route/width/language/theme combinations plus 176 populated R2 combinations, with no overflow/page errors and no violations in checked accessibility states. Final evidence is in `verification.md` and `evidence/r2-*`.

**Boundaries:** direct text conversation is implemented; file attachments and external notification delivery are not. Body measurements are optional, not health assessments or automatic advice. Assessment comparisons deliberately separate edited definitions. Forms/messages are recoverable drafts/commands, not a universal offline application. Hosting, physical-device behavior, real retention/payment and remote CI remain unverified.

**Next:** implement R3 optional nutrition, appointment availability/booking/rescheduling and private resources. Define their ownership/unit/timezone/file lifecycle contracts first; extend the current web/backend modules without changing the accepted design or adding required signup complexity. Keep outstanding R1 alternative/substitution work visible in the coverage register and carry it into integrated readiness; do not silently label it shipped.

## What changed

`RAFIK-FRONTEND` now contains the fresh Vue application, domain/persistence modules, generated API types, authored content, visual system, browser checks and production shell caching. Old source remains in Git at baseline `a0c723e`.

`rafik-api` now contains the fresh Supabase configuration, three local migrations, explicit commands, fixtures, regression scenarios and implementation documentation. The audit and historical live-backend evidence remain under `docs/revival`; its old-source links refer to baseline `652e9ee`.

`rafik-mobile` remains at its original application content. `rafik-worker` is unchanged apart from its pre-existing `.DS_Store` modification. All four branches remain `codex/revamp`. The active backend/frontend now have local commits; nothing has been pushed.

## Current architecture, not a final feature ceiling

One responsive web application and one Supabase backend, now with seventeen domain tables. No migration of old users, restored legacy database, custom role/workspace hierarchy, automatic progression, AI/nutrition integrations, credit system, notification pipeline or native compatibility adapter. The local product provides an immediate useful sample and a complete coach-delivered training loop.

The earlier decision to treat the broad product inventory as merely optional was too restrictive. The corrected coverage register restores a broader execution backlog for clients, programming, progress, communication, nutrition, scheduling and teams. Simplify each useful job and its implementation; do not make its existence contingent on finding customers first. The initial manual plan-conversion pilot remains a service experiment; no automatic import is implemented.

## Next action for Codex

1. Continue with R3 in `revamp-coverage.md`: optional nutrition, booking and resources. Read the R1/R2 contracts and maintainer guide; do not restart the foundation or treat R2 as the full revamp.
2. Keep the visual direction the user likes. Extend real backend-backed tasks and recovery states, not just navigation or seeded screenshots. Record each capability as absent, partial, implemented or verified.
3. Complete integrated product and physical-device checks before declaring release readiness. Business observations remain separate evidence, not a substitute for missing features.
4. When moving beyond local-only work, follow the new-project hosted release gate. Never deploy synthetic Auth fixtures, reuse old credentials, or push main. Native stays deferred until the broader web/backend work is ready.

Detailed source/operation contracts are in `architecture.md`, local/deployment instructions in `runbook.md`, content provenance in `content.md`, and business observation materials in `pilot.md`.
