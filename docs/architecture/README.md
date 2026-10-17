# Rafik architecture

**Status: current architecture, 17 October 2026.** The university-owned Compose deployment and Stage 5 prototype workflows are implemented locally. Optional Stage 6 provider-specific VM templates exist as unverified starters. Stage 7 has an accepted coach-first Android architecture; native authentication and app implementation have not started. The [requirements and stage gates](../requirements/README.md) define delivery status; this page describes the system as it exists and the constraints new work must preserve.

## Repository components

| Component                     | Responsibility                                                                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/frontend/`              | Vue 3 and TypeScript web application. Presents public and organization-scoped administrator, trainer and athlete tasks; stores recoverable drafts and queued commands in browser storage. |
| `apps/backend/`               | TypeScript HTTP API, Prisma schema/client, PostgreSQL migrations, domain authorization, content sources, and private-file lifecycle.                                                      |
| `packages/shared/`            | Shared API contracts and generated database transport types.                                                                                                                              |
| `infrastructure/compose.yaml` | One Compose definition with local-development and self-host profiles. Production profile runs PostgreSQL, migration job, API, web and Caddy.                                              |

The browser calls the API; it never connects directly to PostgreSQL or receives database credentials. PostgreSQL is the durable server store. IndexedDB is for recoverable client work, not backup or acknowledged server state.

The accepted Stage 7 Android app will call the same explicit API using a separate short-lived bearer-session boundary. Its encrypted local SQLite queue is for pending field commands only; it does not establish server acknowledgment or replace PostgreSQL. See [ADR 0023](../decisions/ADR-0023-android-coach-field-app.md). Native authentication and client code are not implemented yet.

## Identity, institution and authorization

Each university runs a separate instance and owns its users, data, secrets, files, backups, retention and infrastructure. There is no default Rafik-hosted tenant or operator access. The supported web experience is organization-scoped. Legacy independent-coaching data and APIs remain isolated during transition, but standalone coach screens are retired; see [ADR 0021](../decisions/ADR-0021-organization-only-web-experience.md). Organization-owned training history belongs to the organization and survives a trainer reassignment.

Every institutional membership has one role: administrator, trainer or athlete. Sign-in opens that role's dashboard; there is no role selector. Administrators manage people, permissions, analytics and programs; trainers receive coaching tools; athletes receive their own training and support navigation. Sidebar groups collapse so the primary navigation stays compact. The platform-administrator grant is separate and appears only for explicitly authorized operators.

Every protected request is authorized against the current actor, selected organization context, resource and lifecycle state. The API derives available actions from its own capabilities; hiding a navigation link is not authorization. Assignment changes or revocations must take effect on subsequent reads, commands and retries. A forward migration reduces legacy multi-role memberships and invitations to one role, prioritizing administrator, then trainer, then athlete; it clears a trainer assignment if that membership no longer retains the athlete role. The [role and scope audit](../requirements/role-scope-audit.md), [ADR 0005](../decisions/ADR-0005-organization-and-independent-scopes.md) and [ADR 0019](../decisions/ADR-0019-single-role-dashboards.md) record this model.

## Commands and durable client work

Domain writes use explicit API commands. The server validates current authority and input, then records related state and its command receipt transactionally. Revision checks, stable operation identifiers and server-owned authorization prevent stale edits or replay from silently creating another result. Client persistence, request dispatch and server acknowledgment are distinct states; the UI must not report a cloud save before acknowledgment. See the [API conventions](../reference/api.md) and [Prisma API ADR](../decisions/ADR-0006-prisma-api-transition.md).

## Organization data boundaries

- Programs, assignments and published training history are organization-scoped. Publishing creates an immutable version and makes the program available in the institution library without a separate visibility hold; assignment is still explicit. A trainer’s access follows current assignment; reassignment does not transfer unrelated personal data.
- Training groups are reusable scheduling rosters. Administrators can include active coaches and athletes; trainers can manage their own groups of assigned athletes. Selecting a group preselects coaches as event staff and athletes as participants, while each event keeps its own fixed roster.
- Messages are participant-scoped. Direct conversations have one institution-wide record per participant pair; each training group has one linked conversation. The conversation list search also matches the other participant’s name in direct conversations, and reports existing pair members so they no longer appear as new People choices. Existing duplicate direct conversations are archived by the forward migration so their message history remains retained.
- Publishing a program exposes its immutable version in the institution library. Other coaches can review it and assign it only to athletes currently assigned to them; drafts remain private to their author and administrators.
- Assessments are assessor-led performance records with defined units and correction history. They are not clinical findings.
- Nutrition plans and athlete-recorded actuals have separate ownership and sharing choices. Withdrawal or reassignment is checked before later reads or command replay.
- Injury participation status is an explicitly limited, consent-gated vertical slice. Coaches see only the assigned athlete’s current status and effective date. Athletes can review, correct, close, withdraw and export their records. The product deletes closed content after 12 months. University privacy/security approval is still required before real athlete data is used. See [ADR 0017](../decisions/ADR-0017-injury-status-minimum.md) and the [Stage 4 workflow audit](../requirements/stage4-workflow-audit.md).
- Exercise names, instructions, still images and videos have separate sources and rights. The software license does not grant rights to bundled media. Manifests pin their source, attribution, license and content hashes; unreviewed assets must not be imported.

## Self-hosted operation

The self-host Compose profile keeps PostgreSQL on an internal container network. Caddy provides HTTPS ingress; the API serves authenticated operations and private-file bytes and stores files on a persistent Docker volume. On an empty instance, the first completed setup creates the super admin and institution in one transaction; setup is then closed. Password sign-in does not depend on mail. Admins create one-time invitations that expire after seven days and share them directly with invitees. Each instance has its own project name, credentials and volumes. No SMTP service, Google service-account key or cloud service credential is required. Keep the instance private until initial setup is complete.

Optional AWS, Google Cloud and Azure starter templates create one VM and provider-specific network/access resources, then prepare the same Compose deployment. PostgreSQL and private files remain on the VM's persistent disk. The templates do not provision managed databases, object storage, DNS, backups or monitoring and are not yet provider-verified. See the [cloud deployment guide](../../infrastructure/cloud/README.md).

Use the [infrastructure guide](../../infrastructure/README.md) for first deployment, [development](../development/README.md) for local setup and [operations](../operations/README.md) for secrets, backups, restore, updates and retention monitoring. Production readiness still depends on the open release and university review gates.

## Instance branding and support boundary

Instance name, accent, custom light/dark page backgrounds and optional logo are stored in PostgreSQL so they survive image upgrades and are included in the normal database backup. Surface colors derive from the page backgrounds, and text/accent colors adjust for contrast. The initial super admin owns these settings; active institution administrators can see the branding panel but cannot change it. The API validates image signatures and permits PNG, JPEG or WebP up to 512 KB. The logo endpoint serves only the configured public brand image with a fixed content type and `nosniff`; no SVG, remote logo URL, arbitrary CSS or script is accepted. Rafik attribution remains visible. Support cases and diagnostics remain local; no telemetry or email delivery is configured.

## Data-flow boundary

```mermaid
flowchart LR
  U[University users] -->|HTTPS| C[Caddy ingress]
  C --> W[Vue web app]
  C --> A[TypeScript API]
  A --> D[(University PostgreSQL)]
  A --> F[Private file volume]
  D -. paired backup .-> B[University-controlled backup]
  F -. paired backup .-> B
```

No default telemetry or outbound data transfer is configured. Optional support flows must be explicit and must not include athlete health data by default. Browser drafts and queued commands are not part of server backup; server database and private files must be backed up and restored together.

## Related decisions

- [ADR 0001: university-owned deployments](../decisions/ADR-0001-university-owned-deployments.md)
- [ADR 0005: organization and legacy independent-data boundaries](../decisions/ADR-0005-organization-and-independent-scopes.md)
- [ADR 0006: Prisma API, identity and file boundary](../decisions/ADR-0006-prisma-api-transition.md)
- [ADR 0017: minimal injury-status boundary](../decisions/ADR-0017-injury-status-minimum.md)
- [ADR 0019: one institutional role per dashboard](../decisions/ADR-0019-single-role-dashboards.md)
- [ADR 0021: organization-only supported web experience](../decisions/ADR-0021-organization-only-web-experience.md)

Previous architecture notes are preserved as dated material in the [documentation archive](../archive/README.md); they are not current implementation guidance.
