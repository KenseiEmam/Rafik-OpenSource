# Rafik API

This directory contains the TypeScript API, Prisma/PostgreSQL schema and migrations, local database Compose file, canonical exercise/food content, and backend tests. It is part of the root [`Rafik` monorepo](../README.md); its local Compose service is for development and does not deploy the application.

The current API implements the existing gym/training-organization workflows. It is not yet a supported university-hosted release. The university-first requirements, security gates, and staged roadmap are in [the root docs](../docs/README.md).

## Local database and API

Run commands from the repository root:

```sh
npm --prefix backend ci
npm --prefix backend start
npm --prefix backend run seed:local
npm --prefix backend run web-env
npm --prefix backend run start:api
```

`start` starts the local PostgreSQL Compose service, applies forward migrations, and generates Prisma. `seed:local` requires an empty database and creates synthetic local examples; never use it on a populated preview or hosted installation. `web-env` writes the ignored root `.env.local`. The API is at `http://127.0.0.1:55331`; PostgreSQL is bound to loopback port `55332`. Start the web app in another terminal with `npm run dev` from the repository root. Sample accounts and the local mail inbox are development-only.

## Ownership and checks

- `prisma/schema.prisma` and `prisma/migrations/` own database structure and forward migrations.
- `server/` owns authentication/session handling, authorization, domain operations, and private-file access.
- `content/` owns canonical content and media sources. Use the generator and rights guidance before importing material.
- `scripts/prisma/types.ts` generates root `src/lib/database.types.ts`; do not edit that generated file directly.
- Tests and detailed file/workflow ownership are documented in the [maintainer guide](docs/implementation/maintainer-guide.md), [runbook](docs/implementation/runbook.md), and [verification record](docs/implementation/verification.md).

Useful checks from the repository root:

```sh
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run test:api
npm --prefix backend run content:check
npm --prefix backend run test:docs
```

`npm --prefix backend run verify:release -- --full` is the serial local integration gate. It requires the local database/API and web dev/preview servers described in the runbook. It is not evidence of hosted operations, physical-device behavior, or university legal/privacy compliance.
