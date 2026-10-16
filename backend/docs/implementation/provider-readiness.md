# Provider boundaries and release evidence

Status: local implementation only, 23 September 2026. This document is a hosting implementation handoff, not a configured deployment.

| Capability | Implemented owner | Local evidence | Before enabling externally |
|---|---|---|---|
| Sign-in codes | `server/auth.ts`, identity challenges/sessions; local inbox | Single use, expiry/attempt limits, session revocation, origin checks, suspension | Implement real mail delivery without exposing codes; sender/domain setup, rate/abuse limits, recovery/error copy, delivery and expiry tests on hosting |
| Private files/images | `server/private-bytes.ts`, resources/program media | Immutable upload, permission/revocation, byte match, cleanup and disposable restore | Object-store adapter, scoped credentials, denied public access, lifecycle/retention, snapshot consistency, real restore and interrupted upload/delete acceptance |
| Optional notifications | `server/notifications.ts` `NotificationSink`, local intercepted sink | Preference/scope revalidation, coalescing, ordered claims, failure/retry limit | Provider idempotency contract, delivery/failure reporting, bounce/unsubscribe policy, cron/queue execution and observability; local transaction semantics cannot guarantee provider exactly-once delivery |
| Rafik subscription state | Explicit ordered provider-receipt commands, local simulator | Duplicate/out-of-order receipt rejection, entitlement transitions and readable blocked-state behavior | Choose actual product/price, verified webhook signatures, secret rotation, event reconciliation, refund/cancel/support behavior, real sandbox then authorized live acceptance |
| Calendar | Rafik-owned explicit UTC occurrences with local timezone and reviewed series | Collision/race/DST/reschedule/cancel and assessor/participant scope | External calendar sync is a separate feature contract; no integration is advertised |

Use the existing boundaries rather than adding a plugin/service layer in anticipation of providers. Keep business rules, authority and operation receipts in the owned API/database; delivery implementations may report acceptance, retryable failure or terminal failure. Never turn local email interception into a claim of external delivery.

Production startup currently rejects local configuration. Hosting requires its own approved project, PostgreSQL application/migration roles, same-origin HTTPS API, cookies/secrets, real adapters and starter content, no sample identities/inbox/simulator, release monitoring, remote CI, physical-device checks, and human observation. Keep the old-open-client read contracts until the safe-update window has passed. There is no Supabase target or legacy-data migration requirement.
