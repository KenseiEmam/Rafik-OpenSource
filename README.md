# Rafik revamp backend

Engineering entry points: [documentation index](docs/README.md), [contribution workflow](CONTRIBUTING.md), [architecture decisions](docs/decisions/README.md).

The local Supabase backend for Rafik's coaching web application: training plans and exercise choices, client progress, check-ins, messages, optional nutrition, appointments, private files, teams/groups, coach handoffs and support. Local commercial states are simulated; hosted/device release gates remain open. The retired platform exists in Git history and is not a runtime dependency. Work stays on `codex/revamp`.

**Current direction:** web development prioritizes coaches and organization staff. The local Supabase runtime is transitional; the target is Prisma/PostgreSQL behind one API. The [role-scope audit](docs/implementation/role-scope-audit.md) documents the original six roles and the current organization gaps. R7A corrects organizational membership/ownership and the backend boundary before further programming/analytics expansion. Current teams are not a complete organizational implementation.

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
npm run test:services
npm run test:teams
```

`reset` deletes only the new local database and restores synthetic fixtures. It does not touch the retired hosted project. The script refuses to run with linked remote-project metadata. Local API: `http://127.0.0.1:55321`; test mail: `http://127.0.0.1:55324`; PostgreSQL: port `55322`.

For an existing preview, apply new migrations with `npx supabase migration up --local` after checking that `supabase/.temp/project-ref` is absent, then regenerate types. Use `npm run test:fresh` to check a clean install without resetting the preview.

The companion frontend is expected at `../RAFIK-FRONTEND`. Run its `npm ci` and `npm run dev`, then open `http://127.0.0.1:5173`. The “Explore sample accounts” link provides synthetic coach/client accounts only during local development. These are actual local Auth accounts and transactions, not mocked server responses.

## Change the product

- Schema and transactional rules: `supabase/migrations/`.
- Exercise names, instructions and starter prescriptions: `content/starter.json`, then `npm run content`. This generates both `supabase/seed.sql` and the companion web sample. `npm run content:check` detects drift when both checkouts are present.
- Synthetic identity/history fixtures: `supabase/fixtures-users.sql`, `supabase/fixtures-history.sql` and `supabase/fixtures-coaching.sql`. Never apply these to a hosted project.
- Regression scenarios: `supabase/tests/core.sql`, `daily_coaching.sql`, `ongoing_coaching.sql`, `service_delivery.sql` and `team_business.sql`. They run in a transaction and roll back.
- Local tooling: `scripts/local.mjs`. No deployment command is exposed.

Unshipped local migration files may be refined while this is a local rebuild; the current database and clean-install checks must both match the final files. After the first hosted release, use forward migrations; never edit a deployed migration or run the local fixture reset on a hosted database.

R3 enables local Supabase Storage. On an existing pre-R3 stack, run `npm stop` then `npm start` before applying migrations; stop/start preserves its database. Private uploads are limited to 10 MiB. See the runbook for interruption recovery and byte deletion. `npm run test:services` checks real local Storage and simultaneous booking with temporary synthetic accounts that it removes afterward.

## Documentation

- [Audit and revival analysis](docs/revival/README.md)
- [Team, handoff, commercial and support contracts](docs/implementation/r4-contract.md)
- [Nutrition, appointment and resource contracts](docs/implementation/r3-contract.md)
- [Ongoing coaching contracts](docs/implementation/r2-contract.md)
- [Daily coaching contracts](docs/implementation/r1-contract.md)
- [Execution status](docs/implementation/ledger.md)
- [Architecture and command contract](docs/implementation/architecture.md)
- [Local operation and release gates](docs/implementation/runbook.md)
- [Verification evidence](docs/implementation/verification.md)
- [Pilot preparation](docs/implementation/pilot.md)

The runtime remains one web app and one Supabase project. No native app, worker, payment provider, marketplace, AI service, configurable role hierarchy or automatic workout generation is required.

## Explore teams and support

Use **More → Teams** to create an optional team. Invite `coach2@rafik.test` and open the resulting link as **Nour Mahfouz** in a separate browser profile; **Laila Khoury**, **Amir Hassan**, **Nour Mahfouz** and **Dalia Saad** are available at `/local-preview`, without email codes. Enroll an existing coaching client; the client approves under **More → Teams** or the link on Today. Groups require explicit client selection before assignment. Staff sharing never grants clients file access automatically.

For existing local installs, after applying migration 008, enable the simulator only by applying `supabase/fixtures-business.sql` to the guarded local container (see runbook). New local resets already include it. Never apply this fixture to hosting. **Team subscription** displays commercial state and offers a clearly labelled local simulator to the owner. It does not charge money. **More → Support** stores a real local request; team admins reply in the app. Platform replies use `npm run support:local -- <case-id> <revision> <reply-file>`; see the runbook.

## Product quality and exercise choice

Messages now keeps history and composing in a bounded workspace, with a searchable inbox and phone back flow. Today prioritizes training; check-ins/plans/reviews handle growing lists. Coaches can offer up to three same-kind exercise alternatives in the plan editor; publish and assign the version, then the client chooses within the workout. Recorded choices flow through offline recovery, coach review and progress while original targets remain unchanged.

Read the [product quality review](docs/implementation/product-quality-review.md), [R5 contract](docs/implementation/r5-contract.md) and [release checklist](docs/implementation/release-checklist.md). The contribution rules require real user-task inspection, complete lifecycle implementation and matching docs for future work.

## Local release verification

With the local stack and both web servers running, `npm run verify:release -- --check` validates prerequisites and `npm run verify:release -- --full` executes the complete local gate serially. Reports are under ignored `artifacts/release/`; the runner never resets, deploys or pushes. See [R6 contract](docs/implementation/r6-contract.md) and [runbook](docs/implementation/runbook.md). Device/hosted/business gates remain separate.
