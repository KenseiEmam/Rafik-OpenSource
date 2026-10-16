# Requirements and staged migration plan

**Status:** approved planning baseline, 16 October 2026. This document records the target and migration plan; it does not claim that the target has been implemented.

## Product goal

Rafik should help universities and university coaches support young athletes by tracking training, attendance, performance, and relevant health information. The software should be publicly available for self-hosting without a Rafik software subscription. Each university owns and operates its own isolated deployment, data, identity, and infrastructure costs.

## Confirmed direction

- University and university-sport workflows replace the previous gym-first acquisition direction.
- Canonical public repository target: `KenseiEmam/Rafik-OpenSource`; the authenticated GitHub rename is still pending.
- Each university runs an isolated instance on infrastructure it controls. Docker Compose self-hosting is the first deployment target. AWS, Azure, and Google Cloud templates are not part of the initial release.
- The Android field app is optional and comes after the web/backend and deployment foundations. React Native is the proposed framework, not an implementation decision.
- Default Rafik branding is retained, with per-install university branding and a small Rafik attribution planned.

## Current state and reuse map

| Area                         | Existing implementation                                                                                               | Plan                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web/API                      | Vue 3 and TypeScript frontend; separate TypeScript API; Prisma and PostgreSQL                                         | Retain as the initial technical foundation. Consolidate repositories while preserving history.                                                     |
| University organizations     | Organization memberships, role-scoped workspaces, programs, assigned training, groups, and communications             | Adapt and verify against university teams, coaches, and athlete lifecycle requirements.                                                            |
| Assessments and attendance   | Scheduled organization assessments with assessors, per-athlete results, attendance, correction history, and analytics | Reuse for sports performance workflows after reviewing metrics, permissions, and language. Do not present these as clinical diagnoses.             |
| Athlete health and injuries  | No dedicated injury status/history workflow identified in the audit                                                   | Design as a separate sensitive record lifecycle with restricted access, audit events, retention, and export rules.                                 |
| Offline                      | Browser workout recording has durable local storage and server recovery behavior                                      | Does not establish offline support for field assessments or a future native app. Specify sync and conflict rules before mobile work.               |
| Deployment                   | Local Compose file starts PostgreSQL; web and API run separately; hosting is deferred                                 | Deliver a documented, secure application Compose stack before optional cloud templates.                                                            |
| Identity and private files   | API-mediated local identity and private-file behavior; production adapters are a documented hosting gate              | Add university-controlled first-admin bootstrap and production-ready identity/file configuration before declaring hosted readiness.                |
| Open source (before Stage 2) | Two repositories; no release-ready public self-hosted package identified                                              | Consolidated locally with history in a single-workspace monorepo, Apache-2.0 for code/docs, and separate third-party/content/media rights review still required. |

## Stages and acceptance criteria

### Stage 1 — Product and architecture decisions (completed 16 October 2026)

- Record university-first requirements, current implementation/reuse map, security baseline, stage dependencies, and risks.
- Confirm a single-university isolated deployment model and Docker Compose as the first supported deployment.
- Acceptance: this document, architecture overview, and ADR are linked from the documentation index; unresolved identity, licensing, privacy, and product decisions remain explicit.

### Stage 2 — Public monorepo and release foundation

**Status: local acceptance complete; remote publication gates pending.** A clean root-lockfile install, focused workspace checks, release build, dependency/license inventory, third-party content rights verification, and disposable fresh-database migration rehearsal passed under Node 22.16.0. The formatter still reports existing style differences in 167 frontend files; these were not bulk-reformatted. The authenticated GitHub repository rename and remote CI evidence are not verified from this workspace. Review [the current verification record](../implementation/verification.md) before declaring the stage complete. Do not start Stage 3 until Stage 2 acceptance.

- Combine frontend and backend under the confirmed GitHub repository, preserving useful history and documenting the new tree.
- Apply the selected Apache-2.0 software license, contributor workflow, version/release conventions, and a clean-checkout development path.
- Audit dependency licenses and separately verify rights for exercise datasets, images, video, fonts, and other bundled media.
- Acceptance: a clean checkout can install dependencies, run documented local services, execute existing checks, and build release artifacts; no local secrets or synthetic production configuration are included.

### Stage 3 — Secure Docker Compose self-hosting

- Package the web application, API, PostgreSQL, and required routing for one isolated university deployment.
- Provide environment templates, persistent storage, health checks, forward migrations, secure secret setup, update/rollback guidance, and a first-administrator bootstrap that can only be completed once.
- Disable local-preview identities, test inboxes, synthetic seeds, and development-only defaults in production mode.
- Document backup, restore, retention, and incident responsibilities; test restoring database and private files together in a disposable environment.
- Acceptance: an operator can configure and launch an empty instance, create the initial administrator, add university users, upgrade it, and restore a verified backup using the documented procedure.

### Stage 4 — University athlete workflows and security

- Trace each retained workflow to a university task. Adapt training toward drills/agility while retaining useful strength-and-conditioning work.
- Define athlete, coach, medical/health staff, and administrator capabilities before adding sensitive health or injury records. Avoid assuming that all coaches should see all health data.
- Implement injury status/history as a distinct lifecycle with access checks, correction history, sensitive-read/change audit events, export, and retention controls. Keep performance assessments distinct from clinical diagnosis.
- Verify organization boundary enforcement, least privilege, revoked access, combined roles, audit evidence, and real user-task recovery.
- Acceptance: authorization and lifecycle tests cover allowed and denied access, including cross-organization isolation, revocation, edits/corrections, export, and audit records. A university privacy/security reviewer signs off on its deployment policy before real athlete data is used.

### Stage 5 — Branding and support

- Add instance-level logo/theme configuration with Rafik defaults and a small attribution.
- Define whether support is self-hosted/local by default or opt-in outbound. Minimize information sent to Rafik and prevent athlete health records or attachments from being included without explicit, informed action.
- Acceptance: branding survives upgrades; support behavior is documented, auditable, and cannot silently export university or athlete data.

### Stage 6 — Optional cloud templates

- Scope AWS, Azure, and Google Cloud separately after Compose acceptance. Each provider needs independent cost, secrets, networking, storage, backup/restore, upgrade, and teardown guidance.
- Acceptance: a provider template deploys an isolated instance from a clean account using documented prerequisites and demonstrates restore and upgrade. Do not claim support for providers that have not passed their own checks.

### Stage 7 — Android field app

- Confirm product tasks and API contracts before choosing the complete app architecture. React Native/Android is the current proposal; iOS is optional and separate.
- Specify device storage protection, queued command identity, retries, deduplication, conflict/reconciliation behavior, server authorization on replay, revocation handling, and clear per-record sync state.
- Acceptance: API integration tests cover duplicate delivery, lost acknowledgements, retries, changed server revisions, revoked access, and multi-device conflicts. Emulator checks and physical Android checks are reported separately; offline reliability is not claimed from compilation or mocks alone.

## Security and privacy baseline

- **Ownership:** university controls its deployment, data, users, keys, storage, backup, retention, and deletion decisions. Rafik has no default access to a self-hosted instance.
- **Isolation:** one university per deployment is the default boundary. Within it, organization/team and individual record scopes still require explicit authorization. Support or platform staff do not receive a hidden universal administrator role.
- **Permissions:** least privilege by actor, context, resource, and lifecycle; deny access by default; recheck permissions for reads, file bytes, retries, exports, and queued writes.
- **Audit:** record sensitive health/injury reads and changes, authority changes, exports, and administrative actions with actor, subject/resource, action, time, and reason where appropriate. Protect audit records from ordinary edits.
- **Transport and secrets:** require HTTPS for remote use, secure cookies, protected secrets, safe rotation, and no production credentials or sample identities in code, client bundles, logs, or fixtures.
- **Storage and recovery:** define encryption for databases, private files, backups, and mobile local records; restrict backup access; test restore of a consistent database plus its associated private bytes.
- **Data governance:** document purpose, access, consent/notice, retention, correction, export, deletion, incident handling, and university responsibility. Applicable legal/privacy obligations need confirmation by each university; this plan does not assume a jurisdiction or certify compliance.
- **Support:** no telemetry or outbound data transfer by default. Support requests should be opt-in and avoid health data by default.

## Key risks and mitigations

| Risk                                                                | Mitigation and gate                                                                                                                      |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Existing gym-first workflows are mistaken for university acceptance | Map workflows and conduct task-based review with university coaches and administrators before claiming readiness.                        |
| Injury data is exposed to staff without a valid need                | Define roles and scopes before schema/UI changes; test denied reads, revocation, sensitive-read auditing, and export boundaries.         |
| Local development identity or credentials ship in a public release  | Add production startup guards, clean-release checks, secret scanning, and no-seed verification in Stage 3.                               |
| Database backup and private files drift apart                       | Version and restore them as one recoverable set; verify checksums and application-level access after restore.                            |
| Monorepo merge loses history or breaks build/test workflows         | Preserve histories, inspect both repositories before moving files, and verify clean-checkout commands in Stage 2.                        |
| Open-source code license is confused with data/media rights         | Choose software license separately; audit every bundled dataset/font/image/video and preserve required attribution before publication.   |
| Offline mobile writes duplicate or overwrite sensitive records      | Keep mobile last; design idempotent commands, server-side authorization on replay, conflict recovery, and sync UX before implementation. |
| Support tickets transfer sensitive data outside university control  | Keep outbound transfer opt-in, minimize content, clearly disclose destination, and log the user's explicit action.                       |

## Decisions still open

These do not invalidate the approved direction, but must be settled before the dependent implementation stage:

1. **Initial identity:** recommended baseline is a one-time, local first-admin bootstrap, then university-managed account administration; assess OIDC/SAML integration as an optional institutional adapter rather than a hosted Rafik dependency.
2. **University roles:** define whether health/injury data requires a distinct medical/health-staff role, consent or guardian workflows, and which staff may read/write each field.
3. **Data governance:** each university confirms jurisdiction, age/guardian rules, retention, consent/notice, breach response, and records export/deletion requirements with its own reviewers.
4. **Support channel:** choose local-only support records versus explicit outbound ticket submission; default recommendation is no outbound transfer and no health data in tickets.
5. **Branding and release policy:** confirm minimum logo/color controls and whether university customizations must remain upgrade-compatible.

## Verification plan

The current repositories already provide frontend unit/build/format checks, frontend Playwright browser workflows, backend API/domain tests, fresh-database SQL tests, type checking, content checks, and a local release runner. Use those against the final source for applicable changes. Add focused security/lifecycle tests for each new sensitive workflow. Run deployment acceptance against disposable Docker resources, never by resetting an existing local preview. For later mobile work, distinguish API integration, emulator, physical-device, and human workflow evidence. This planning-only stage requires documentation/link/format checks, not product test suites.
