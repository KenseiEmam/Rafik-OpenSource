# Engineering documentation

This is the maintained entry point for engineers working on the Rafik web/backend revamp. The runtime is local; release readiness and product success are separate claims.

## Start and contribute

1. Follow the [backend quick start](../README.md) and [web quick start](../../RAFIK-FRONTEND/README.md).
2. Read [CONTRIBUTING](../CONTRIBUTING.md): change workflow and definition of done.
3. Use the [maintainer guide](implementation/maintainer-guide.md) for the file map and feature change recipes.
4. Read [current architecture](implementation/architecture.md), [architecture decisions](decisions/README.md) and [API conventions](reference/api.md) before changing a domain contract.

## Reference and operations

- [Original role/scope audit](implementation/role-scope-audit.md): six original roles, workflow evidence, revamp mismatches and required organizational acceptance.

- [Runbook](implementation/runbook.md): local setup, recovery, support and hosted release procedure.
- [Verification](implementation/verification.md): reproducible commands, actual results and limits.
- [Product quality review](implementation/product-quality-review.md): user tasks, findings, fixes and remaining gates.
- [Feature verification map](implementation/feature-verification-map.md): user jobs, lifecycle/state checks and remaining coverage limits.
- [Release checklist](implementation/release-checklist.md): required evidence before a release.
- [Content maintenance and provenance](implementation/content.md).

## Status and historical context

- [Execution ledger](implementation/ledger.md): what is implemented and what remains.
- [Coach/organization workflow backlog](implementation/coach-workflow-backlog.md): current gaps and coach-first delivery priorities.
- [Forward roadmap after R6](implementation/forward-roadmap.md): current product assessment, R7–R12 execution order and UX/architecture acceptance gates; planned work, not shipped features.
- [Coverage register](implementation/revamp-coverage.md): scope, not a claim that every item is shipped.
- [Changelog](../CHANGELOG.md): changes grouped by checkpoint.
- [Original revival audit](revival/README.md): recorded baseline evidence and business/design rationale.

Phase contracts R1–R7 live under `implementation/`; they explain feature invariants and acceptance scenarios. They complement the current architecture, rather than replacing it. Historical verification counts describe the code checked at that checkpoint.
