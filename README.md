# Rafik backend

Rafik's local revamp uses a Vue web application, one Node/TypeScript API, Prisma and PostgreSQL. Authentication and private files go through the API; there is no Supabase runtime dependency. Coach and organization web work comes first; native and hosting remain deferred.

Work on `codex/revamp`; never push main. Read the [engineering index](docs/README.md), [ledger](docs/implementation/ledger.md), [architecture](docs/implementation/architecture.md) and [contribution guide](CONTRIBUTING.md). Organizations are the next ownership phase; the existing independent-coach teams are not an organization implementation.

## Local setup

Use Node 22.16.0 and Docker, with `RAFIK-FRONTEND` adjacent to this checkout.

```sh
nvm use
npm ci
npm start
npm run seed:local
npm run web-env
npm run start:api
```

`npm start` starts PostgreSQL, applies forward Prisma migrations and generates the Prisma client. `seed:local` accepts an empty database only and installs synthetic examples. Skip it on an existing preview. API: `http://127.0.0.1:55331`; database: port `55332`. Start the companion web app with `npm ci` and `npm run dev`, then open `http://127.0.0.1:5173`.

Use **Explore sample accounts** to inspect Laila, Amir, Nour and Dalia without codes. Real local email-code sign-in is also available; codes remain in the [local inbox](http://127.0.0.1:55331/local/inbox), never sent externally. `npm run dev:api` enables API autoreload during development. Use the stable `start:api` process during acceptance checks.

## Change and verify

- Domain: `prisma/migrations/` owns database schema, transactional commands and RLS; `prisma/schema.prisma` describes ORM models. Add forward migrations, then `npm run db:migrate`, `db:generate` and `types`.
- HTTP and identity: `server/`; [API conventions](docs/reference/api.md) document errors, cookies, pagination and replay.
- Content: edit `content/starter.json`, then `npm run content`. Generated outputs are `prisma/seed.sql` and the companion web sample.
- Tests: `npm test` (rollback SQL), `npm run test:fresh` (disposable database), `npm run test:api`, `test:services`, `test:teams`, `typecheck`, `content:check`, `test:docs`.
- Full local gate: `npm run verify:release -- --full` with API and web servers on 5173/5174 running. Reports stay under ignored `artifacts/release/`.

See the [maintainer guide](docs/implementation/maintainer-guide.md) for file ownership and feature recipes, [runbook](docs/implementation/runbook.md) for operations, and [verification](docs/implementation/verification.md) for evidence and remaining limits. Update these and `CHANGELOG.md` with every phase. Old Supabase implementation is preserved in Git at `727f02d`; old product audit is under `docs/revival`.
