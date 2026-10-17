# ADR 0006: Own the API, identity and file boundary on Prisma/PostgreSQL

Status: accepted and implemented locally, 23 September 2026. Supersedes the former Supabase hosting boundary.

## Context

The browser and backend need one explicit owner for identity, authorization, durable commands and private files. Supabase was an earlier local prototype, not the approved university deployment runtime. The Prisma/PostgreSQL API must preserve transactional SQL and row-level command boundaries without creating duplicate business rules.

## Decision

Use one TypeScript HTTP service with Prisma and standalone PostgreSQL. Replace Supabase identity, browser RPC/REST and file services. Retain tested SQL transactions and RLS for domain commands rather than duplicating locking, replay and snapshot rules in an ORM service layer. Prisma owns migration execution, model generation and application database access; it is not a second implementation of the same business rules.

The application login cannot inherit domain privileges. Each command/read opens a transaction, selects the fixed guest/user role and installs verified actor settings with transaction-local lifetime. Server-owned registries expose only granted functions/row projections and bind all values. Identity tables and opaque session cookies are controlled by the API. File metadata stays in PostgreSQL; local bytes use an explicit private adapter.

## Options considered

- **Deploy the prior Supabase Auth/RPC/Storage runtime:** rejected for the university-owned server target.
- **Keep Supabase and add a second Prisma API:** rejected because duplicate identity and business boundaries would invite split authority.
- **Use one explicit TypeScript API with Prisma/PostgreSQL and preserve tested SQL transaction semantics:** selected.

## Consequences

There is one active backend, no browser SDK/service key and no legacy migration requirement. Existing durable commands keep their contract. Fresh schema tests exercise all custom SQL because ORM introspection alone cannot reproduce checks/functions/RLS. HTTP/browser tests are required in addition to SQL tests: error and response semantics are observable product behavior.

Local mail, fixed preview identities, synthetic seed and filesystem storage are deliberately local-only. Production startup refuses these defaults; hosting must supply secure configuration and verified mail/object-store/operational adapters. This phase does not turn independent-coach teams into organizations; the distinct organization ownership model is R7A2.
