# Rafik

Repository: [`KenseiEmam/Rafik-OpenSource`](https://github.com/KenseiEmam/Rafik-OpenSource).

Rafik is being redirected to help universities and university coaches support young athletes through training, attendance, performance, and relevant health workflows. The target is an open-source product that each university can deploy on infrastructure it controls, without a Rafik software subscription.

## Project status

The approved migration is staged in [the requirements and acceptance plan](docs/requirements/README.md). The frontend, backend and early Android app are npm workspaces under `apps/`; shared transport contracts and generated database types live in `packages/shared/`. The application has a university-oriented organization foundation and a self-host Compose profile. Stage 7 Android coach workflows are in progress; first-user and pre-production gates remain open, so this is not declared production-ready for real athlete data. Optional cloud-template checks remain deferred to user testing.

Each university is expected to operate a separate instance and control its users, data, files, secrets, backups, retention, and infrastructure. Hosting and maintenance costs are the university's responsibility.

## Technology and repository map

Explore the supported coach API in [local Swagger UI](http://127.0.0.1:55331/v1/docs) after starting/restarting the updated backend. See the [API guide](docs/reference/api.md) for authentication and self-hosted URLs.

- `apps/frontend/`: Vue 3/TypeScript web application, Vite build, feature modules, browser persistence, and web tests.
- `apps/backend/`: TypeScript API, Prisma schema and migrations, canonical content, and API tests.
- `apps/mobile/`: Expo/React Native coach app with a local field cache/queue; see the [Android development guide](docs/development/android.md) for current workflow and acceptance limits.
- `packages/shared/`: shared API contracts and generated database transport types used across app workspaces.
- `infrastructure/`: the single Compose definition, Unix operator scripts and optional cloud VM templates; see the [deployment guide](infrastructure/README.md) and [cloud templates](infrastructure/cloud/README.md).
- `docs/`: approved product requirements, target architecture, and decisions.
- `LICENSE`: Apache License 2.0 for project code and documentation. Bundled media and datasets can have separate terms; check their credits and source licenses before reuse.

## Local development

Prerequisites: Node.js 22.16 or Node.js 24, npm, and Docker Compose. The production images use the pinned Node.js 22.16 runtime. Open a terminal in the repository root and install all workspaces once.

```sh
npm ci
npm run backend:start
npm run seed:local # first empty local database only
npm run web-env
```

Seed only a newly created, empty local database. Do not run the seed command against a database with data you want to keep. Then start the API and web app in separate terminals:

```sh
npm run start:api
```

```sh
npm run dev
```

Open `http://127.0.0.1:5173`. A new empty database opens the super-admin setup form; seeded local databases use the local preview accounts for demonstrations. For sample identities, recovery steps and verification limits, read the [development guide](./docs/development/README.md) and [operations guide](./docs/operations/README.md).

## University self-hosting

The repository documents a Docker Compose deployment for a Unix server controlled by the university. It uses PostgreSQL on an internal container network, the API, web app and Caddy HTTPS. First launch creates a super-admin account without email verification; invitations are shared as expiring, single-use links. Keep a new instance on a private network until setup is complete. Each university sets its own instance name, domain, secrets, backups and retention operations. Start with the [infrastructure deployment guide](infrastructure/README.md) and follow the [production runbook](./docs/operations/README.md).

```sh
cp infrastructure/.env.selfhost.example infrastructure/.env.selfhost
# Edit the file with the university's unique instance, domain and credentials.
docker compose --env-file infrastructure/.env.selfhost -f infrastructure/compose.yaml --profile selfhost up -d --build
```

The Compose profile is an implemented deployment foundation, not a production-readiness claim. Complete the Stage 3 upgrade/rollback and university operations gates, and obtain the Stage 4 privacy/security review before using real athlete data. Do not use local sample accounts or synthetic seed data on a hosted instance.

## Checks

From the repository root:

```sh
npm test
npm run format:check
npm run build
npm run test:e2e
```

Backend checks:

```sh
npm run backend:typecheck
npm run backend:test
npm run test:api
npm run content:check
npm run docs:check
```

Android field queue checks:

```sh
npm run typecheck --workspace @rafik/mobile
npm run test:queue --workspace @rafik/mobile
```

The full local acceptance chain is documented in [the runbook](./docs/operations/README.md). Browser emulation and Node SQLite checks do not establish native-device behavior, and local checks do not establish hosted security or operational readiness.

## Documentation and contribution

- [Documentation index](docs/README.md)
- [Coach field OpenAPI contract](apps/backend/openapi.json), served per instance at `/v1/openapi.json` for Swagger UI imports.
- [Requirements, stages, and gates](docs/requirements/README.md)
- [Target architecture](docs/architecture/README.md)
- [Development setup and workflows](docs/development/README.md)
- [Testing strategy](docs/testing/README.md)
- [Operations and release](docs/operations/README.md)
- [Known issues and release gaps](docs/known-issues/README.md)
- [Architecture decisions](docs/decisions/)
- [Contribution workflow](CONTRIBUTING.md)
- [Security vulnerability reporting](SECURITY.md)
- [Current implementation ledger](./docs/development/ledger.md)
- [Verification record and limitations](docs/verification/README.md)

Work one approved stage at a time. Do not claim a feature, deployment, privacy compliance, or offline reliability until the corresponding acceptance evidence exists. Keep university legal/privacy requirements for confirmation by each institution; this project does not claim jurisdiction-specific compliance.
