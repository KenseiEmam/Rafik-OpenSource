# Revamp execution ledger

Updated 23 September 2026. **A working local web/backend foundation is implemented on `codex/revamp`; the full Rafik revamp is incomplete.** The user correctly rejected the narrow core as a complete replacement. R5 implementation and the latest verification appear below. Earlier phase entries retain their checkpoint context; use the current next action and R5 section for ongoing work. Read [revamp coverage and corrected execution scope](revamp-coverage.md) before continuing. The E01–E12 statuses below describe only the initial slice, not whole-product completion.

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

**Implemented locally. The complete revamp remains in progress; R2 ongoing coaching is also implemented locally (below); R3 is implemented locally; R4 is implemented locally below; R5 is recorded below; release gates remain open.** The first checkpoint was committed as backend `dc60441` and frontend `a6afdc3`, both on `codex/revamp`. No push was made.

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

**Implemented locally; the full revamp remains in progress.** R3 nutrition/booking/resources is implemented below; R4 is implemented locally below; R5 integrated readiness remains open. No hosting or native work was performed.

- Coach/client progress pages read completed actual sets, with date filters, explicitly separated strength/time/distance trends, normalized kg display and exact result lists. Single records are shown as first results, not artificial trends. Current-cycle schedule counts distinguish completed/in-progress/skipped/rest/outstanding; they are labelled as the current configuration, not a historical adherence claim.
- Optional client-owned weight/waist measurements support explicit units, personal or per-relationship sharing, correction and removal. Coach views expose only explicitly shared records.
- Reusable versioned check-in/assessment templates with 1–10 text/number/yes-no fields, ordering, required flags, units/bounds and recoverable editor drafts. One-off or 2–12 weekly/fortnightly assignments copy immutable questions/units. No conditional form engine or scheduler.
- Clients can save server/device drafts, submit and correct; corrections preserve original submission time and clear obsolete review. Coaches review a specific revision with feedback or cancel an unsubmitted occurrence. Compatible assessment results can be compared across occurrences of the same template revision.
- Participant inbox and persistent conversations, verified workout/response links, incoming unread counts, monotonic read cursors, latest-50/older paging and visible-page refresh. A dropped send acknowledgement persists the exact command for retry after reload. Assignment series have the same stable-request recovery. Confirmed validation rejections unlock correction instead of trapping the user in retry.
- Both Today pages link to real due/review/unread work. Client workspaces link to progress/check-ins/messages. Account export includes new domains. Seeded reflection/assessment/conversation examples are synthetic local-only fixtures; only additive rows were applied to the existing preview.
- Added a cross-repository [maintainer guide](maintainer-guide.md), root READMEs/changelogs and durable AGENTS instructions to update architecture/file/workflow/status/verification records with every future change, as explicitly requested by the user.

**Verification:** 93 rollback database assertions (27 core, 24 R1, 42 R2); all three migrations, synthetic fixtures and suites pass in a disposable database. Schema lint passes. Eight unit/data tests pass. The final full suite passes all 30 browser scenarios across Chromium and phone-sized WebKit, including ten R2 cases and all twenty foundation/R1 regressions. Render checks cover 224 existing route/width/language/theme combinations plus 176 populated R2 combinations, with no overflow/page errors and no violations in checked accessibility states. Final evidence is in `verification.md` and `evidence/r2-*`.

**Boundaries:** direct text conversation is implemented; file attachments and external notification delivery are not. Body measurements are optional, not health assessments or automatic advice. Assessment comparisons deliberately separate edited definitions. Forms/messages are recoverable drafts/commands, not a universal offline application. Hosting, physical-device behavior, real retention/payment and remote CI remain unverified.

**Next after R2:** R3 service delivery, now implemented below. R1 exercise alternatives/client substitutions were outstanding at this checkpoint and are implemented in R5 below.

## What changed

`RAFIK-FRONTEND` now contains the fresh Vue application, domain/persistence modules, generated API types, authored content, visual system, browser checks and production shell caching. Old source remains in Git at baseline `a0c723e`.

`rafik-api` now contains the fresh Supabase configuration, nine local migrations, explicit commands, fixtures, regression scenarios and implementation documentation. The audit and historical live-backend evidence remain under `docs/revival`; its old-source links refer to baseline `652e9ee`.

`rafik-mobile` remains at its original application content. `rafik-worker` is unchanged apart from its pre-existing `.DS_Store` modification. All four branches remain `codex/revamp`. The active backend/frontend now have local commits; nothing has been pushed.

## Current architecture, not a final feature ceiling

One responsive web application and one Supabase backend, now with 37 domain tables, one internal runtime setting and private Storage. No migration of old users, restored legacy database, configurable role/workspace hierarchy, automatic progression, AI/nutrition integrations, credit system, notification pipeline or native compatibility adapter. The local product provides an immediate useful sample and a complete coach-delivered training loop.

The earlier decision to treat the broad product inventory as merely optional was too restrictive. The corrected coverage register restores a broader execution backlog for clients, programming, progress, communication, nutrition, scheduling and teams. Simplify each useful job and its implementation; do not make its existence contingent on finding customers first. The initial manual plan-conversion pilot remains a service experiment; no automatic import is implemented.

## Current next action for Codex

1. R5 local implementation acceptance is complete: 46/46 final browser scenarios, 229 SQL assertions, fresh-install/HTTP/build/format/doc checks and the focused render review pass. Use the release checklist for the next stage; preserve all recorded local constraints.
2. Follow the shared contribution definition of done and quality rules in both AGENTS files. Preserve the accepted visual identity and explicit domain/state boundaries. Do not equate automated counts with human usability.
3. After local implementation acceptance, use the release checklist for physical-device/assistive-technology and new-project hosted operations. External notification/payment/calendar adapters require separate contracts and evidence. Native remains deferred.
4. Continue to update matching current documentation and historical evidence; never reuse the retired hosted backend, deploy synthetic fixtures, or push main.

Detailed source/operation contracts are in `architecture.md`, local/deployment instructions in `runbook.md`, content provenance in `content.md`, and business observation materials in `pilot.md`.

## R3 — Broader service delivery

**Implemented locally; the complete revamp remains in progress. R4 is implemented locally below; R5 follows below.** No hosting, native work or remote push was performed. Earlier R1 exercise alternatives/client substitutions were outstanding here and are implemented in R5 below.

- Optional nutrition: immutable coach guidance with effective dates and optional targets; reusable private foods; manual portion-based meal actuals, explicit personal/coach visibility, correction/removal and known-value summaries. No mandatory nutrition onboarding, food lookup provider, AI estimate or automatic prescription.
- Appointment delivery: up to eight concrete weekly/fortnightly availability slots, timezone preview and DST rules; client booking, participant rescheduling/cancellation, history and coach attendance. Locks protect both people across coach/client roles. Appointment attendance never completes a workout. Exact pending commands can be retried after a lost acknowledgement and reload.
- Private resources: real local Storage bytes, explicit shares, authenticated downloads, conversation attachments and revoked/unavailable states. Interrupted uploads and removals have visible recovery. No public upload URLs, expiring-link cache or orphan-prone SQL byte deletion. Files allow PDF/plain text/JPEG/PNG/WebP up to 10 MiB. Account export includes metadata; account deletion cleans owned bytes before Auth removal.
- More hub keeps optional tools out of the primary daily workflow. Both Today pages show real near-term appointments, and client workspaces link to relevant tools. English/Arabic, light/dark and responsive layouts retain the accepted design.
- Architecture remains one Vue app and one Supabase project; Storage is the only added local runtime service. Seven focused tables, explicit commands and small feature modules. Existing preview records were preserved. The [R3 contract](r3-contract.md), READMEs, changelogs and maintainer guide document the changes and recovery paths.

**Verification:** 135 rollback SQL assertions (42 new); all six migrations plus fixtures/suites pass in a disposable database. Real HTTP checks verify competing bookings, cross-role conflicts, private Storage access/overwrite protection/revocation/byte deletion and temporary-account cleanup. Thirty-six full browser scenarios pass across Chromium and phone-sized WebKit, including earlier phases; the six R3 scenarios were rerun after final UI adjustments. Ten unit/data tests, build/type checks, formatting and SQL lint pass. The 128-layout R3 matrix reports zero overflow/page errors and no accessibility violations in its 390px checks. See `verification.md` for files, exact scope and limits.

**Boundaries:** notification/reminder delivery, external calendar synchronization, payment collection, organization/group ownership, automatic food estimates and native devices are not part of R3. Resource records are currently person-owned; team ownership must be designed in R4. JSON export includes resource metadata; individual file downloads provide the bytes. There is no bundled account-file ZIP, malware scanner, resumable multipart upload or remote Storage deployment. Local browser success is not evidence of real retention, payments or physical-device readiness.

## R4 — Team and business operations

**Implemented locally; full revamp and release readiness remain incomplete. The subsequent R5 checkpoint is recorded below.** Work is on `codex/revamp` in both active repositories. The existing local preview was preserved; no hosting, real payment/delivery, mobile/worker source change or push was performed.

- Optional fixed-role teams with creation/rename, verified staff invitations, admin/coach changes, ownership transfer, safe departure and closure. Client enrollment is explicitly approved; a scoped roster does not grant access to private coaching notes, conversations or health/training records.
- Client-approved coach handoff copies current plan/schedule into independently owned new-coach records, archives the old relationship, cancels its future appointments/unanswered forms and preserves client history/started sessions. Exact decision retries cannot approve a newer proposal. Already-started workout creation can now be retried after a handoff/archive without creating another session.
- Named groups with create/rename/archive, explicit membership and reviewed atomic assignment to up to 50 of the acting coach's selected clients. Stable receipts prevent duplicate assignment on lost acknowledgements. Shared immutable plan snapshots create independently editable copies with owned exercise definitions. Explicit staff file sharing uses existing Storage, separate from client sharing; departed owners retain visibility/revocation of their own file grants.
- Separate personal/team commercial states, admission limits, service-only ordered provider receipts and a server-gated owner-only local simulator. No checkout, charges or external provider. Existing training/history/export/handoff remain accessible under restricted team state. Personal state remains observational, with no solo paywall.
- Local support cases with explicit private/team audience, recoverable typed drafts, acknowledged admin/operator reply and resolve/reopen. Guarded local CLI handles platform replies without external messaging. More keeps these tools optional; client Today surfaces pending consent. Added Nour and Dalia to the local preview switcher.
- New schema/feature modules, account deletion preflight/export, generated types, CI definition and maintained architecture/file/workflow documentation. One Vue app and one Supabase project remain the runtime; no new worker, store hierarchy, generalized permissions engine or provider service.

**Verification:** 209 rollback SQL assertions; eight-migration disposable database; nine real team/Storage/provider/support HTTP groups and all existing service checks; 40/40 full browser scenarios across Chromium/WebKit, ten unit tests, build/type/format and schema lint. The 176-layout matrix has no overflow/page errors and no Axe violations in 44 checked phone states. See the R4 section in `verification.md` for exact commands, the retry-test correction and limits. Earlier phases remain covered by the full regression suite. Local checks do not establish physical-device behavior, actual retention/payment, hosted operations or remote CI.

**Boundaries at the R4 checkpoint:** R5 recurring-product integration and R1 exercise choices were still pending, and are implemented below. Hosted provider/notification/calendar adapters and device/release checks remain later gates. Support is a single case/current response with revision, not threaded ticket messaging. Team material uses explicit staff publication; client sharing remains per relationship. Handoff does not copy old private conversations, measurements, meal history or coach notes. No universal offline support is claimed for team administration.

## R5 — Product quality, engineering handoff and exercise choice

**Implemented and verified locally: 46/46 final browser scenarios, 229 SQL assertions, nine-migration fresh install, real service/team checks, 128 focused layouts and build/type/format/doc checks pass.** See `verification.md` for evidence and limits. This checkpoint addresses the user's reported UX and documentation quality concerns before extending the remaining training flow. The broader release still has hosted/device/human-observation gates; no real payment/delivery, native/worker work, remote push or preview reset occurred.

- Conventional documentation index, contribution workflow/definition of done, architecture decisions, API conventions, release checklist and link-check script/CI step. Current architecture contradictions removed; both AGENTS files now require complete user journeys, real rendered review and synchronized documentation.
- Audited all implemented feature families via source, 52 baseline route/layout captures and existing lifecycle tests. Rebuilt Messages into a searchable bounded workspace with phone inbox/back navigation, reachable composer, optional attachments, scroll-aware unread behavior and correct post-send focus. Kept stable send retry/drafts/private contextual files.
- Prioritized the client's workout before optional updates; bounded and searched check-in/template/plan/review lists; scheduling now provides a direct destination and clear results; corrected unselected nutrition and coach-resource copy plus team-invitation navigation. Findings and limits are in `product-quality-review.md`.
- Coach-approved same-kind exercise alternatives (up to three), immutable publication snapshots, durable client substitutions inside existing actual-entry commands, correct actual labels/previous-performance/progress, and independent cloning during shared-plan import/handoff. No extra state service or workflow engine.
- Additive migration 009 and 20 new rollback assertions; fresh-account browser coverage for long conversations, visible read cursors/drafts/focus, blocked-save alternative recovery and growing check-in lists. Full regression evidence and development failures are recorded honestly in verification.

**Remaining gates:** physical-device keyboard/touch/suspension and assistive technology; new hosted project's Auth/email/Storage/backup/CI operations; real external adapters if enabled; observed unaided user tasks and repeat use. Lists use complete authorized reads with bounded rendering, not server-side large-scale query pagination. Same-kind alternatives inherit targets and are explicit coach choices, not automatic recommendations.
