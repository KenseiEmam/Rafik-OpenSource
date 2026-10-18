# Documentation

This page is the index for maintained Rafik documentation. The root [README](../README.md) is the project entry point; [CONTRIBUTING](../CONTRIBUTING.md) describes contribution practice. Historical phase records and superseded material are under [archive](archive/README.md). Raw machine-generated check receipts are separate under [verification/receipts](verification/receipts/).

## Product and design

- [Requirements and staged plan](requirements/README.md): goals, scope, constraints, acceptance criteria and current stage gates.
- [University role and scope audit](requirements/role-scope-audit.md): historical role findings and current organization authorization constraints.
- [Stage 4 workflow audit](requirements/stage4-workflow-audit.md): current university workflow coverage and remaining review.
- [Stage 7 mobile scope](requirements/stage7-mobile-scope.md): confirmed coach-first Android field tasks, offline boundary, API contract and acceptance evidence.
- [Rafik Field app workspace](../apps/mobile/README.md): current Android prototype status, local build steps and limits.
- [Architecture](architecture/README.md): system context, components, data flow, security boundaries and integrations.
- [Architecture decisions](decisions/README.md): active ADR index; superseded ADRs are archived.
- [API reference](reference/api.md): transport, errors, retries and pagination.
- [Coach field OpenAPI contract](../apps/backend/openapi.json): OpenAPI 3.1 subset exported at `/v1/openapi.json`; bundled Swagger UI at `/v1/docs`. The [API guide](reference/api.md) explains authentication and self-hosted URLs.
- [Content maintenance](reference/content-maintenance.md): canonical content generation, provenance and media rights.
- [Known issues and release gaps](known-issues/README.md): verified product/operational gaps, impact, evidence and next steps.

## Development and quality

- [Development setup and workflows](development/README.md): prerequisites, local setup, common change workflows and troubleshooting.
- [Android coach field development](development/android.md): native build setup, Windows startup helper and path/concurrency troubleshooting, attendance/scores, history, recovery sharing, English/Arabic and disposable API/queue acceptance.
- [Maintainer guide](development/maintainer-guide.md): repository map and implementation recipes.
- [Current delivery ledger](development/ledger.md): current stage and recent implementation outcomes; not a phase-history archive.
- [Testing strategy](testing/README.md): test layers, focused commands, fixtures and evidence boundaries.
- [Feature verification map](testing/feature-verification-map.md): user jobs, lifecycle checks and coverage limits.
- [Local coach walkthrough](testing/coach-walkthrough.md): steps for personally reviewing the current local university workflow with synthetic data.
- [Verification summary](verification/README.md): actual checks, dates, coverage and known limits.

## Operations and release

- [Operations and deployment](operations/README.md): Compose deployment, cloud starter templates, environment/secrets, backups, recovery, rollback and retention operations.
- [Release checklist](operations/release-checklist.md): release prerequisites and outstanding gates.
- [Android beta builds and updates](operations/android-release.md): private signing-key ownership, signed APK builds, installation, offline-start and update checks.

## Architecture decisions

- [ADR 0001 — University-owned deployments](decisions/ADR-0001-university-owned-deployments.md)
- [ADR 0002 — State and command boundaries](decisions/ADR-0002-state-and-commands.md)
- [ADR 0003 — Complete application-version updates](decisions/ADR-0003-application-updates.md)
- [ADR 0005 — Organization and legacy independent-data boundaries](decisions/ADR-0005-organization-and-independent-scopes.md)
- [ADR 0006 — Prisma API, identity and file boundary](decisions/ADR-0006-prisma-api-transition.md)
- [ADR 0007 — Transactional notification intents](decisions/ADR-0007-notification-intents.md)
- [ADR 0008 — Local operations and bounded reads](decisions/ADR-0008-local-operations-and-bounded-reads.md)
- [ADR 0009 — Dashboard components](decisions/ADR-0009-dashboard-components.md)
- [ADR 0010 — Reference content and nutrition](decisions/ADR-0010-reference-content-and-nutrition.md)
- [ADR 0011 — Exercise catalog and motion](decisions/ADR-0011-exercise-catalog-and-motion.md)
- [ADR 0012 — Organization nutrition and diary sharing](decisions/ADR-0012-organization-nutrition.md)
- [ADR 0013 — Organization exercise media](decisions/ADR-0013-organization-exercise-media.md)
- [ADR 0015 — Explicit feedback sources](decisions/ADR-0015-explicit-feedback-sources.md)
- [ADR 0017 — Minimal athlete injury status](decisions/ADR-0017-injury-status-minimum.md)
- [ADR 0018 — First-run and invitation onboarding](decisions/ADR-0018-first-run-invitation-onboarding.md)
- [ADR 0019 — One institutional role per dashboard](decisions/ADR-0019-single-role-dashboards.md)
- [ADR 0020 — Publish programs directly to the institution library](decisions/ADR-0020-publish-programs-to-library.md)
- [ADR 0021 — Organization workspaces are the supported web experience](decisions/ADR-0021-organization-only-web-experience.md)
- [ADR 0022 — Instance branding and local support](decisions/ADR-0022-instance-branding-and-local-support.md)
- [ADR 0024 — Direct signed Android beta APK](decisions/ADR-0024-android-beta-distribution.md)

Historical phase records and superseded documents are linked from the [archive index](archive/README.md); they are not active product or release guidance.
