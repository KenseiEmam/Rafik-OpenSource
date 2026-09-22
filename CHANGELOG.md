# Rafik backend change history

Record concrete implemented changes here with every further backend phase or material fix. Pair changes with current architecture, runbook and verification records; do not use this file as a speculative backlog.

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
