# Known issues and release gaps

This page lists verified product or operational gaps that still affect acceptance. The [beta readiness table](../operations/release-checklist.md#project-beta-readiness-19-october-2026) distinguishes publishing actions, accepted first-user backlog and institution-specific live-data gates. A gap is not described as a reproduced defect unless a failure was observed. Historical gym-first issues are kept in the [archive](../archive/README.md), not treated as current university requirements.

| Priority | Status and evidence                                                                                                                                                                                                                      | Impact                                                                    | Proposed next step                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | **First-user backlog (deferred by founder, 17 October 2026):** sport-task taxonomy and field-drill coverage have not been evaluated with a university coach. See the [Stage 4 workflow audit](../requirements/stage4-workflow-audit.md). | Existing content may not match a real university sport's tasks.           | During first-user evaluation, capture actual field tasks and decide the required taxonomy/content before claiming broad sport coverage.            |
| P1       | **First-user / pre-production backlog (deferred by founder):** university task review and institution privacy/security sign-off have not occurred. The injury workflow is limited participation status, not a clinical record.           | Local checks cannot establish usability or local policy/legal compliance. | Run with synthetic data first. Obtain institution approval before entering real athlete data.                                                      |
| P1       | **Operations backlog (first-user deployment):** retention checkpointing and failure retry exist, but deployment alert wiring/delivery are unverified. See [operations](../operations/README.md).                                         | Operators may not be notified when retention cleanup stops succeeding.    | Configure and rehearse a university-owned alert before relying on injury retention in a live deployment.                                           |
| P1       | **Pre-production release gate:** Stage 3 update/rollback rehearsal and production security review remain open; backup/restore has founder acceptance.                                                                                    | Local Compose startup does not prove safe production updates or rollback. | Complete the disposable Unix-host rehearsal and review production configuration using the [release checklist](../operations/release-checklist.md). |

**Stale offline banner — source fix, native recheck pending (19 October 2026):** transport failures now have localized messages. The signed-in runtime rechecks access after authenticated recovery or active retry and keeps roster/editor UI mounted. The final rebuilt candidate from `5d1ce76` includes the fix and passed packaging/signature checks; its physical UI check remains open. The original APK’s emulator receipt is historical evidence. See [verification](../verification/README.md).

Code-inspection hypotheses must be labeled as such and accompanied by their impact and a way to confirm them.

## Web beta evidence still to collect

**Collected in R0, 19 October 2026:** focused rendered journeys now cover later-page athlete plans, nutrition plans and events (Chromium desktop, WebKit phone, Arabic dark at 320 px), plus multi-file message send, exact retry, reload and recipient revocation. These are focused checks, not every screen, theme or device combination. See [verification](../verification/README.md#r0-beta1-close-out--19-october-2026).

**P3 — build-tool compatibility warning:** the current Vite build succeeds but warns that the JSON import in `apps/frontend/vite.config.ts` needs an import attribute for a future native config-loader default. This is a future toolchain compatibility issue, not an observed production-app failure. Address before adopting that default/major upgrade; do not suppress it as evidence of compatibility.

## Code-inspection findings — 19 October 2026

These came from reading `main` at `8ae1fbf` while preparing the [post-beta.1 release plan](../requirements/release-plan-post-beta1.md). R0 checked them in disposable browser and API runs; see [verification](../verification/README.md#r0-beta1-close-out--19-october-2026).

- **Fixed — D1:** after a workout, **Rate your session** linked to `/institution/{workspace}/trainee/feedback`, which only the not-found route matched. Reproduced in Chromium, fixed, and covered by a browser regression check.
- **P3 — H1, confirmed as dormant behavior:** changing an athlete's coach keeps their active assignment, which matches organization-owned history. Deactivating an athlete leaves the assignment `active`, but sign-in access, active-plan analytics, follow-up tasks and athlete-plan lists all exclude inactive members. **Impact:** a reactivated athlete gets the old plan back as active. **Next step:** the explicit end-assignment command planned in Release 1 slice 1c.
- **P3 — H2, audit gap:** `organization_injury_access_log` records sensitive reads and changes, but no screen or export reads it. **Next step:** founder decision on an athlete-visible access history or an operator export.

## Browser test maintenance

**P2 — stale browser specs outside CI, observed 19 October 2026:** these fail the same way on unmodified source, so they are test debt rather than product regressions. CI runs only the onboarding journey.

- `instance-branding.e2e.ts` waits for a setup field labelled **Your full name** that no longer exists.
- The first test in `organization-feedback.e2e.ts` runs `docker compose exec` without the Compose file path.
- Both tests in `responsive-inbox.e2e.ts` use superseded conversation and client-row selectors.

**Impact:** these journeys have no current automated browser coverage. **Next step:** update each spec to the current UI, or retire it in favor of an equivalent journey. The stale single-file attachment test was replaced in R0.

**P3 — revoked staff see no explanation:** after membership deactivation, a staff member's next load returns them to the workspace chooser without saying their access ended. Access and data are removed correctly. **Next step:** show a short notice on the chooser when the previous institution is no longer available.

**Repaired in Release 1b:** `organizations.e2e.ts` now creates its institution through the API instead of a retired setup button. It asserts the current outcomes of primary reassignment, revocation and the last-admin refusal.

**Repaired in Release 1c:**

- `programming.e2e.ts` now reviews workouts from Session history and adapts programs from the athlete plan detail.
- The independent-coach test that opened retired `/coach` screens was removed (ADR 0021).
- Restored the coach "Adapt this program" entry point. The 18 October browse change had left it reachable only from the athlete's own view.

**P3 — retry toast overlap:** a failed send shows a generic 5-second error toast. After a successful **Retry saved change**, that toast can stay visible for the rest of its timer next to the acknowledged message. **Next step:** close error toasts when the same command is acknowledged; this changes shared feedback, so regression-test every consumer.

## Stage 7 implementation and acceptance gaps

- **P1 — broader native acceptance open, 18 October 2026:** isolated API checks passed auth/receipt/history/conflict and membership revocation. A resumed Android emulator pass confirmed offline score replay after app force-stop, native storage initialization/header evidence, rendered history/completion, recovery share cancellation and Arabic dark recovery. Temporary-profile cleanup is complete. A later signed Android 14 emulator pass proved cold offline startup without Metro and current-format state preservation through a controlled versionCode upgrade. Physical hardware, historical/schema migration, native account switching/conflict/revocation, accessibility and broader phone coverage remain open. See [actual evidence and limits](../verification/README.md).
- **P1 — remaining Stage 7 scope/evidence:** online attendance/score correction history, server/device comparison, explicit plain-text recovery sharing and English/Arabic UI are implemented. Their populated pagination, denied reads, recovery/share behavior and locale/draft persistence need native acceptance. Instance URL scanning remains unimplemented. Text sharing rejects oversized copies without truncation; individual-item sharing is available, with assisted recovery required if an individual record exceeds the limit. No auto-import, remote wipe or secure-erasure guarantee exists.

- **P1 — unpatched tooling dependencies, corrected 19 October 2026:** the earlier zero-advisory result came from npm offline mode and is invalid as registry evidence. Explicit online audit found 27 affected package entries. The scoped Xcode UUID 11.1.1 override removes eight moderate entries; 19 high entries remain through two underlying dependencies: `braces@3.0.3` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) and `node-forge@1.4.0` ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)). No compatible patched version was available in the registry during this review; npm's proposed Expo/React Native downgrades are not accepted fixes. These paths belong to Expo/Metro and signing tooling, not the backend API dependency graph; this is not proof of zero runtime exposure. Keep build inputs trusted and development services private. Recheck upstream patches before public binary distribution; see the online [before](../verification/receipts/2026-10-19-ci-audit-before.json) and [after](../verification/receipts/2026-10-19-ci-audit-after.json) receipts.
