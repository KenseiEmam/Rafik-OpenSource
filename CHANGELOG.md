# Rafik web change history

## Stage 3 self-hosting — 2026-10-16

- Began the approved Compose deployment with web/API images, HTTPS proxy, SMTP sign-in delivery, one-time university bootstrap, production configuration validation and per-instance database role password setup. Removed the tracked Vercel frontend config. Patched Prisma to 7.10.1 and overrode vulnerable transitive packages; npm audits report zero vulnerabilities. Fixed two migration startup defects found in the isolated Linux Compose smoke test. The full 40-migration fresh database, API, and web health checks now pass. The revoked Google service-account key was removed from the rewritten public university branch history. Stage 3 remains incomplete pending backup/restore and update/rollback verification.

## Stage tracking and security reporting — 2026-10-16

- Closed Stage 2 after confirming the renamed repository is public and its completion commit is pushed. Clarified that the unrelated Vercel deployment status is not a Docker acceptance gate; Stage 3 remains gated on user approval.
- Added the root security disclosure policy and linked it from contributor, project, and documentation entry points. Added it to local documentation-link checks.
- Fixed a backend test type error exposed by the clean Node 22 workspace check.
- Preserved pinned SVG/JSON source bytes and generated SQL across Windows checkouts so digest and migration verification remain reproducible.
- Completed the pinned-runtime install, local content/license review, frontend unit/build/type checks, backend type checks, and isolated fresh-migration SQL rehearsal. No relevant GitHub Actions run was available.
- No product behavior, deployment capability, or release status changed.

## University revamp planning — 2026-10-16

- Recorded the approved university-first product direction, university-owned isolated deployment model, reuse audit, security/privacy baseline, staged acceptance criteria, risks, and open decisions.
- Added target architecture and ADR 0001. No product behavior or deployment capability changed in this planning stage.
- Created branch `codex/university-revamp-plan` for the approved staged work.

## Monorepo foundation — 2026-10-16

- Set the canonical repository/package name to `KenseiEmam/Rafik-OpenSource` / `rafik-opensource`; the hosted GitHub rename still requires an authorized GitHub connection.
- Imported the companion API repository under `apps/backend/`, retaining its branch history as a second parent in the monorepo merge.
- Applied Apache-2.0 to project code/documentation and retained separate content/media license boundaries.
- Reshaped the repository as npm workspaces under `apps/frontend`, `apps/backend` and `packages/shared`, with one root `AGENTS.md`, one `docs/` tree, and one Compose file in `infrastructure/`.
- Added shared API error/user contracts and moved generated database transport types into `packages/shared`; centralized research Markdown under `docs/revival/coordination/` and resolved an imported ADR number collision. Updated local scripts, tests, CI and documentation for the workspace layout. No hosted deployment or university injury workflow is claimed.

## R21 — Session experience and workplace feedback

Optional satisfaction feedback is now source-specific and reusable by the later mobile app: completed workouts and attended, completed training appointments have distinct response counts/distributions; unanswered feedback is unknown. Trainers submit a separate monthly workplace rating, with visibility explained before submission. Administrators see its current-active-trainer coverage separately from client/date filters. Analytics also shows actual trainer session delivery and explicitly recorded package renewals, without inferring quality, revenue or paid retention.

Use organization **Analytics → Experience & renewals** for client/workplace/renewal views and **Delivery & capacity** for trainer session delivery. Trainers use **My feedback**; the retained trainee examination web has optional links after completion. The API is ready for later native integration; no native UI or hosting is claimed. Historical feedback checks: `npm run test:organization-feedback --workspace @rafik/backend` and `npm run test:e2e --workspace @rafik/frontend -- organization-feedback.e2e.ts`.

Maintenance in this phase fixes stale revisions after recovered rating/session-note saves and automatic analytics-tab switching on focus. Nested report tabs now remain contained at 320px. The READMEs and engineering guides distinguish current contracts/setup from historical evidence.

## R20 — Organization session packages

Organization packages now track explicit trainee entitlements, derived available/reserved/used balances, validity dates, auditable allowance corrections and linked renewals. Calendar booking reserves only an explicitly selected package; completion consumes present/charged absent sessions, cancellation/excused/released no-shows release, and independent trial/makeup/prize/other sessions never affect allowances. Staff session details include check-in timestamps and durable notes; the overview surfaces missed sessions without a replacement. Reuses workspace transactions/receipts and existing calendar events; no parallel scheduler or payment processor.

Open **Packages** from the organization sidebar; admins assign allowances and trainers book for their current roster. Historical package checks: `npm run test:organization-packages --workspace @rafik/backend` and `npm run test:e2e --workspace @rafik/frontend -- organization-packages.e2e.ts`. Apply new local migrations with `npm run db:migrate`, then `npm run db:generate`; never reseed an existing preview.

## R19 — Trainer tasks and daily follow-up · 28 September 2026

- SQL acceptance uses a disposable fixture database. Repeated exercise illustrations use local accessibility groups; publication success waits for durable command completion.
- Organization admins assign/reassign dated, prioritized trainer tasks. Trainers complete/reopen their own queue; admins can cancel and restore tasks. Search, history, scoped drafts, revisions and exact retry are included.
- Organization overview now links actual tasks, training awaiting review, past bookings awaiting an outcome and trainees without an active assignment. Upcoming appointments keep using the calendar.
- Task permissions follow current organization membership; reassignment revokes former assignee access before receipt replay. One table/service reuses existing command infrastructure.
- Package accounting follows in the next phase using the founder-confirmed reservation/completion/cancellation policy and explicit no-show decisions. Client-to-trainer satisfaction and trainer workplace satisfaction will be reported separately from explicit feedback; no invented risk/quality metrics.

## R18 — Organization exercise ownership, uploads and private conversations · 28 September 2026

- Multi-select body areas, muscles and equipment, controlled movement choices, direct uploads and existing-file reuse in organization exercise creation. Clearing selections also clears compatibility fields.
- Trainer-created library entries stay creator-private; organization-shared entries remain tenant-local. Published snapshots retain their categories and immutable demonstrations.
- Authenticated organization assets, resource search/archive/restore, safe upload retries and exact message attachment binding. Two-person conversations exclude nonparticipant administrators; group behavior is explicitly separate.
- Backup/export/orphan maintenance, forward-only migrations, permission tests, rendered review and engineering documentation. No preview reset, hosted storage or native work.

## R17 — Gym-first entry and authoring usability · 28 September 2026

- Gym-first homepage with an original workflow diagram, staff-only context switching, dark default, unchanged logo colors and reachable support navigation.
- Prefixed Tailwind utilities with no Preflight; existing tokens and components remain authoritative.
- Visible program descriptions and per-set tables, clearer weekly repetition/rest days and grouped supersets; separate organization nutrition example-plan tab.
- Month calendar and selected-day agenda; persistent messaging inbox keeps search and position when switching threads.
- Local acceptance: 32 focused Chromium/WebKit journeys, 27 units, production/type/cache/format checks. Package policy and exercise/media ownership are subsequent phases, not included in this checkpoint.

## R16 — Organization nutrition and shared follow-up · 23 September 2026

- Organization-owned dated calorie/macro plans and example meals, immutable versions, expiry and current-trainer/admin authority.
- Explicit trainee diary sharing, actual portion/source snapshots, corrections/removal history and subject export; personal nutrition stays separate.
- Plan / Food diary / History workspace, searchable trainee selection, roster links, publish review and scoped durable drafts/retries. Closed editors resume unfinished drafts; latest-write acknowledgement governs save feedback.
- Updated architecture/API/maintenance/Help, forward migrations and cross-role/workflow acceptance. Local only; hosting and native remain deferred.

## R15 — Broad exercise library, categories and real motion · 23 September 2026

- Imported 1,324 metadata/instruction entries and 46 separately licensed wger entries; retained starter identities and immutable history. Categories, source references, correct timed/rep recording and copied-content attribution are explicit.
- Added 45 continuous-motion previews with visible autoplay, pause, reduced-motion handling and recovery; removed manual illustration stepping. Excluded an ambiguous duplicate and trimmed two camera introductions.
- Rebuilt exercise browsing as bounded results/detail panes with category/equipment/type/media filters and phone back navigation. Searchable program pickers mount at most 40 results and preserve selections/alternative chips.
- Corrected Arabic direction in portaled exercise/timezone pickers; compact phone exercise rows and optional filter disclosure keep results reachable.
- Updated content provenance, generation/maintenance instructions, quality rules and verification. The requested GIF rights remain separate; video coverage is 45 entries, not the complete catalog.

## R14 — Actionable nutrition and sharp exercise guidance · 23 September 2026

- Visible calorie/macro targets, optional budget arithmetic, source-backed food picker, structured example days, adjustable actual portions and truthful target progress.
- Context-specific nutrition drafts and durable exact retries for all nutrition writes; unit changes clear incompatible values and helper drafts do not block plan saving.
- Shared exercise viewer with three vector reference poses, deliberate play/pause, reduced-motion/hidden-page behavior, attribution and image retry. Offline shell includes the bounded public reference pack.
- Research, engineering content guide, API contract, Help and acceptance coverage updated. The library starts with 15 foods and ten exact exercise matches; organization nutrition and native integration remain outstanding.

- Acceptance: 28 full release gates passed, followed by 22 final focused browser regressions after the late-save navigation guard and Arabic portion refinements. Full evidence and limits are in the implementation verification record.

## R13 — Staff dashboard and control quality · 23 September 2026

- Persistent coach/organization sidebar, compact task headings, mobile navigation drawer and bounded desktop workspace/collection scrolling.
- Unovis analytics with axes, tooltips, integer count ticks, keyboard/table equivalents, category pages, clear activity/delivery tabs and retained reports during refresh failure.
- Shared searchable Reka timezone picker on all five editing/viewing surfaces, full IANA catalog, UTC, persisted aliases, current offsets and common city-name aliases.
- Stale calendar-response guard, selected-filter retention, repaired undefined semantic colors, coherent Help/navigation documentation and durable quality rules. ADR0009 documents the dependency/scrolling decisions.
- Final serial acceptance passed all 26 gates: 76 browser journeys, 1,120 rendered states, 14 web units and all backend/build/maintenance checks. The R13 audit records discovered/fixed integration defects and local evidence limits.

## R12 — Connected entry and product refinement · 23 September 2026

- Coach/organization public entry, preserved immediate workout, grouped sample roles and role-specific Help; workspace intent retained through sign-in.
- Natural-page conversation creation, optional scheduling setup, retained selected templates, resolved participant review, step focus and superseded-read protection.
- Current scope/architecture/runbook/source map and release-evidence handoff; prepared organization observation protocol without claiming human outcomes.
- Final serial acceptance passed 72 browser journeys, 928 rendered states and all backend/fresh/build/maintenance gates; see the backend verification record. Hosting/providers/devices/human use remain separate gates.

## R11 — Operations, scale and recovery · 23 September 2026

- Separate platform authority, audited actions/support and account/session suspension; local Amina sample.
- Bounded organization people/recipients/history/analytics, persistent multi-page selections and measured roster index.
- Disposable browser acceptance, private-file maintenance and database-plus-byte recovery rehearsal; current architecture/runbook/API/maintainer docs and ADR0008.
- Verified 70 browser journeys, 96 rendered states,domain/HTTP/fresh/schema checks. Local only; real providers/devices/human outcomes remain outstanding.

## R10 — Scoped communication and notifications (23 September 2026)

Organization channels with visible membership, compact responsive list/detail, durable message drafts/exact retries and accessible history. Global authorized notification links, category preferences and quiet hours; transactional intent capture, bounded retries/retention and local intercepted delivery. No external provider delivery.

## R9 — Organization services and informative analytics · 23 September 2026

Added organization groups, assessment templates, reviewed recurring scheduling, explicit assessors, cross-context booking conflict checks, per-trainee attendance/results and retained corrections. Added distinct independent coach, organization trainer and administrator analytics with date/trainee filters, source links, chart tables and explicit definitions. Focused result editing, device drafts and exact interrupted-command retry preserve work. Consolidated secondary organization navigation. Added fixture, HTTP, browser and responsive acceptance coverage plus maintained API/source/operations documentation. External reminders follow in R10.

## R8 — Scoped programming and reviewed delivery · 23 September 2026

Added organization-owned exercise/program catalogs, immutable publication, private optional covers, reviewed atomic assignments, trainee training/history and coach review. Shared independent/organization editing supports session/week reuse, scoped draft/retry recovery and individual adaptation without changing other recipients or started work. Preserved one workout persistence queue. Added source/lifecycle documentation and HTTP, unit and browser regression coverage. R9 organization services and analytics remain subsequent work.

## R7A2 — Organization membership and role views · 23 September 2026

Added separate organizations, combined admin/trainer/trainee memberships, verified invitations, internal trainer responsibility, role-derived navigation and explicit independent-practice activation. Membership revision checks, exact receipts, last-admin protection, departure/closure and account deletion preserve scope and ownership. Recoverable setup/invitation drafts and shared truthful sending/retry states support the UI. Added isolated HTTP/browser regression coverage and maintained contracts/source-map documentation. Organization programs/history/services follow in R8/R9; this checkpoint is not the whole organization product.

## R7A1 — Prisma/PostgreSQL API transition · 23 September 2026

Replaced the Supabase browser SDK with the owned HTTP API for identity, commands, reads and private files. Cookie sessions replace JavaScript-held access tokens. Preserved durable drafts/retries and fixed confirmed-rejection handling. Updated actual browser/fixture/layout tests and engineering docs; 54 browser journeys pass across both engines. Organization ownership follows in R7A2.

## Original-role audit and corrected architecture order · 23 September 2026

- Traced platform, independent and organizational roles through the original web/mobile, captured deployed schema/functions and worker; documented source evidence, combined-role behavior and legacy defects.
- Recorded that R4 teams, personal-coach handoff and response forms do not replace organizational membership, internal staff reassignment or assessor-led assessments.
- Added ADR 0005 and R7A ahead of R8: scoped organization ownership and the Prisma/PostgreSQL API transition, with role-specific navigation and acceptance. Coach/admin analytics now depend on this foundation. These are documented decisions, not implemented organizational features.
- Set aside unshipped personal-only R8 delivery drafts; no draft migration was applied. Added durable requirements-tracing rules and updated engineering entry points.

## R7 — Daily workspace

- Compact four-destination phone navigation and explicit workspace switching; full tools remain discoverable through More and desktop navigation.
- Unified named coach attention queue with filters, next-review return, Today-first client schedule and focused reads.
- Server-paginated roster search, URL-backed filters/client tabs, extracted workspace styles and removed obsolete navigation CSS.
- Added disposable-fixture browser checks for attention, mobile navigation, RTL and nested layout; backend contract and maintained documentation explain boundaries.

## R6 — Responsive maintenance and local release hardening · 23 September 2026

- Fixed mobile inbox 250px rows and hidden width overflow by removing obsolete horizontal-list CSS, constraining intrinsic widths and keeping list scrolling bounded. Restored wrapping workspace navigation; fixed WebKit long select/Arabic resource filter overflow.
- Removed foreground/background theme interpolation that briefly reduced button contrast.
- Bounded the client roster to twelve visible rows with load-more and whole-roster search; successful reload clears old read errors.
- Added multi-contact/long-label/resizing/short-height regression coverage and a broad two-engine audit that checks internal clipping. Recorded the missed-state root cause and durable quality rules; corrected stale runbook instructions.
- Added content-versioned offline shells and non-interrupting update checks in Help/Settings. Failed first installs can retry without a reload; failed updates preserve the current version; waiting updates activate after old tabs close, retaining device work.
- Fixed the SQL launcher to drain piped output before exiting, retaining all assertion/rollback evidence.
- Added a guarded, serial local release verification command with per-step reports/logs and explicit unverified release boundaries. No migration, reset, deployment, external provider, native change or push.

## R5 — 23 September 2026

- Reorganized engineering handoff around a docs index, CONTRIBUTING/definition of done, ADRs, API conventions and release gates; added local documentation-link checks and durable rules in both AGENTS files.
- Reworked Messages history/composer geometry, searchable inbox and phone back navigation, optional file controls, visible-history read cursors and send focus. Preserved durable exact retries and attachment/context permissions.
- Improved Today task priority, searched/bounded check-in/template/plan/review collections, direct post-assignment navigation, nutrition/resource empty states and team-invitation shell.
- Added frozen coach-approved exercise alternatives and actual client choices, using existing durable workout commands, plus correct review/previous-performance/progress and independently owned shared-plan/handoff copies. Additive migration 009; no data reset or new service.
- Added rollback and real-browser quality regressions; see the companion verification record for actual final results and limitations. Hosting, external providers and native work remain deferred.

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
- Expanded READMEs and added this change history. The [maintainer guide](docs/implementation/maintainer-guide.md) explains the full file map and development workflow. `AGENTS.md` now requires documentation updates with further work.

## R1 — Daily coaching · 22 September 2026 · `8097f0d`

Expanded the client workspace/roster lifecycle, custom exercise catalog, richer multiweek programming, assignment schedules, timed/distance/effort recording, per-set targets, group guidance, prior performance and coach actual-result review. Added regression and rendered checks while retaining the new visual system.

## Foundation · 22 September 2026 · `a6afdc3`

Rebuilt the web application in Vue 3/TypeScript with English/Arabic and light/dark support; useful public workout sample, local Auth/invitations, immutable published plans, durable workout logging/sync/recovery, coach review, account/help tools, tests and production shell caching. Old web source remains at `a0c723e`.

[Current status](docs/implementation/ledger.md) · [Architecture](docs/implementation/architecture.md) · [Runbook](docs/implementation/runbook.md) · [Verification](docs/implementation/verification.md)
