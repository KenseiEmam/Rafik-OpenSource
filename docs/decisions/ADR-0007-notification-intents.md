# ADR 0007: Transactional notification intent capture

Status: accepted and implemented locally, 23 September 2026. Real delivery remains a deployment gate.

## Context

Notifications must reflect a committed domain change and current recipient authority/preferences. Sending through a provider inside the domain write could fail or time out after the source transaction commits.

## Decision

Capture generic notification intents in the authoritative transaction, using a narrowly owned set of PostgreSQL AFTER triggers. This is an explicit exception to the earlier blanket no-trigger rule. Capture only records event identity, recipient and source references. It does not mutate another domain, complete training, calculate progression, schedule external work or contact a provider. The SQL regression allows the named capture function and still rejects unrelated assignment/session orchestration triggers.

One TypeScript dispatcher rechecks current permission, source state and preferences. Per-organization then per-recipient locks serialize membership/preference decisions. Each intent gets a separate transaction, bounded retries and a stable sink identity. The local sink records generic text in PostgreSQL; it never sends email. Notification read state and sink acceptance are separate. Reminders use one API-only bounded function rather than granting the API login unrestricted reads of independent personal records.

## Alternatives and consequences

Duplicating intent creation in every legacy SQL command and every Prisma command would create omission risks and two capture conventions. Provider calls inside domain writes would couple training persistence to a remote service. A general event bus/worker platform is unnecessary at this stage.

Capture adds database write work to domain transactions and must stay small and covered by atomicity tests. Sink failures do not roll back original messages/results. The local transactional receipt demonstrates local deduplication, not remote exactly-once delivery. Hosting must select a single dispatch mechanism and implement provider-specific idempotency, timeout, lease and callback acceptance before enabling outbound delivery. Retain notification prompts for 30 days and intercepted preview records for seven days; neither retention rule deletes source history.
