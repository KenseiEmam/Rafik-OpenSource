# Contributing to Rafik

This is a staged university-first revamp. Read [the requirements](docs/requirements/README.md), [target architecture](docs/architecture/README.md), and relevant [architecture decisions](docs/decisions/) before changing behavior. The web app lives in `src/`; the API and database live in `backend/`.

## Development conventions

- Preserve Vue 3/TypeScript in the web app and TypeScript/Prisma/PostgreSQL in the API unless an approved architecture decision changes them.
- Keep permissions and transactions in explicit server/API operations. Client state and IndexedDB are not server authority or backups.
- Treat athlete health and injury information as sensitive. Define actor, context, resource, lifecycle, audit, retention, and export requirements before implementation.
- Make API/database changes with forward migrations, update generated web types from the backend, and regenerate canonical content from its sources. Do not edit generated outputs directly.
- Keep local preview identities, test mail, local credentials, and synthetic fixtures out of production configuration.
- Update root `CHANGELOG.md` and `backend/docs/implementation/ledger.md` for each stage. Update README, architecture, maintainer guide, runbook, and verification records when the corresponding setup, lifecycle, or evidence changes.
- Complete one approved stage at a time; report results and limitations, then wait for approval before starting another.

## Local setup

Use Node 22.16.0, npm, and Docker Compose. Follow the root [README](README.md) to install dependencies and start the local database, API, and web app. Seed only an empty local database. The local Compose file is a development database service, not a production deployment.

## Verification

Run the narrowest applicable tests first, then type/build/format or integration checks. Available scripts are listed in the root and `backend/package.json` files. Full browser checks use the isolated browser wrapper and disposable database; do not reset or reseed an existing preview for tests. Distinguish local API/database tests, browser emulation, physical-device checks, and university operational/legal review. Do not claim tests passed unless the commands completed successfully.

## Public distribution

Project code and documentation use [Apache-2.0](LICENSE). That license does not establish rights for third-party data or media. Preserve per-asset credits, licenses, and provenance, and complete the rights audit before release packaging. Keep `.env` and local variants private; `.env.example` may contain safe placeholders only.
