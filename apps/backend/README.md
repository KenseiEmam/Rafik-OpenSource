# Backend application

This workspace contains the TypeScript API, Prisma/PostgreSQL schema and migrations, canonical content, and backend tests. It is part of the [Rafik monorepo](../../README.md). The API still implements the existing gym/training-organization workflows; university hosting and product workflows are not yet implemented.

## Local operation

Run all commands from the repository root:

```sh
npm ci
npm run backend:start
npm run seed:local # only on a new, empty local database
npm run web-env
npm run start:api
```

Start the web app separately with `npm run dev`. The single local PostgreSQL Compose definition is at `infrastructure/compose.yaml`; it is not a deployment configuration. `seed:local` refuses a database that already has profiles.

## Ownership

- `prisma/schema.prisma` and `prisma/migrations/` own database structure and forward migrations.
- `server/` owns identity/session handling, authorization, domain operations and private-file access.
- `content/` owns canonical content and media sources. Follow the [content rights guide](../../docs/implementation/content.md) before importing material.
- `scripts/prisma/types.ts` generates shared database transport types in `packages/shared/`; do not edit them directly.
- Shared API request/response types are in `packages/shared/src/contracts.ts`.

Use the single [contributor guide](../../CONTRIBUTING.md), [architecture](../../docs/implementation/architecture.md), [maintainer guide](../../docs/implementation/maintainer-guide.md), [runbook](../../docs/implementation/runbook.md) and [verification record](../../docs/implementation/verification.md). Root scripts provide workspace commands such as `npm run backend:typecheck`, `npm run test:api`, and `npm run content:check`.
