# Rafik revamp backend

A fresh, local Supabase backend for training, daily coaching, progress, check-ins, assessments and direct conversation. The broader revamp is still in progress; nutrition, booking, resources, teams and business operations remain later phases. The old platform is retained in Git history; it is not a runtime dependency. Work stays on `codex/revamp`.

## Start here

Read the [maintainer guide](docs/implementation/maintainer-guide.md) for the current architecture, full backend/frontend file map, ownership boundaries, test tour and change recipes. [CHANGELOG.md](CHANGELOG.md) records exactly what changed by phase; [ledger.md](docs/implementation/ledger.md) tracks implemented versus remaining scope. Update these records with future work as required by `AGENTS.md`.

## Start locally

Use Node **22.16.0** (`nvm use`) and a running Docker engine.

```sh
npm ci
npm start
# First setup only: resets the NEW local preview data
npm run reset
npm run web-env
npm run types
npm test
```

`reset` deletes only the new local database and restores synthetic fixtures. It does not touch the retired hosted project. The script refuses to run with linked remote-project metadata. Local API: `http://127.0.0.1:55321`; test mail: `http://127.0.0.1:55324`; PostgreSQL: port `55322`.

For an existing preview, apply new migrations with `npx supabase migration up --local` after checking that `supabase/.temp/project-ref` is absent, then regenerate types. Use `npm run test:fresh` to check a clean install without resetting the preview.

The companion frontend is expected at `../RAFIK-FRONTEND`. Run its `npm ci` and `npm run dev`, then open `http://127.0.0.1:5173`. The “Explore sample accounts” link provides synthetic coach/client accounts only during local development. These are actual local Auth accounts and transactions, not mocked server responses.

## Change the product

- Schema and transactional rules: `supabase/migrations/`.
- Exercise names, instructions and starter prescriptions: `content/starter.json`, then `npm run content`. This generates both `supabase/seed.sql` and the companion web sample. `npm run content:check` detects drift when both checkouts are present.
- Synthetic identity/history fixtures: `supabase/fixtures-users.sql`, `supabase/fixtures-history.sql` and `supabase/fixtures-coaching.sql`. Never apply these to a hosted project.
- Regression scenarios: `supabase/tests/core.sql`, `daily_coaching.sql` and `ongoing_coaching.sql`. They run in a transaction and roll back.
- Local tooling: `scripts/local.mjs`. No deployment command is exposed.

The initial migration may be rewritten while this is an unshipped local rebuild. After the first hosted release, use forward migrations; never edit a deployed migration or run the local fixture reset on a hosted database.

## Documentation

- [Audit and revival analysis](docs/revival/README.md)
- [Ongoing coaching contracts](docs/implementation/r2-contract.md)
- [Daily coaching contracts](docs/implementation/r1-contract.md)
- [Execution status](docs/implementation/ledger.md)
- [Architecture and command contract](docs/implementation/architecture.md)
- [Local operation and release gates](docs/implementation/runbook.md)
- [Verification evidence](docs/implementation/verification.md)
- [Pilot preparation](docs/implementation/pilot.md)

No native app, worker, billing, marketplace, AI, organization hierarchy, or automatic workout generation is required by this core.
