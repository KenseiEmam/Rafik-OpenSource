# ADR 0002: State and command boundaries

Status: Accepted. Recorded 23 September 2026 from the implemented training/coaching contracts.

## Context

Unreliable networks, concurrent tabs, program changes and client corrections must not duplicate completions or silently rewrite history.

## Decision

Published plans and started prescriptions are immutable snapshots. Actual results are correctable separately. Bounded commands validate ownership and expected revisions; operations with ambiguous delivery use stable IDs and receipts. The workout logger persists edits in IndexedDB before attempting synchronization and serializes sends. Other features support explicit recoverable drafts/commands where implemented, not universal offline operation.

## Options considered

- **Treat every client write as immediately authoritative:** rejected because interruptions and lost responses make the result uncertain.
- **Keep all work only on the server:** rejected for the workout logger because temporary offline edits must survive.
- **Persist client work and use explicit, idempotent server commands:** selected; it supports recovery while keeping authorization and acknowledgment on the server.

## Consequences

The UI distinguishes device save, pending delivery and acknowledged server state. A conflict preserves local work and offers explicit recovery. New fields must travel through validation, device serialization, retry identity, export, review and analytics as relevant. A new global store, workflow engine or side-effect trigger would need an independently justified decision.
