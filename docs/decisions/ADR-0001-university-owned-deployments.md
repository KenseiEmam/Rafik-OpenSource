# ADR 0001: University-owned isolated deployments

- **Date:** 2026-10-16
- **Status:** Accepted; implementation is staged and incomplete.

## Context

The previous web/backend direction prioritizes gyms and training organizations, with local operation through a separate Vue frontend and TypeScript/Prisma/PostgreSQL backend. Hosting and native apps are deferred. The approved product direction is now young university athletes and university coaches, with self-hosting available without a Rafik software subscription. Each university should be able to run Rafik on infrastructure it controls.

Athlete health and injury records are sensitive. Universities need control over identity, access, data, files, backups, retention, and infrastructure. The system must distinguish training performance assessments from clinical records and must not make legal-compliance claims without jurisdiction-specific review.

## Decision

1. Treat university athlete support as the primary product direction; gym-first is historical context.
2. Use one isolated Rafik deployment per university as the default ownership and security boundary. Within the deployment, keep explicit organization/team and per-record authorization.
3. Make Docker Compose self-hosting the first deployment target. Treat AWS, Azure, and Google Cloud support as separate, later provider scopes.
4. Retain Vue 3/TypeScript, the TypeScript API, Prisma, and PostgreSQL as the starting stack unless the deployment/security audit identifies a concrete blocker.
5. Establish a one-time local first-administrator bootstrap as the recommended initial setup. The university owns later account administration. Evaluate institutional identity adapters separately.
6. Treat injury/health history as a distinct sensitive domain requiring least privilege, sensitive-read and change audit events, retention/export/correction rules, and tested revocation. Existing performance assessments are not diagnoses.
7. Keep support outbound transfer disabled by default. Any submission to Rafik must be explicit, minimized, and must not include athlete health records by default.
8. Plan the Android app after the web, API, and self-hosted release gates. Offline support requires defined durable storage, idempotency/deduplication, retry, conflict, revocation, and visible sync contracts before implementation.
9. Publish under the confirmed GitHub repository `KenseiEmam/Rafik-OpenSource`; repository consolidation and release mechanics are handled by the approved monorepo foundation stage.
10. Use Apache-2.0 for project code and documentation. Bundled datasets, images, videos, fonts, and other third-party content retain their own licenses and attribution obligations.

## Options considered

| Option                                                       | Assessment                                                                                                                                                                                           |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Continue gym-first product direction                         | Rejected for the approved revamp; it does not match the confirmed university audience. Existing useful gym features may remain where they serve the university tasks.                                |
| Rafik-hosted shared multi-university service                 | Rejected as the default because the stated goal is university-owned isolated infrastructure and data. It could only be reconsidered with an explicit change in data ownership and operations policy. |
| Independent deployment per university                        | Accepted. It gives each university control over its environment and data. It increases installation, upgrade, monitoring, backup, and support responsibilities, which must be documented.            |
| Deliver multiple cloud Terraform providers alongside Compose | Rejected for the initial release; simultaneous providers multiply operational scope.                                                                                                                 |
| Deliver Docker Compose first                                 | Accepted as the first deployment target, with cloud provider work separately gated.                                                                                                                  |
| Start mobile app before deployment/security contracts        | Rejected. Mobile offline storage and synchronization depend on stable authorization and API command semantics.                                                                                       |

## Consequences and trade-offs

- Universities are responsible for infrastructure cost, secure configuration, access administration, backups, upgrades, incident response, and privacy/legal review.
- Each installation needs a supported upgrade path and an operator-friendly recovery process. A software download alone is not a complete deployment product.
- Support cannot assume access to an installation. Diagnostics and ticket content must be intentionally shared by the university.
- Sensitive injury/health access may require roles beyond administrator, trainer, and athlete; those roles and any consent/guardian workflows are unresolved.
- A public software license does not grant rights to redistribute every dataset, image, video, font, or other content. These rights need a separate audit.
- The current backend's local identity, private-file storage, and recovery rehearsals are foundations, not proof of production adapters or hosted security.

## Open decisions

- Confirm initial identity integration, password/MFA policy, and whether OIDC/SAML is required for the first self-hosted release.
- Define university role contracts, health/injury visibility, consent and age/guardian handling.
- Obtain university-specific review of applicable privacy law, retention, breach response, and record export/deletion.
- Decide whether support remains local or offers an explicit outbound Rafik ticket flow.
- Set the minimum white-label surface and compatibility rules for upgrades.

## Verification gates

- Compose: clean install, safe bootstrap, no development fixtures, upgrade/migration, and recoverable database-plus-file restore.
- Security: authorization matrix, cross-organization denial, revoked user/session behavior, sensitive read/change audit, secure secrets and HTTPS configuration.
- Product: task-based university coach/admin/athlete review; assessments must not be misrepresented as clinical diagnoses.
- Privacy/operations: per-university retention/access policy review and confirmation of relevant local requirements.
- Mobile: duplicate, retry, lost-acknowledgement, conflict, permission-revocation, emulator, and physical-device checks before reliability claims.
