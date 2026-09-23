# Revamp execution ledger

Updated 23 September 2026. **R16 organization nutrition is implemented locally.** Phase commits remain on `codex/revamp`. Hosting, native, real providers, physical devices and observed human/business outcomes remain separate gates.

## R16 — Organization nutrition and shared food diary

Organization admins and assigned trainers can publish dated calorie/macronutrient targets and an example day for a chosen trainee. Plans, actual food and immutable history are separate views. Trainees record actual portions, correct/remove entries and decide whether to share the organization diary; sharing defaults off and withdrawal hides all actuals/history from staff. Organization ownership remains separate from independent coaching. Reassignment and inactive membership revoke access before retry receipts. Subject export includes the member's plans, sharing state, food and corrections.

The phase reuses the existing food reference, target editor and durable command infrastructure. Four PostgreSQL tables and three forward migrations preserve existing preview data. Desktop content panes own scrolling; phone pages flow naturally. Closed editors resume their drafts; member/date changes and reloads retain the correct context. Actual rendered review caught duplicate target controls and nested scrolling; reload testing caught saved feedback acknowledging an earlier queued edit. These were fixed and made explicit engineering rules in both AGENTS files.

Acceptance: **22/22 focused browser cases**, including both-engine organization nutrition, existing independent nutrition and membership flows; two nutrition API groups, five membership groups, two organization service groups, seven release guards, 33-migration/eight-suite disposable fresh installation, 27 web units, production/type/cache/format/content/docs checks. [R16 receipt](evidence/r16-verification.txt), [contract](r16-contract.md) and [ADR0012](../decisions/0012-organization-nutrition.md) record the contract, commands, failure corrections and boundaries. The expanded32-gate full release chain was not rerun. No preview reset, push, deployment or native work.

Web implementation commit: `6133db7` on `codex/revamp`. This backend checkpoint contains the paired schema/API, three migrations, role/lifecycle tests, engineering docs and acceptance receipt. Next local phase: coach review-to-individual-adaptation refinement from the research priorities; broader food coverage and release/device/human gates remain explicit.

## R15 — Exercise coverage and interaction correction

The founder rejected the small catalog/manual-step preview. This correction imports all 1,324 licensed metadata/instruction entries from the requested dataset, 46 separately sourced wger entries and retains the 14 starters: 1,384 shared source entries before owned additions. There are 45 licensed, reviewed video previews and ten static illustration sets; the full corpus does not have video. The requested dataset's restricted GIFs are not redistributed. [ADR0011](../decisions/0011-exercise-catalog-and-motion.md), [correction record](r15-exercise-correction.md) and [content maintenance](content.md) explain provenance, scope and upkeep.

The library has bounded results/detail panes and combined body-area, equipment, recording, scope and media filters. Phone entry exposes results before optional filters; selected details remove that clutter and return focus to the chosen result. Primary and alternative pickers search the full authorized corpus with bounded options and shared category normalization. Actual video loops on visibility with pause, reduced-motion and recovery controls; all static poses appear together. H.264/MP4 plus WebP/byte-range contracts prepare later native consumption without doing native work. Large videos are fetched on demand, not precached.

Five forward migrations add reference content/facets/provenance and a small editorial correction without reseeding. Published/copied source and media references remain immutable. Actual review caught lossy compound equipment, picker query/reset ordering, phone filter density, a source translation footer and a globally compiled RTL arrow selector. Completion rules now require coverage evidence, entry/detail review, real query/selection workflows and compiled/visual RTL checks; test counts alone cannot establish usability.

Acceptance: **34/34 combined browser cases**, then **6/6 final picker/dashboard cases** after the popup-direction correction; 27 web units, production/type/cache/format checks, 30-migration/eight-suite fresh installation, six catalog/media tests, three programming/media lifecycles and seven release guards pass. Exact commands and limits are in the [R15 receipt](evidence/r15-verification.txt) and [verification record](verification.md). The full release chain was not rerun. Existing preview data is preserved. No push, deployment, native work, outreach or paid provider occurred.

Web implementation commit: `6c6e64c` on `codex/revamp`. This backend checkpoint contains the paired catalogs, licensed motion pack, migrations, maintenance tools and acceptance receipt.

## R14 — Actionable nutrition and exercise reference content

Research used three smaller workers (two GPT-5.6 Sol, one GPT-5.6 Terra), with root source/license reconciliation and implementation. The requested GIF repository excludes its media from its software grant. Selected Workout Guide vector assets instead: ten exact compatible movements, thirty unchanged reference poses, retained CC BY-SA attribution/pins/hashes. USDA's official SR Legacy archive supplies fifteen verified staple foods and portions. [Research synthesis](open-source-research.md) and [ADR0010](../decisions/0010-reference-content-and-nutrition.md) explain adopted/rejected sources and follow-on priorities.

Independent Nutrition now leads with explicit calorie/macronutrient targets, optional budget allocation arithmetic and an editable example day. Trainees choose sourced foods or suggestions, adjust actual quantities and explicitly log them. Target progress, source energy and unknown/partial values remain truthful. Structured suggestions preserve immutable version history; actual consumption is separate. All nutrition writes use durable exact commands; drafts are scoped to client/visibility/date, incompatible unit changes clear values, optional helpers cannot block valid plan saves and source precision survives real form validation.

The shared exercise viewer covers independent and organization libraries, program editing, public routine and the existing logger. Manual reference positions, explicit play/pause, attribution, failure/retry and sharp bounded vectors replace off-site-only guidance for supported movements. The bounded pack is in the public offline shell and available through versioned API keys for later native use; published/start snapshots and copied prescriptions retain media references. Three forward migrations preserve preview data. Standard engineering docs, Help, source maintenance tools and quality rules accompany the code.

**Acceptance:** all 28 full release gates passed (88 browser journeys, 1,120 broad layouts, 246 SQL assertions, 25 fresh migrations, 17 units and all domain/build/maintenance checks). After four Arabic label refinements, strengthened catalog/CI checks and a reproduced/fixed late-save navigation race, all 22 focused final journeys passed, including the 32-state nutrition/media matrix. See the [full report](evidence/r14-release.json), [final follow-up](evidence/r14-followup.json) and [receipt](evidence/r14-verification.txt) for exact provenance and limits. Source values were independently re-extracted and verified.

**Limits:** 15 foods are a starter reference library, not regional/branded coverage; only 10 of 14 starter movements have exact media. Three poses are not a cadence/technique certification. Organization nutrition needs its own ownership/sharing lifecycle. Native rendering, physical devices, hosted operations, human outcomes and actual providers remain unverified. No push, deployment, external messaging, paid provider or preview reset.

Web implementation commit: `6c4fa6f` on `codex/revamp`. This backend checkpoint contains the paired migrations, catalogs, source provenance, research, architecture and accepted evidence.

## R13 — Staff dashboard and usable controls

The founder review correctly identified experience gaps not captured by prior journey/layout counts. Added persistent staff navigation and workspace scrolling, compact semantic headings, Unovis charts with clear reporting tabs and definitions on demand, and a full-catalog shared Reka timezone picker. The audit also repairs stale calendar reads, lost report display during refresh, undefined theme tokens and inconsistent navigation guidance. See [dashboard quality audit](dashboard-quality-audit.md) and [ADR0009](../decisions/0009-dashboard-components.md).

**Verified:** the uninterrupted final release chain passed all 26 gates: 76 browser journeys, 1,120 rendered states, 239 named SQL assertions, 22-migration fresh installation/seven suites, all domain/operations checks, 14 web units and type/build/format/content/docs checks. [Persisted report](evidence/r13-release.json) and [verification receipt](evidence/r13-verification.txt) distinguish real lifecycle checks, mocked UI data and actual inspected views. Earlier failures and fixes remain recorded. Scope is local web/backend; preview was preserved, with no deployment/push/native work.

Web implementation commit: `71a03de` on `codex/revamp`. This repository records the architecture, audit, release gate and accepted evidence for the same checkpoint.

## R12 — Connected experience and release handoff

Coach/organization entry now matches the web product's audience, with the usable guest sample preserved. Grouped synthetic roles and role-specific Help explain the distinct scopes. Conversation creation uses normal page scrolling; scheduling retains chosen templates across catalog searches, reveals optional group setup only when requested, checks complete review names and focuses each step. Current coverage/reference docs supersede stale foundation-only claims. Prepared organization/combined-role observation prompts and an honest release-evidence register; no human results or commercial metrics are invented.

**Verified:** the final uninterrupted `npm run verify:release -- --full` passed all 25 recorded steps: 72/72 browser journeys, 928 rendered states, 239 rollback SQL assertions, 22-migration fresh install/seven suites, all API/domain/operations groups, 12 web units, seven release guards and type/build/format/content/docs checks. Selected rows on later roster pages now retain loaded rows and position; stale read responses cannot overwrite newer context. Actual entry, scheduling, team and short-phone creation states were inspected. See [verification](verification.md) and [persisted release report](evidence/r12-release.json). Earlier harness failures and fixes are recorded, not counted as green runs.

**Boundary:** local implementation is complete for the [coverage register](revamp-coverage.md). Hosting/provider configuration, physical-device and assistive-technology checks, remote CI, unaided human use/retention/payment and the later native revamp remain separate work in the [release-evidence register](release-evidence.md). No deployment, push, preview reset, native work or outreach occurred.

## R11 — Local operations, scale and integrated acceptance

Added separately authorized platform operations with audited directory access/reasons, account suspension/restoration, organization closure/reopening and platform support replies. Added bounded people/recipient selection, summary counts, session history, analytics breakdowns, invitation/activity pages and per-participant correction history. Current selection survives searches and reloads. No platform grant exposes private training or conversation browsing.

Full browser acceptance now owns disposable database/API/files/build and preserves the preview. Added private-byte report/cleanup with grace period, database-plus-byte restore rehearsal, strict local runtime guards and a measured roster index. Provider boundaries and ordinary UI/domain change recipes are documented in current engineering docs and ADR0008.

**Verified:** 70/70 Chromium/phone-WebKit journeys, 96 rendered paired states with zero reported layout/alert/checked Axe/page errors; actual phone selections, platform history, initial scheduling, Arabic analytics and conversation setup inspected. Four operations HTTP/scale/recovery groups, expanded organization-service tests (29 corrections), existing domain/API suites, 239 SQL assertions, 22-migration disposable install/seven suites, 12 web units, seven release guards and type/build/content/docs checks pass. Scale uses 120 trainers/1,200 trainees; local measurements are not a production SLA. New browser runs no longer pollute the preview; older synthetic pollution was not erased.

**Next:** R12 local entry/help/setup cohesion, observation materials and truthful release evidence. Human usability/retention/payment cannot be established without actual participants, and outreach is not authorized. Continue all available local refinement without pausing for permission.

## R10 — Scoped communication and optional notifications

Organization channels have explicit participants/managers, visible admin joins, bounded history, observed cursors, durable device drafts and exact send recovery. The global notification inbox keeps contexts explicit, revalidates links, separates read state from intercepted acceptance and exposes per-category preferences and timezone-aware quiet hours. A guarded manual dispatcher captures due reminders, suppresses obsolete/revoked/read/opted-out intents, coalesces bursts, retries with a five-attempt limit and prunes only notification records. No email/push is sent. ADR 0007 documents the narrow transactional intent-capture trigger exception.

Verification found and fixed Safari keyboard access, an unnoticed long-history gap, short-screen footer overlap, and a shared workout-sync handoff race. The full browser run passed 63/64 and exposed that race; after correction all 18 affected core/communication journeys passed across both engines. Three communication/notification HTTP groups and existing API/services/team/organization/programming checks pass; 239 SQL assertions, twenty-migration disposable install, 12 web unit checks, seven release guards and type/build/doc/content checks pass. The rendered communication matrix and inspected captures are recorded in verification. Preview was preserved; no push or deployment.

**Next:** R11 local platform operations, bounded reads/scale, fixture isolation, cleanup/recovery and integrated fault acceptance; then available R12 refinement and a truthful release evidence record.

## R9 — Organization services and distinct analytics

Organization calendar/groups, immutable assessment definitions, reviewed concrete recurrence, explicit assessors, per-trainee attendance/results and correction history are implemented. Profile locks prevent cross-context scheduling collisions. New charts distinguish independent coaching, current organization trainer responsibility and organization administration; date/trainee filters, table equivalents and metric definitions keep them interpretable. Subject export includes own calendar/results without other trainees. The compact organization navigation retains primary operational work and puts reusable setup under More.

Verification: 62/62 full Chromium/phone-WebKit journeys, followed by 2/2 affected journeys after final chart/reschedule-preview refinement; 104 rendered service states, two HTTP lifecycle/concurrency groups, five existing booking/file groups, 239 SQL assertions, sixteen-migration disposable install, 12 web unit checks and build/type/content/docs checks. See verification for exact evidence and limits. Actual captures exposed undersized SVG labels despite passing layout checks; labels now retain readable HTML sizing. Fixed timezone accessible naming, unavailable participant removal and exact participant-draft cleanup after uncertain acknowledgment.

**Next:** R10 organization communication and optional notification preferences/inbox with local interception, then R11 and available R12. Physical devices, human usability/retention, hosting/providers, remote CI and native remain separate unverified gates. No push or external delivery.

## R8 — Scoped programming, reusable editing and reviewed delivery

Organization programs/exercises, immutable versions, atomic recipient review/delivery, organization-owned training/history and feedback now preserve business scope through trainer reassignment. Shared editor/logger components serve independent and organization contexts. Added session/week reuse, explicit individual adaptation, private optional covers and useful program metadata. Publication/start snapshots remain fixed; one durable workout queue handles actuals. Subject account export includes own organization records.

Verification found and fixed date-field overflow at 320px, a shared Vue boolean default hiding success notices, interrupted search focus and adaptation retry-key collisions. Catalog settings now use disclosure in the editor. Added every-step/native-control rules to both AGENTS files. Exact checks and observation limits are in [verification](verification.md) and [R8 contract](r8-contract.md).

**Verified locally:** 239 SQL assertions; fourteen fresh migrations plus fixtures/seven SQL suites; API/services/teams/membership/programming/media tests; twelve web unit tests; full browser run 58/60 followed by 8/8 repeats of the two corrected observation paths, plus 4/4 affected programming checks after the responsive fix. The 72-state organization programming matrix passes with no reported overflow, alerts, page errors or checked Axe violations. Representative English/Arabic phone and desktop renders were inspected. These totals do not establish human usability or device/hosting readiness.

**Next:** R9 calendar/groups, assessor-led per-trainee results and role-specific analytics; then R10 notifications, R11 local operations/scale/cleanup and R12 available refinement. No hosting, native work, real provider delivery or push. R11 includes large-roster reads, preview fixture isolation and orphan-byte maintenance.

## R7A2 — Organization membership, contexts and responsibility

Implemented locally: fixed organization memberships with combined admin/trainer/trainee roles, verified intended-email invitations, internal trainer responsibility, explicit independent coaching activation and server-authorized workspace navigation. Organizations retain membership identity through staff changes and account deletion; last-admin protection and exact closure recovery are transactional. Prisma-internal tables are inaccessible through generic browser row reads. The [contract](r7a2-contract.md) records ownership, lifecycle and current limits.

The web includes separate admin/assigned-trainer/own-trainee views, focused member editing, invitation/setup draft recovery, current-role revocation handling and sample accounts in two organizations. Shared command feedback now distinguishes active sending from recoverable uncertainty; the old immediate retry display was misleading and made reload checks race persistence. Navigation/layout checks await the actual destination and loaded records.

**Boundary:** this is the membership/context checkpoint. Organization-owned programs, immutable training history and internal reassignment of those records are implemented next in R8, followed by R9 services/analytics. No hosting, outbound delivery, native work or main-branch push. Existing preview data remains intact. Verification details are in the current verification record.

**Next:** continue R8 immediately and commit after acceptance, then R9–R12 within the local scope.

## R7A1 — Standalone API transition

- One Node/TypeScript API, Prisma 7.10 and PostgreSQL 17.6 replace Supabase Auth, browser REST/RPC and private Storage. HttpOnly opaque sessions, bounded email-code verification, local intercepted inbox and server-verified actor context cover identity. Domain transactions retain their tested snapshots, revisions, locking and idempotent replay.
- The restricted database login uses transaction-local roles/settings; browser callers cannot select another actor or invoke operator-only commands. Private uploads are immutable, authenticated and recoverable; deletes retire/revoke before byte and metadata cleanup.
- Vue now uses the owned fetch transport. New error-format handling preserves uncertain commands while unlocking confirmed rejection; set-returning commands preserve array semantics. Authorized account-event history remains visible through its read policy.
- Prisma schema/migrations, API source, SQL/HTTP fixtures and generated JSON types have clear owners. Removed Supabase CLI/SDK and obsolete runtime sources; history is at backend `727f02d`. Stopped the old local stack and retained its volumes. No hosted or native change, outbound delivery or push.
- Rewrote current README/runbook/API reference/source map and added ADR 0006. Fresh install is forward migrations plus an empty-only synthetic seed; verification uses a disposable database, never an automatic preview reset.

**Verified:** 239 rollback SQL assertions; fresh Prisma migrations/seed/seven SQL suites; 4 real HTTP identity/access/file tests; 5 service lifecycle groups; 9 team/business groups; 54 Chromium/phone-WebKit browser journeys; 320 product layout states with no reported clipping/overflow/page errors; 11 web unit tests, TypeScript/build/format checks, documentation links and dependency audits. Representative actual coach entry and message renders were inspected. R7A1 is a backend transition, not completed organization scope or whole-product UX acceptance. No physical-device, hosting, remote CI, real mail/payment or human retention claim.

**Next:** R7A2 context/organization ownership and role-specific views, then R8 programming, R9 services/assessments/analytics, R10 notifications, R11 local operations and R12 available refinement. Commit each accepted phase and continue; stop only for genuinely required user input.

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

`rafik-api` contains the standalone API, Prisma schema/migrations, explicit domain commands, fixtures, regression scenarios and engineering documentation. The audit and historical live-backend evidence remain under `docs/revival`; its old-source links refer to baseline `652e9ee`.

`rafik-mobile` remains at its original application content. `rafik-worker` is unchanged apart from its pre-existing `.DS_Store` modification. All four branches remain `codex/revamp`. The active backend/frontend now have local commits; nothing has been pushed.

## Current architecture, not a final feature ceiling

One responsive web application and one Prisma/PostgreSQL API, with explicit identity and private-file adapters. No migration of old users, restored legacy database, configurable role/workspace hierarchy, automatic progression, AI/nutrition integrations, credit system, notification pipeline or native compatibility adapter. The local product provides an immediate useful sample and a complete coach-delivered training loop.

The earlier decision to treat the broad product inventory as merely optional was too restrictive. The corrected coverage register restores a broader execution backlog for clients, programming, progress, communication, nutrition, scheduling and teams. Simplify each useful job and its implementation; do not make its existence contingent on finding customers first. The initial manual plan-conversion pilot remains a service experiment; no automatic import is implemented.

## Current next action for Codex

**Founder steering during R7:** prioritize coach/organization web workflows; trainees primarily use the later native revamp. Hosting must use Prisma + PostgreSQL and one server API; replace the transitional Supabase Auth/RPC/Storage dependencies locally before hosting. See [ADR 0004](../decisions/0004-coach-web-and-prisma-target.md). All upcoming local phases and per-phase commits are authorized.


The [forward roadmap](forward-roadmap.md) now sequences **R7 checkpoint → R7A → R8 → R9 → R10 → R11 → R12**. R7 is implemented locally below; R7A1 transport is implemented; R7A2 membership and R8 programming/history are implemented locally; R9–R12 remain in progress.

1. The [original-role audit](role-scope-audit.md) traced six roles through original web/mobile, captured deployed schema/functions and worker. The founder is correct: R4 teams do not represent organizations with their own admins, trainers and trainees. The scope correction is architectural and behavioral, not a naming or RLS patch.
2. Next implement **R7A organization/identity ownership and the Prisma/PostgreSQL API transition** under [ADR 0005](../decisions/0005-organization-and-independent-scopes.md). This moves the backend transition ahead of R8. Preserve R7's useful daily-flow work while replacing the universal role selector and personal-team ownership assumptions.
3. R8 programming/catalog/delivery then uses explicit business contexts; R9 delivers coach services, organizational calendar/assessor-led assessments and distinct real coach/admin analytics; R10 scoped notifications; R11 operational/release and platform-admin readiness; R12 available human review/refinement. Native remains last.
4. Unshipped R8 personal-only delivery/helper/test drafts were set aside outside the repositories at `/tmp/rafik-r8-before-role-audit` for reference. Migration 011 was never applied and is no longer in the runnable migrations directory. These drafts are not a product dependency or accepted phase.
5. Physical devices/assistive technology, hosting/providers, remote CI and human usefulness/retention remain unverified gates. No retired backend changes, deployment, outreach or push was made.

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

**Later audit correction:** this checkpoint implements collaboration between independent coaches. It does not establish the original organization model. Membership/ownership, internal reassignment and assessor-led operations require R7A/R9; see the role-scope audit. The historical test results below remain evidence only for the described team implementation.

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

## R6 — Responsive maintenance and local release hardening

**Implemented and verified locally for the recorded scope: 52 browser scenarios, 800 layout states, 202 Axe scans, 229 SQL assertions, 11 unit tests and seven release guards, plus real fresh/service/build checks.** Both active repositories remain on `codex/revamp`. No database migration or preview reset was needed.

- Reproduced the reported phone inbox defect: inherited 250px flex basis became row height; intrinsic minimum width expanded the inbox behind an overflow-clipping container. Removed obsolete horizontal-list CSS, constrained grid/inbox widths, restored normal row sizing and wrapping workspace navigation.
- Added state-based checks for multi-contact long names, compact rows, internal control containment, short/tall/landscape/resized viewports, search/back/no-match and both engines. Broad feature audit found/fixed WebKit native select overflow in the roster and Arabic resource filter. The roster now loads twelve visible rows at a time; search still covers all authorized loaded clients. Removed theme colour interpolation that caused transient low button contrast.
- Updated durable quality rules, current runbook instructions and a feature verification map. The product quality review explicitly records the previous QA miss; generated captures and document-level metrics are not treated as visual acceptance.
- Completed the next local implementation phase: final-file-versioned offline shells, safe waiting updates, Help/Settings update controls, failed-install recovery and preserved workout records across update/offline reopen. No forced reload or second persistence layer. ADR 0003 records rollout compatibility and multi-tab tradeoffs.
- Added guarded serial local release verification with per-step logs/reports, seven negative/positive guard tests, real HTML-only build checks and production browser failure/update tests. No runtime service or dependency was added.

Evidence is composed from the final full browser/check run plus a corrected team-layout harness rerun and a SQL log-draining rerun; see the release summary for exact provenance.

See [verification](verification.md), [feature coverage](feature-verification-map.md) and [R6 contract](r6-contract.md) for scope, concrete results and remaining boundaries. This is local implementation evidence, not hosted, physical-device or business success certification.

## R7 — Daily workspace checkpoint and organizational scope audit

Implemented locally as an incremental daily-coaching improvement; not full organizational readiness. Migration 010 adds derived attention/Today/roster reads with stable bounded pages and explicit caller scope. Web navigation is compact on phones, active workspace is remembered, coach attention identifies each client, search reaches the full authorized queue/roster, and review/client return links preserve filters. Client Today emphasizes today's available or resumable work; future schedule expands explicitly. Touched navigation styles moved to an owned workspace stylesheet.

Local acceptance: 239 rollback SQL assertions, isolated fresh installation of ten migrations, 54 browser scenarios across Chromium/WebKit, 320 broad rendered states with no reported layout/page errors, 11 unit tests and build/type/format checks pass. Desktop and phone R7 captures were inspected. Full browser suites were run serially for final evidence after a development overlap produced a trace-output collision; earlier outdated queue assertions were corrected to use the new user-facing search/filter workflow. See verification for evidence boundaries.

The subsequent source audit found an important requirements gap despite passing tests: R4 teams differ from the original separate organizational roles and workflows. Added the role matrix, ownership/lifecycle comparison, legacy defects, ADR 0005 and an actor/context acceptance matrix. Updated the roadmap, architecture status, READMEs, maintainer instructions and durable AGENTS rules. No claim that these documented organization corrections are already implemented.

R7 still leaves older test-fixture isolation, several secondary broad reads, some focus/scroll restoration and role-derived navigation outstanding. All are explicit work, not silently waived acceptance. R7A is next; R8 drafts based on personal-only delivery were set aside pending the corrected scope.
