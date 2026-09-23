# ADR 0001: Runtime boundary

Status: Accepted. Recorded 23 September 2026 from the implemented revival design.

## Context

The retired product coupled multiple services and mobile-first flows before delivering immediate value. The rebuild needs a small maintainable runtime and useful web entry without mandatory organization setup.

## Decision

Use one Vue 3/TypeScript application and one Supabase project (Auth, Postgres/PostgREST, private Storage). Organize the web code by product feature. SQL commands own atomic domain operations and authorization. Use fixed optional team roles. Defer native, marketplace, worker and external provider adapters.

## Consequences

Fewer deployment boundaries and a direct local test setup. SQL is application code and needs review, tests and migration discipline. The browser must handle server errors and durable local work explicitly. External delivery/payments require later adapter contracts and operational evidence; simulated local state does not provide them.
