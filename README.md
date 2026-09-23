# Rafik backend

Rafik's local revamp uses a Vue web application, one Node/TypeScript API, Prisma and PostgreSQL. Authentication and private files go through the API; there is no Supabase runtime dependency. Coach and organization web work comes first; native and hosting remain deferred.

Work on `codex/revamp`; never push main. Read the [engineering index](docs/README.md), [ledger](docs/implementation/ledger.md), [architecture](docs/implementation/architecture.md) and [contribution guide](CONTRIBUTING.md). Organizations now have their own memberships, admin/trainer/trainee views and responsibility lifecycle. Organization-owned programs, delivery and training history are implemented; organization calendar, groups, assessor-led results and role-specific analytics are implemented locally; independent-coach teams remain a separate collaboration feature.

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
- Tests: `npm test` (rollback SQL), `npm run test:fresh` (disposable database), `npm run test:api`, `test:services`, `test:teams`, `test:organizations`, `test:programming`, `test:organization-services`, `typecheck`, `content:check`, `test:docs`.
- Full local gate: `npm run verify:release -- --full` with API and web servers on 5173/5174 running. Reports stay under ignored `artifacts/release/`.

See the [maintainer guide](docs/implementation/maintainer-guide.md) for file ownership and feature recipes, [runbook](docs/implementation/runbook.md) for operations, and [verification](docs/implementation/verification.md) for evidence and remaining limits. Update these and `CHANGELOG.md` with every phase. Old Supabase implementation is preserved in Git at `727f02d`; old product audit is under `docs/revival`.

## Organization sample accounts

At `/local-preview`, choose Rania (Madar administrator), Kareem (trainer and trainee), Sara (trainee) or Omar (a different organization). The workspace selector contains only authorized contexts. **Manage workspaces** explicitly creates an organization or activates independent coaching. See the [membership contract](docs/implementation/r7a2-contract.md) for permissions, invitation recovery and lifecycle.

## Programming and delivery

Madar has a synthetic foundation program. As Rania, open Programs, edit or duplicate sessions/weeks, preview, publish, then review recipients before assigning. As Sara, Training opens the assigned session; as Kareem, Training exposes assigned-trainee history and feedback. Programs, images and history stay within that organization. Laila's independent practice uses the same editor with its separate catalog and clients. See the [programming contract](docs/implementation/r8-contract.md).

## Calendar, assessments and analytics

Rania's Calendar shows Madar's week agenda. More contains reusable groups and assessment templates; Schedule follows Details → People → Review. Kareem sees only assigned events, and each trainee has separate attendance/results. Results can be corrected with preserved history. Analytics distinguishes organization workload/delivery from a trainer's assigned roster; Laila has separate independent coaching analytics. Sample assessment results are explicitly synthetic. See the [service contract](docs/implementation/r9-contract.md).
