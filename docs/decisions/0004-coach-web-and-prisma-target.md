# ADR 0004: Coach-first web and Prisma/PostgreSQL hosting target

Status: Accepted direction; transition not yet implemented. Date: 23 September 2026. Source: explicit founder instruction during R7.

**Direction update (16 October 2026):** The founder later confirmed university-first product scope and isolated, university-owned installations. This ADR's gym/coach-first web priority is historical and superseded for product planning by the [requirements and staged plan](../requirements/README.md). Its Prisma/PostgreSQL and explicit API hosting target remains compatible, subject to the university deployment and security gates in the [target architecture](../architecture/README.md).

## Decision

RAFIK-FRONTEND primarily serves coaches and organization staff. Existing trainee web flows remain functional and tested, but new web UX investment prioritizes programming, client/service delivery, calendar, review and organizational operations. Trainees are expected primarily to use the native application, which remains deferred until the web/backend are ready.

The hosting target is a server application using Prisma with PostgreSQL, replacing Supabase as the deployed backend. The current Supabase local environment is an implementation/testing dependency only. Prior [ADR 0016](0016-runtime-boundary.md) describes the former runtime; its Supabase hosting choice is superseded by this decision. No deployment or native work is authorized by this direction alone.

## Transition requirements

- Introduce one explicit server API for web and eventual native consumers. Domain commands and bounded reads form the contract; neither client receives database credentials or arbitrary query access.
- Prisma owns the target schema/migration workflow. Preserve transactions, uniqueness, immutable prescriptions, revision checks and idempotency receipts when transferring command ownership. Decide deliberately which PostgreSQL constraints/functions remain; do not rewrite transaction semantics into unprotected sequential ORM calls.
- Replace Supabase Auth session handling, `auth.uid()`/Auth foreign keys, PostgREST RPC transport and Storage access. Prisma alone supplies none of those service boundaries. Select/authenticate identities server-side; explicit authorization must protect every command/read and resource download.
- Use provider-independent identity, mail and private-object interfaces. Local mail remains intercepted; a local private-file adapter must exercise upload/finalize/revoke/delete behavior. Hosting chooses actual providers with matching acceptance; no generic plugin system is required.
- Map generated domain DTOs and stable errors across the API. Web feature code must not grow new direct Supabase/provider dependencies. Contain current dependencies and retire them at the transition rather than supporting two permanent backends.
- Rebuild a fresh local PostgreSQL target with curated synthetic data and run the existing meaningful domain/HTTP/browser fault scenarios against the new API before hosting. Old inactive production data needs no migration.
- Record revised setup, operational recovery, identity/session security, authorization, private-file lifecycle and deployment gates. Preserve compatibility for still-open web versions during releases.

## Execution order

The original decision delayed the transition until R11. That timing is superseded by [ADR 0005](0005-organization-and-independent-scopes.md): after the R7 local checkpoint, R7A implements the organization/identity ownership foundation and Prisma API transition before R8 expansion. This avoids building further organizational dependencies on the superseded team model. The technology and replacement requirements above remain in force. Native follows verified web/backend readiness.
