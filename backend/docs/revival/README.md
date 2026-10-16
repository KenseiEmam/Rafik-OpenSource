# Rafik revival: findings and execution plan

**22 September 2026 · Historical analysis package for Codex to execute the revamp.** Covers the four repositories, market/business, UI/UX and the live Supabase backend. A working local foundation has since been built. The user rejected that narrow slice as a complete revamp: see [current status](../implementation/ledger.md) and [corrected feature coverage](../implementation/revamp-coverage.md). Earlier scope exclusions below are historical, not the final product boundary.

**Current direction: a clean rebuild, locally first, on `codex/revamp` branches.** The founder confirms the old product is dead and legacy data is not a priority. Build a fresh web experience and core backend; do not restore/migrate the old system or maintain old-client compatibility. A new Supabase project is the intended hosted destination later. Mobile work starts only after the web/backend is revamped and ready. Never push this work to `main`.

## Start here

| Document | Purpose |
|---|---|
| [My execution runbook](/Users/sami/Developer/GitHub/rafik-api/docs/revival/07-agent-execution-plan.md) | The binding decisions, 12 units I will execute, source ownership, checks and exact next action |
| [Live Supabase audit](/Users/sami/Developer/GitHub/rafik-api/docs/revival/06-live-backend-audit.md) | Actual schema/functions/triggers, deployed code, aggregates, Auth, operations and 14 backend findings |
| [Market and business analysis](/Users/sami/Developer/GitHub/rafik-api/docs/revival/00-market-and-business.md) | Competing models/offers, failure hypotheses, proposed positioning, pricing/economics and validation |
| [35 source and UX findings](/Users/sami/Developer/GitHub/rafik-api/docs/revival/01-audit-findings.md) | Specific defects with evidence, severity, limits and corrective principles |
| [Complete UI/UX blueprint](/Users/sami/Developer/GitHub/rafik-api/docs/revival/02-product-and-ux.md) | Screen-by-screen redesign, task journeys, field timing, visual direction, states and acceptance |
| [Clean-rebuild architecture](/Users/sami/Developer/GitHub/rafik-api/docs/revival/03-architecture-and-migration.md) | New schema, explicit commands, durable sessions, simple source layout and new-system deployment |
| [Delivery coverage](/Users/sami/Developer/GitHub/rafik-api/docs/revival/04-delivery-plan.md) | Original 23 work packages mapped to the new execution units; complexity/readiness gates |
| [Validation and evidence](/Users/sami/Developer/GitHub/rafik-api/docs/revival/05-validation-and-evidence.md) | Checks actually performed, reproducible evidence and remaining limitations |

## Diagnosis

Rafik asks for setup and learning before delivering a useful result. Its interface and interaction design are major problems, not a cosmetic layer to fix after customer acquisition. It also combines too many propositions—coaching software, marketplace, nutrition, organizations, assessments and AI—without one demonstrated reason to choose it.

The backend reinforces that friction. Ordinary assignment updates can delete unfinished workouts. Editing an already-completed workout replays progression and notifications. Duplicate prevention is ineffective, week calculation crosses client boundaries, and identity labels refer to different tables. Automated follow-ups accumulated 2,182 pending forms. Fixing only the visible screens would leave these problems underneath.

The main architecture issue is not the number of servers. It is that a simple action has hidden consequences across client writes, database triggers and scheduled code. The new implementation should give each retained rule one explicit owner and make ordinary updates predictable. Permissive RLS is a known initial setup choice and a bounded new-release concern; it is not the central diagnosis.

## Proposed product

Build a clear training companion: a client opens a useful plan, records a session easily, resumes after interruption and sees what comes next; a coach reuses an existing plan, assigns it and reviews actual results. A public sample provides value before account creation. Private assignments use contextual verification. Optional diet, measurements, marketing profiles, certificates and notifications do not block first value.

The initial commercial hypothesis is existing-plan delivery through coaches who already have clients. It differs from the failed beta: no promise of new leads, no installation wall before preview, first-plan setup assistance and a concrete paid-continuation offer. Strong alternatives already exist, including Everfit, Trainerize and Hevy. This is a bounded hypothesis to test, not a claim that a nicer coach dashboard is automatically a viable business. Document 00 compares marketplace, organization, consumer and service alternatives and includes a direct-client comparison using the same core.

The required revamp includes a complete plan editor and coach review experience. Recruitment and payment tests guide expansion; they do not postpone the UI/UX rebuild. The requested `design-taste-frontend` skill replaces `frontend-design` for subsequent design work within its scope.

## Implementation direction

Use Vue 3/TypeScript for a fresh responsive application and Supabase for a new backend. Keep the provided frontend and API repositories as the two active source roots, with clean structures on `codex/revamp`. Do not transplant the old global stores, schema, orchestration triggers, worker or integrations. Keep mobile parked.

The first schema needs one Auth-linked identity, coach/client relationship, invitation, curated exercises, draft/published plans, assignments, sessions and actual set entries. Published prescriptions and started sessions are stable. Commands handle invitation, assignment, start, save, completion and review atomically and safely on retry. Local durability is limited to workout recording; there is no need for a universal synchronization framework.

Reuse a small amount of useful content selectively. No user-history import, credit reconciliation, backfill pipeline, legacy compatibility adapter or full old-database restoration. Leave the old project alone while building. Its findings become new-system regression requirements only where the relevant capability is retained.

## What was verified

Reviewed 371 tracked source files across four repositories, inspected public pages and historical design assets, built/type-checked Vue, checked Deno and ran five isolated logic reproductions. The Vue build/type check passed; Vitest had no test files; Deno reported ten errors in the old code.

Then inspected `Rafik-Supabase-Backend` (`pexviywnztvqomfosvho`) through the authenticated CLI and Chrome: 35 public tables, 35 custom functions, 27 public triggers, all eight deployed Edge Functions, Auth/storage/realtime/operations settings and aggregate consistency. Eight additional synthetic database checks passed. The live audit corrected an earlier suspicion: expiry is recalculated correctly by the database trigger.

No live data, settings, functions or jobs were changed and no messages were sent. The schema export is a reference, not a data/file backup. Native runtime and authenticated product screens were not exercised. Under the revised scope, restoring the old app is unnecessary; visual/device and integration verification will target the new web/backend. Mobile is explicitly deferred.

All four local branches are now `codex/revamp`. No commits or pushes were made; the worker's pre-existing `.DS_Store` change remains. The next implementation action is E01 in the runbook: establish the clean local foundation, then the minimal domain and complete core design.
