# Documentation

This is the single maintained documentation tree for the Rafik monorepo. Root [README](../README.md) covers clean setup; [CONTRIBUTING](../CONTRIBUTING.md) defines change and verification practice.

## Product and architecture

- [University requirements and staged plan](requirements/README.md): goals, current-state audit, acceptance criteria, risks, and privacy/security gates.
- [Target architecture](architecture/README.md): current component boundaries and university-owned deployment model.
- [Architecture decisions](decisions/): accepted tradeoffs, including [ADR 0006: the Prisma API transition](decisions/0006-prisma-api-transition.md) and the original [runtime boundary](decisions/0001-runtime-boundary.md).
- [Testing and verification](testing/README.md): local commands, scope, and evidence limits.
- [API reference](reference/api.md): transport, error, retry and pagination conventions.

## Engineering and operation

- [Implementation ledger](implementation/ledger.md): current status and accepted phases.
- [Current architecture](implementation/architecture.md): data ownership, API boundaries and lifecycle contracts.
- [Maintainer guide](implementation/maintainer-guide.md): application file map and change recipes.
- [Local operation and release runbook](implementation/runbook.md): services, recovery and release prerequisites.
- [Verification record](implementation/verification.md): commands actually run, evidence and limits.
- [Feature verification map](implementation/feature-verification-map.md): user jobs, lifecycle/state checks and coverage limits.
- [Release evidence](implementation/release-evidence.md) and [release checklist](implementation/release-checklist.md): local results and outstanding gates.
- [Content maintenance and provenance](implementation/content.md): canonical data and media rights.

## Audits and historical context

- [Original product and business audit](revival/README.md): preserved source review and historical rationale.
- [Role and scope audit](implementation/role-scope-audit.md): legacy roles, workflow evidence and required authorization checks.
- [Coverage register](implementation/revamp-coverage.md): retained, replaced, deferred and defective capabilities.
- [Forward roadmap](implementation/forward-roadmap.md): recorded dependency and UX constraints; the root requirements document owns current stage order.
- [Historical feature contracts](implementation/): phase records explain invariants and evidence for their stated checkpoint; they are not claims about current university workflow coverage.

The implementation directory also contains the current runbooks, audits, accepted decisions, and dated phase evidence. Archived artifacts remain historical and do not override the university-first requirements above.
