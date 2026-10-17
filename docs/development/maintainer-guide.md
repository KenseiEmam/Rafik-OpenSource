# Maintainer guide

This guide is for current work in the Rafik monorepo. It stays focused on the maintained codebase; old phase-by-phase notes are in the [archive](../archive/README.md).

## Read these first

- [Requirements and stage gates](../requirements/README.md) define approved product direction and what is not accepted yet.
- [Architecture](../architecture/README.md) describes the current system and data boundaries.
- [Implementation ledger](./ledger.md) records the active stage and recent decisions.
- [Development guide](README.md) covers local setup and common workflows.
- [Operations guide](../operations/README.md) covers self-hosting, secrets, backups and recovery.
- [Verification summary](../verification/README.md) records checks actually run and their limits.

## Repository map

| Path                          | Use                                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/frontend/src/features/` | Vue feature screens and task-specific components. Keep features small and follow the existing domain boundaries.                         |
| `apps/frontend/src/app/`      | Routing and application-level composition.                                                                                               |
| `apps/backend/server/`        | HTTP routes and server-owned domain authorization, reads and commands.                                                                   |
| `apps/backend/prisma/`        | Prisma schema and append-only SQL migrations. SQL remains authoritative for database constraints and functions Prisma cannot represent.  |
| `apps/backend/content/`       | Canonical imported data and media manifests. Preserve pinned source, license, attribution and hashes.                                    |
| `packages/shared/`            | Shared API contracts and generated database transport types.                                                                             |
| `infrastructure/compose.yaml` | The sole local/self-host Compose definition.                                                                                             |
| `docs/`                       | Current product, engineering and operational documentation. Raw verification receipts are separated under `docs/verification/receipts/`. |

Instance branding is managed by `apps/frontend/src/features/organizations/BrandingSettings.vue`, applied in `apps/frontend/src/App.vue`, and served by `apps/backend/server/instance-branding.ts`. The initial setup claims the single-instance branding owner; the forward migration is `apps/backend/prisma/migrations/202610171500_instance_branding/`. Keep the raster signature/size checks, super-admin scope, public image response headers and database backup behavior aligned when changing it. The supported palette is accent plus light/dark page backgrounds; surfaces derive from those colors and text/accent contrast is adjusted in `apps/frontend/src/lib/branding.ts`.

Generated frontend sample/catalog files are outputs of backend content sources. Edit the canonical source, run its generator, and verify the generated output; do not hand-edit generated files.

## Implement a user workflow

Before coding, write down the actor, organization or independent context, resource, and lifecycle action. Trace both allowed and denied API access. Then follow the existing feature module and API contract rather than creating another store, business-rule copy, or generic framework.

Complete the user task through success, interruption, retry, correction and review/history. Keep local drafts, dispatched requests and acknowledged server state distinct. Recheck authority at command time and before replay; stale tabs and revoked membership must not preserve access. Derive navigation from server capabilities, but enforce security in the API/database.

Messaging changes must keep direct conversations unique for an institution and participant pair, and group shortcuts must reopen their linked channel. Password creation rules belong in the shared package and server validation; keep login compatible with existing credentials. Published programs are institution-library items; assignment authority still limits coaches to their currently assigned athletes.

For visual changes, preserve the accepted design identity and inspect the rendered task states the change affects. Cover relevant empty, populated and error states, keyboard access, English/Arabic, themes and phone/desktop layouts. Reuse recent evidence for unaffected browsers; run full browser suites serially only when the changed behavior warrants them.

The signed-in shell and role-specific route handling are composed in `apps/frontend/src/App.vue` and `apps/frontend/src/app/router.ts`; collapsible role navigation is in `apps/frontend/src/features/workspace/DashboardNav.vue`. Each institutional membership has one role and one matching dashboard. Institution member administration lives in the organization People view and remains server-authorized. The forward migration that normalizes legacy role arrays is in `apps/backend/prisma/migrations/202610171100_single_membership_roles/`.

## Change data or API behavior

1. Update the Prisma schema and add a forward SQL migration. Do not reset or reseed a database to apply a migration.
2. Preserve tenant and subject ownership constraints, transaction boundaries, revision checks, idempotent replay and authorization-before-replay behavior.
3. Regenerate Prisma and shared database types using root workspace scripts. Keep API contracts in `packages/shared/` when both app workspaces consume them.
4. Add focused regression coverage for consequential failure or authorization paths. Never rely on sample-account pollution or fixtures from an earlier test.
5. Update the architecture page for data/API/lifecycle changes and the runbook for operational changes.

## Change canonical content or media

Keep source URL/revision, content digest, per-field license and attribution with the manifest. Review media-byte rights separately from software and dataset-text licenses. Preserve immutable published references; never imply a static frame sequence is continuous motion. Use the [content guide](../reference/content-maintenance.md) for generation and provenance.

## Local development

Use one root `npm ci`. Start the local PostgreSQL Compose profile and apply migrations with `npm run backend:start`; seed only a new, empty local database. Use `npm run web-env`, then start `npm run start:api` and `npm run dev` in separate terminals. The [development guide](README.md) has the complete local setup and sample-account access; [operations](../operations/README.md) covers recovery and self-hosting. Never use local preview identities or synthetic credentials in a hosted deployment.

## Focused verification and cleanup

- Run the smallest relevant check for the changed behavior; do not rerun unrelated suites or a full browser matrix by default.
- Run typecheck/build for the workspace whose compilation or generated output changed. Run documentation-link checks after moving or adding docs.
- Run browser acceptance when rendered behavior changes; use the local isolation wrapper and do not reset or reseed the preserved preview.
- Record the exact commands, result and limits in [verification](../verification/README.md). Persist sanitized receipts under `docs/verification/receipts/`; never store credentials, user messages or unreviewed screenshots there.
- Remove only test reports/artifacts created by the current run. Preserve unrelated local data and ignored user artifacts.
- Update root `CHANGELOG.md` and the [ledger](./ledger.md) for every change. Update the affected README and this guide when setup or file workflows change.

## Scope boundaries

The approved product is university-first. Session packages, prepaid allowances, package renewals and no-show session deductions are retired gym features; do not add them back to active UI, API, analytics or schema. Calendar, attendance, assessor-led performance records and independent makeup scheduling remain separate from commercial entitlements.

Do not claim production readiness, privacy compliance, human usability or physical-device behavior from local checks. Stage acceptance and remaining external review are recorded in the requirements and verification summary.
