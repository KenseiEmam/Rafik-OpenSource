# ADR 0008: Explicit operations and bounded organization reads

Status: Accepted, implemented locally in R11. Date: 23 September 2026.

## Context

Organizations need larger rosters without downloading every prescription or losing selected people when searching. Platform support needs operational authority independent of organizational membership. Browser acceptance previously added synthetic records to the shared preview. Local database-only recovery did not establish recovery of private bytes.

## Decision

Keep one API and PostgreSQL database. `platform_grants` is a separate, migration/operator-managed grant; the application cannot grant itself access. Platform reads return bounded operational metadata and append an access record. Writes require a reason, expected revision and stable operation UUID. Validate the current grant before replay. Account suspension revokes sessions; restoration requires sign-in again. Do not grant platform users a generic private-data browser.

Use explicit 25-row organization people/recipient APIs and separate bounded resolution of selected IDs. Summary counts cover the full authorized scope. History loads only its page and related people; analytics breakdowns and result correction history have continuation. Preserve older read shapes for already-open clients; do not advertise every legacy endpoint as a bounded hot path. Use an ordered roster index justified by the measured fixture, not an extra cache or service.

Browser acceptance owns a disposable database, file directory, API and web ports. Never reset or seed the preview to run it. Backup rehearsal restores a database dump into a disposable database, checks saved byte metadata/digests and retains a private local archive. Orphan cleanup has a 24-hour grace period and rechecks live references before deletion.

## Consequences

Operational actions are attributable, but audit retention/export and real incident monitoring remain hosting policy work. Local fixture tests do not measure production capacity. Offset pagination is stable in a static fixture; concurrent roster edits can move rows between pages. Refresh before confirming a material selection; commands validate membership/revisions atomically. Recovery rehearsal establishes local consistency, not an atomic online object-store backup. A hosted backup needs a coordinated snapshot/quiescence policy and an actual restore drill.

The provider boundaries remain small: `auth.ts` owns code issuance/session validation, `private-bytes.ts` owns immutable bytes, and `NotificationSink` owns delivery attempts. No fake generic adapter framework is introduced. Production startup stays blocked until real adapters and release controls are implemented and verified.

## Options considered and trade-offs

- **Grant broad operational authority through ordinary organization roles:** rejected because platform operations cross organization scope.
- **Load every roster/history row for convenience:** rejected because response size and UI selection must remain bounded as organizations grow.
- **Use separate grants, attributable commands and bounded reads:** selected; it requires continuation and explicit selection-resolution flows, and local fixture scale is not production capacity evidence.
