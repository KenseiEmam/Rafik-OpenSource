# Rafik backend change history

## R14 — Useful nutrition and exercise reference content · 23 September 2026

- Immutable structured nutrition suggestions, explicit calorie/macro targets and source-backed food/portion calculation; separate suggestions from actual diary snapshots.
- Public USDA starter-food and licensed exercise-reference endpoints; immutable media keys preserved through exercise publication and shared-plan copies.
- Forward migrations, source pins/checksums/license attribution, reproducible content generation and focused contracts. No runtime provider, external account, new service or preview reset.
- Research synthesis and ADR0010 document source decisions and remaining organization nutrition/native/regional coverage gates. Verification is recorded in the implementation ledger.

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

Replaced local Supabase identity, browser transport and private-file service with one TypeScript API using Prisma/PostgreSQL. Added opaque cookie sessions, intercepted code inbox, transaction-local actor isolation, immutable private bytes, generated JSON transport types and real HTTP acceptance. Preserved transactional domain/retry contracts and corrected integration error/array/read behavior. Removed retired SDK/CLI/runtime sources; current setup, source map, ADR and verification documentation updated. Organization ownership follows in R7A2; this is not whole-revamp or hosted acceptance.


## Original-role audit and corrected architecture order · 23 September 2026

- Traced platform, independent and organizational roles through the original web/mobile, captured deployed schema/functions and worker; documented source evidence, combined-role behavior and legacy defects.
- Recorded that R4 teams, personal-coach handoff and response forms do not replace organizational membership, internal staff reassignment or assessor-led assessments.
- Added ADR 0005 and R7A ahead of R8: scoped organization ownership and the Prisma/PostgreSQL API transition, with role-specific navigation and acceptance. Coach/admin analytics now depend on this foundation. These are documented decisions, not implemented organizational features.
- Set aside unshipped personal-only R8 delivery drafts; no draft migration was applied. Added durable requirements-tracing rules and updated engineering entry points.


## R7 — Daily workspace

- Added authorized attention/Today/roster read projections, stable bounded roster and attention pages, and session indexes. No new domain table or runtime service.
- Added rollback checks for paging, search and access isolation; documented cohesive daily navigation and incremental style ownership. See verification for actual acceptance and remaining fixture consolidation.

## Product review and forward roadmap · 23 September 2026

- Added a source-grounded assessment and R7–R12 execution plan with concrete user journeys, architecture work, dependency order and acceptance criteria. Identified daily workflow/navigation, programming effort, limited content, broad reads and shared-style maintenance as the next improvement areas.
- Updated the documentation index, ledger and coverage next action; reconciled the original narrow pilot guidance with the broader implemented scope. No runtime, database, provider or native changes. Checked documentation links and whitespace; existing R6 results remain historical evidence for that code.

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


Record concrete implemented changes here with every further backend phase or material fix. Pair changes with current architecture, runbook and verification records; do not use this file as a speculative backlog.

## R4 — Team and business operations · 23 September 2026

- Added `202609230007_teams.sql` and `202609230008_business_support.sql`: ten coordination tables, three commercial/support tables and one private runtime-setting table (37 domain tables plus one internal table). No new runtime service.
- Optional fixed owner/admin/coach memberships; verified-email invitation links; rename/ownership transfer/departure/closure; minimal scoped client roster with client approval. Owners cannot disappear while responsible for an active team. Coaches cannot leave or delete their account while assigned/pending enrollments remain.
- Client-approved handoff copies the current published training plan and schedule to independently owned new-coach records, archives the old relationship, cancels future old appointments/unanswered forms and preserves started workouts. Exact start-ID retry now returns an already-created session after a handoff/archive; altered day/version reuse is rejected.
- Groups support create/rename/archive and atomic explicit assignment to up to 50 of the acting coach's clients. Stable assignment receipts prevent duplicate reassignment after lost acknowledgements. Shared plan snapshots capture missing legacy starter metadata and clone exercise definitions on import; archived templates/groups preserve existing client plans and audit receipts.
- Explicit staff file grants extend existing Storage access. Enrolled clients receive no implicit file grant; departed file owners can still inspect/revoke their own team sharing. Member removal ends subsequent downloads.
- Personal/team account state and admission limits are separate from training. Service-only provider receipts handle duplicates/out-of-order sequence; server-disabled-by-default local simulation is owner-only. Support cases have reporter/team-admin visibility and service-only platform replies. Added guarded `support:local` CLI and local-only simulator fixture.
- Added team SQL/HTTP/browser/visual checks, expanded account export/deletion, and updated CI definition with `test:teams`. Remote CI, hosting, actual billing/delivery and physical devices remain unverified. Existing preview data preserved; no push or mobile/worker changes.

## R3 — Broader service delivery · 22 September 2026

- Added migrations `202609220004_nutrition.sql`, `202609220005_appointments.sql`, and `202609220006_resources.sql`. Seven new public tables bring the domain total to 24; generated web types were refreshed.
- Nutrition: immutable effective-date guidance, coach-entered optional targets, client-owned reusable foods and explicitly shared/private meal snapshots. Quantities have an explicit unit and nutrient basis; missing values remain unknown. Corrections are revision checked, and editing food definitions does not rewrite meals.
- Appointments: bounded concrete availability series, IANA timezones/DST validation, participant booking, rescheduling, cancellation and coach attendance. Participant locks and a unique active booking index prevent conflicts, including a person acting in both roles. No workout completion side effects.
- Resources: enabled local Supabase Storage with a private 10 MiB bucket and a MIME allowlist. Added register/upload/finalize, relationship sharing/revocation, attachment validation, and retire/delete-bytes/delete-metadata lifecycle. Upload authorization holds the registration row until Storage metadata insertion completes; registration and account deletion share a profile lock. Account deletion requires file cleanup first and restores a deleted client's future availability.
- Extended `send_message` with optional resource context while retaining the previous five-argument calls through a default. Added Storage API lifecycle and simultaneous-booking verification, 42 rollback SQL assertions, and Storage-aware disposable database bootstrap. CI now includes the service integration command; remote CI has not been run here.
- Applied additive migrations to the existing local preview and restarted only this local stack to enable Storage. No reset, hosted mutation, real notification, native app change or push.

## R2 — Ongoing coaching · 22 September 2026

- Added `202609220003_ongoing_coaching.sql`: five tables (`coaching_forms`, `coaching_requests`, `measurements`, `messages`, `conversation_reads`) and explicit validated commands. The public domain now has seventeen tables.
- Added versioned check-in/assessment templates; one-off or bounded weekly/fortnightly request series; assigned question/unit snapshots; server drafts, submission, correction, review and cancellation. Correcting a submission preserves its original timestamp and clears outdated feedback.
- Added optional client-owned weight/waist measurements with explicit units, per-record sharing, revision-safe correction and removal.
- Added participant conversations with stable UUID send deduplication, verified workout/response context, monotonic read cursors and computed inbox summaries. No outbound delivery or Realtime service.
- Added `training_progress` for completed actual results visible to the caller, bounded to a one-year range. No automatic fitness score or progression side effect.
- Added R2 synthetic fixture source and content-pipeline composition. Applied the R2 migration and only the new additive fixture rows to the current local preview; no preview reset or legacy backend change.
- Added `supabase/tests/ongoing_coaching.sql` to both normal and disposable-database test runners. Extended the maintained docs and added `maintainer-guide.md`; future work must keep these records current.

## R1 — Daily coaching · 22 September 2026 · `31084bb`

Private client context, archive/reactivation, coach-owned exercise catalog, schema-2 cycles/rest days/typed results/groups/per-set targets, assignment schedule projection and exceptions, immutable instruction snapshots and previous-performance queries. Fourteen shared exercises. Disposable-database verification preserves the working preview. Details: [R1 contract](docs/implementation/r1-contract.md).

## Foundation · 22 September 2026 · `dc60441`

Replaced the retired API runtime with a clean local Supabase schema and explicit transactional commands; identity, invitations, relationships, versioned plans, durable workout recording/review, generated content/types, local tooling and audit/implementation documentation. Old source remains at `652e9ee`.

## Maintenance entry points

[Developer guide](docs/implementation/maintainer-guide.md) · [Architecture](docs/implementation/architecture.md) · [Ledger](docs/implementation/ledger.md) · [Verification](docs/implementation/verification.md)
