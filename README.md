# Rafik revamp backend

A fresh, local Supabase backend for plan delivery, dependable workout recording, and coach review. The old platform is retained in Git history; it is not a runtime dependency. Work stays on `codex/revamp`.

## Start locally

Use Node **22.16.0** (`nvm use`) and a running Docker engine.

```sh
npm ci
npm start
npm run reset
npm run web-env
npm run types
npm test
```

`reset` deletes only the new local database and restores synthetic fixtures. It does not touch the retired hosted project. The script refuses to run with linked remote-project metadata. Local API: `http://127.0.0.1:55321`; test mail: `http://127.0.0.1:55324`; PostgreSQL: port `55322`.

The companion frontend is expected at `../RAFIK-FRONTEND`. Run its `npm ci` and `npm run dev`, then open `http://127.0.0.1:5173`. The “Explore sample accounts” link provides synthetic coach/client accounts only during local development. These are actual local Auth accounts and transactions, not mocked server responses.

## Change the product

- Schema and transactional rules: `supabase/migrations/`.
- Exercise names, instructions and starter prescriptions: `content/starter.json`, then `npm run content`. This generates both `supabase/seed.sql` and the companion web sample. `npm run content:check` detects drift when both checkouts are present.
- Synthetic identity/history fixtures: `supabase/fixtures-users.sql` and `supabase/fixtures-history.sql`. Never apply these to a hosted project.
- Regression scenarios: `supabase/tests/core.sql`. They run in a transaction and roll back.
- Local tooling: `scripts/local.mjs`. No deployment command is exposed.

The initial migration may be rewritten while this is an unshipped local rebuild. After the first hosted release, use forward migrations; never edit a deployed migration or run the local fixture reset on a hosted database.

## Documentation

- [Audit and revival analysis](docs/revival/README.md)
- [Daily coaching contracts](docs/implementation/r1-contract.md)
- [Execution status](docs/implementation/ledger.md)
- [Architecture and command contract](docs/implementation/architecture.md)
- [Local operation and release gates](docs/implementation/runbook.md)
- [Verification evidence](docs/implementation/verification.md)
- [Pilot preparation](docs/implementation/pilot.md)

No native app, worker, billing, marketplace, AI, organization hierarchy, or automatic workout generation is required by this core.
