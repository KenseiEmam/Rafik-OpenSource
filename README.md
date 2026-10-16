# Rafik

Rafik is being redirected to help universities and university coaches support young athletes through training, attendance, performance, and relevant health workflows. The target is an open-source product that each university can deploy on infrastructure it controls, without a Rafik software subscription.

## Project status

The approved migration is staged in [the requirements and acceptance plan](docs/requirements/README.md). The frontend and backend histories are consolidated as npm workspaces at `apps/frontend/` and `apps/backend/`; shared transport contracts and generated database types live in `packages/shared/`. The current application still reflects the gym and training-organization product; it is not yet a supported university deployment. The single Compose file starts PostgreSQL for local development only. Secure self-hosting, injury-history workflows, cloud templates, and native apps are not implemented.

Each university is expected to operate a separate instance and control its users, data, files, secrets, backups, retention, and infrastructure. Hosting and maintenance costs are the university's responsibility.

## Technology and repository map

- `apps/frontend/`: Vue 3/TypeScript web application, Vite build, feature modules, browser persistence, and web tests.
- `apps/backend/`: TypeScript API, Prisma schema and migrations, canonical content, and API tests.
- `packages/shared/`: shared API contracts and generated database transport types used across app workspaces.
- `infrastructure/`: the one local development Compose definition; deployable university infrastructure remains a later stage.
- `docs/`: approved product requirements, target architecture, and decisions.
- `LICENSE`: Apache License 2.0 for project code and documentation. Bundled media and datasets can have separate terms; check their credits and source licenses before reuse.

## Local development

Prerequisites: Node.js 22.16.0, npm, and Docker Desktop with Compose. Open a terminal in the repository root and install all workspaces once.

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

Open `http://127.0.0.1:5173`. Local preview accounts and the test inbox are development-only; they are not production identity or email services. For local stack details and recovery limits, read [the runbook](docs/implementation/runbook.md).

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

The full local acceptance chain is documented in [the runbook](docs/implementation/runbook.md). Browser emulation does not establish physical-device behavior, and local checks do not establish hosted security or operational readiness.

## Documentation and contribution

- [Documentation index](docs/README.md)
- [Requirements, stages, and gates](docs/requirements/README.md)
- [Target architecture](docs/architecture/README.md)
- [Architecture decisions](docs/decisions/)
- [Contribution workflow](CONTRIBUTING.md)
- [Current implementation ledger](docs/implementation/ledger.md)
- [Verification record and limitations](docs/implementation/verification.md)

Work one approved stage at a time. Do not claim a feature, deployment, privacy compliance, or offline reliability until the corresponding acceptance evidence exists. Keep university legal/privacy requirements for confirmation by each institution; this project does not claim jurisdiction-specific compliance.
