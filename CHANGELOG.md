# Rafik backend change history

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
