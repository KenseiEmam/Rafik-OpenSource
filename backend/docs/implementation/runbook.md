# Local operation and release runbook

**Monorepo setup, 16 October 2026:** commands in the blocks below assume the working directory is `backend/`. From the repository root, use `npm --prefix backend <command>`. Install dependencies with `npm ci` at the root and `npm ci` in `backend/`. The Compose service currently starts a local development database only; it is not the planned university deployment stack. See the root [README](../../README.md) for the consolidated quick start and the root [stages](../../../docs/requirements/README.md) for self-hosting acceptance gates.

## Feedback local operation

Apply migrations with `npm run db:migrate`, then generate the Prisma client/types; no reset/reseed is required. Feedback needs no scheduler or external delivery provider. The workplace month is UTC, supplied by the server; stale-month submissions have an explicit reload path. Session source eligibility and organization membership are rechecked before retries. Run `npm run test:organization-feedback` for source/scope/retry/reporting/export checks. Native and hosted evidence remain separate.


## Session-package local checks

Organization packages now track explicit trainee entitlements, derived available/reserved/used balances, validity dates, auditable allowance corrections and linked renewals. Calendar booking reserves only an explicitly selected package; completion consumes present/charged absent sessions, cancellation/excused/released no-shows release, and independent trial/makeup/prize/other sessions never affect allowances. Staff session details include check-in timestamps and durable notes; the overview surfaces missed sessions without a replacement. Reuses workspace transactions/receipts and existing calendar events; no parallel scheduler or payment processor.

Apply forward migrations and regenerate the Prisma client on an existing preview; do not reseed it. Run `npm run test:organization-packages` for accounting and authorization checks. The companion web command `npm run test:e2e -- organization-packages.e2e.ts` owns a disposable browser database. See [the package contract](r20-session-packages.md) and [verification](verification.md).


## Environment and startup

Use the approved university-revamp branch, Node 22.16.0 and Docker. Never push main. Do not copy old hosted credentials.

The current stack is `rafik-prisma-local`: PostgreSQL 17 on loopback 55332, API on loopback 55331, web on 5173 and production preview on 5174. `compose.yaml` contains synthetic local-only credentials. `prisma.config.ts` reads the migration connection; `server/db.ts` uses the restricted application connection. No Supabase service is required.

```sh
# Backend
nvm use
npm ci
npm start
npm run seed:local # first empty installation only
npm run web-env
npm run start:api # keep running in this terminal

# Web, separate terminal
nvm use
npm ci
npm run dev

# Web production preview, another terminal
npm run build
npm run preview -- --port 5174 --strictPort
```

`npm start` applies forward migrations and generates Prisma. `npm run dev:api` watches TypeScript for development; use `start:api` during final tests so an edit cannot restart the server during a journey. `npm stop` stops only the new Compose database and preserves its volume. Stop the API with Ctrl-C. No automatic reset command is provided. Apply schema changes with `npm run db:migrate`, then `npm run db:generate` and `npm run types`; restart the API to refresh its server-owned command registry.

The previous local Supabase volumes are retained separately; they are not a runtime dependency or a migration source. Do not restart them for normal development.

## Sign-in and local examples

Open `http://127.0.0.1:5173/local-preview` for the fixed synthetic sample accounts. Email-code entry uses a ten-minute, single-use code with bounded attempts and resend rate limits. Local deliveries are intercepted at `http://127.0.0.1:55331/local/inbox`; machine-readable messages are at `/local/mail`. No external recipient is contacted. Separate browser profiles preserve different accounts for coach/client walkthroughs. Session cookies are HttpOnly; logout revokes the server session.

A public sample requires no account. Client workspace routes use relationship IDs; Laila/Amir is `40000000-0000-4000-8000-000000000001`. Teams remain independent-coach collaboration. Organization membership views are separate. Follow the domain tours in the maintainer guide.

## Verification

`npm test` and `npm run test:fresh` both run the fresh-install harness: create a disposable database, apply Prisma migrations and synthetic fixtures, run all eight rollback SQL suites and drop only that database. Normal preview use cannot contaminate their canonical fixture assumptions. It does not reset the preview. `test:api` checks actual identity/HTTP/access/file contracts; `test:services` and `test:teams` exercise domain lifecycles through the real API with temporary local identities.

Run backend `typecheck`, `content:check`, `test:docs` and `test:release`. In the web checkout run `npm test`, `format:check`, `build`, `test:build`, then `test:e2e`. Playwright requires installed Chromium/WebKit and all three servers. Run full suites serially, with a stable API and final web build. Layout scripts inspect populated bilingual/theme/viewport states; inspect actual captures as well.

`npm run verify:release -- --check` checks prerequisites. `--full` runs the cross-repository chain and writes a timestamped report under `artifacts/release/`. A lock prevents parallel full runs; remove a stale lock only after verifying its run exited. Browser artifacts and traces stay ignored because they may contain test identities and private content. CI configuration is committed; remote CI is unverified until actually run.

## Content and schema changes

Edit `content/starter.json`, then `npm run content` and `content:check`. The generator composes local fixtures from `prisma/fixtures/`; never seed hosting. A content change affects fresh fixtures, not historical publications. Publish a new version for future assignments rather than rewriting started prescriptions.

Add a forward SQL migration under `prisma/migrations/<timestamp>_<name>/migration.sql`. Keep checks, RLS and transactional functions in that migration; Prisma introspection cannot express all of them. Run `db:migrate`, introspect when models change (`npx prisma db pull`), `db:generate`, `types`, and relevant SQL/HTTP/browser checks. Inspect the generated diff. Do not edit a previously released migration or use schema push/reset as a release process.

## Support and recovery

- Device drafts and acknowledged server state are separate. Reconnect under the same account and retry the exact pending command. Confirmed validation errors unlock correction; an unknown delivery outcome preserves the command ID and payload.
- Conflicts keep typed work. Download the local draft before deliberately loading the server state. Never auto-merge completed sets.
- Private bytes live under ignored `.local/files/`, keyed by a hash of the registered path. Upload is immutable; retirement revokes grants before deletion. Retry interrupted cleanup through the API. Never expose this directory as static public assets.
- Account export includes record/file metadata; file downloads provide bytes separately. Account deletion requires owned-byte cleanup and applicable team ownership resolution first.
- `npm run support:local -- <case-id> <revision> <reply-file>` performs a guarded local operator reply. It does not send external messages or expose operator authority to browsers.
- Business simulation is enabled only by synthetic local fixture configuration. No charges, checkout or payment provider are connected.
- Settings/Help explains device diagnostics and application update status. The static worker never caches API responses; updates wait for old tabs to close and do not interrupt workouts.

## Hosting gate (deferred)

Production startup deliberately refuses to run with these local adapters. Before deployment, configure PostgreSQL application/migration roles, HTTPS same-origin API routing, secure cookies, secret management, real mail and private object storage adapters, origin configuration, identity/session cleanup and operational monitoring. Never enable local preview accounts/inbox/simulation or apply synthetic seeds to hosting. Supply accurate operator/privacy/retention information and a production-owned starter version.

Demonstrate backup/restore of database plus private bytes, migration/rollback procedure, controlled hosted identity/file/retry checks, remote CI, physical phone/assistive-technology checks and human task observation. Native stays last. Local automated success is not evidence of deliverability, payments, retention or physical-device readiness.

## Organization review

Local preview includes **Rania Mansour** (Madar administrator), **Kareem Nasser** (Madar trainer and trainee), **Sara Khalil** (Madar trainee) and **Omar Saleh** (Athar administrator). Switch roles using the workspace selector. Organization settings and people management are admin-only; Kareem sees only assigned trainees in his trainer view. **Manage workspaces** provides deliberate independent-coaching or organization setup. An invitation produces a verified-email link; share only through an authorized channel, with no implied automatic email.

`npm run test:organizations` runs isolated actual HTTP scenarios. Organization fixtures are part of the empty-local seed. Additive local fixture changes must be explicitly bounded to synthetic IDs; never seed hosting or reset the preview merely to apply them. Organization-owned program/session/service workflows follow this membership checkpoint.

## R8 local maintenance

Apply forward migrations with `npm run db:migrate`, regenerate Prisma with `npm run db:generate`, then `npm run types`. `npm run test:programming` runs isolated organization delivery/history and private-cover HTTP checks. The content generator appends `prisma/fixtures/programming.sql` to the empty-database seed; do not reseed a populated preview. R8's Madar sample program was applied additively. Cover bytes share ignored `.local/files` with resources; metadata and immutable digest ownership are in `program_media`. R11 provides explicit orphan-byte report/cleanup; deleting a cover reference never deletes a historical publication.

## Organization services

Apply forward migrations 240/250 using the normal migration command, then regenerate Prisma/types. `npm run test:organization-services` creates/cleans isolated identities and verifies scope, immutable definitions, corrections, exact retries, collisions and DST. `prisma/fixtures/organization-services.sql` is included in the empty-only seed; its synthetic Madar examples were added without resetting the preview. Do not treat their counts as real adoption.

For a stale result revision, reload the current participant result and deliberately reapply the correction; the prior device draft remains available. Do not delete result history to repair a current value. If a staff member leaves, an admin explicitly replaces event staff; scheduling does not silently recruit a new assessor.

## Local notifications

`npm run notifications:local` prepares bounded due reminders and dispatches one bounded batch into `notification_intercepts`; it sends nothing externally. Re-run for subsequent batches and due retries. Category email opt-in is required; default is in-app only. Preferences are in the header bell → Notification preferences. Quiet-hour endpoints are profile-local hours; equal values disable the interval. Inspect `notification_events` state/reason/attempts for suppression or failures; never infer read state from intercepted delivery. `npm run test:communication` uses disposable test identities to verify scope, retry, reminders and local sink behavior.

## Platform operations and isolated acceptance (R11)

Choose **Amina · local operator** under Explore sample accounts to review `/platform`. This grant is separate from all organization roles. Use a clear reason for suspension, restoration, organization closure/reopening or a support reply. Suspending an account revokes existing sessions; restoring it requires a new login. Audit history defaults to state changes; include directory access when investigating reads. There is no browser grant editor or private health/message browser. Never create a real operator by copying the synthetic seed into hosting.

Web `npm run test:e2e` now starts disposable database `rafik_browser_<timestamp>`, API 55341, dev 5183 and preview 5184. It applies all migrations/fixtures only there, builds in ignored `artifacts/isolated-browser/`, and removes its own database/files on completion. Keep these ports free. `test:e2e:running` targets an already running environment and is for deliberate focused diagnostics; the default isolated command is the acceptance path. Existing read-only layout scripts use preview 5173; team layout scripts create and clean their own fixtures. Do not run source edits or a second browser suite during final acceptance.

If forcibly terminated, inspect the timestamped service logs and processes before cleanup. Remove only the exact generated database and `.local/browser-<timestamp>` belonging to the abandoned run. Never reset `rafik`, and never infer a disposable name from an arbitrary environment variable. Test output/traces remain ignored because they can contain identity information. Older preview pollution was not erased by this change; new full browser runs no longer add to it.

`npm run test:operations` checks operational authority/replay, 1,321-member scale/paging, recovery/private-byte cleanup, and runtime local-only guards. `npm run recovery:local` saves an ignored private dump and byte archive, restores into `rafik_restore_<timestamp>`, checks ready resources and program-media hashes, and drops only that restored database. Read its manifest/result before calling it successful. This is a local rehearsal, not an atomic online hosted backup. Archives remain on disk for inspection; remove a specifically reviewed archive when no longer needed.

`npm run files:maintenance` reports unreferenced hash files older than 24 hours. `npm run files:maintenance -- --apply` removes only those still unreferenced after a live metadata recheck; all resource states and all program-media rows protect their bytes. Recent and non-hash/symlink entries are left alone. Do not remove metadata first to force cleanup. Hosted object storage needs its own inventory, retention and backup verification.

## Final connected review (R12)

Open the homepage to choose the workspace flow or immediate workout. `/local-preview` groups independent, organization and operator accounts; `/help` explains role boundaries and task paths. Web `test:cohesion:layout` renders public entry/help/sample-role selection; `test:operations:layout` includes organization setup states. The serial release runner includes both alongside the full regression chain. Current decisions and genuinely outstanding hosting/device/human evidence are in [release evidence](release-evidence.md). Do not substitute test identities for participant observations.

## Dashboard acceptance (R13)

Use the persistent sidebar as staff on desktop, or **Open navigation** on a phone. Analytics exposes reporting presets, activity and delivery/follow-up tabs. Timezone fields search all available IANA entries; type a city and select a result. The displayed offset is current; schedule previews remain authoritative for the selected future date.

`npm run test:dashboard:layout` in the web checkout reads the running preview and captures 192 paired role/viewport/language/theme states under `artifacts/dashboard-audit/`. It must not seed or reset preview data. `tests/dashboard.e2e.ts` runs through the disposable acceptance wrapper and uses an explicitly mocked populated analytics response for UI/fault behavior; organization-service lifecycle tests independently verify real persisted reporting. Empty preview charts are legitimate, not grounds for invented activity.

## R14 content and forward rollout

On an existing local preview use `npm run db:migrate`, `npm run db:generate`, `npm run types`, then restart the API. The three R14 migrations add structured suggestions and exercise media references without reseeding. That R14 checkpoint had 25 migrations; R15 adds five more. Never edit an already-applied migration; repair through another forward migration.

Before content changes run `content:media`, `content:check` and `test:catalog`. After canonical edits run `content`, inspect generated changes and rerun those gates. Keep all previously published media keys/bytes available. A new web shell version includes the reviewed reference pack (about 573 KiB of SVGs); normal waiting-update behavior preserves active work. Food lookup requires the API and provides manual entry when unavailable; it is not claimed as an offline food catalog.

No upstream provider API keys are needed. All third-party network access is maintenance-time only. Retain `content/upstream/workout-guide` licenses and the generated web credits in distributions. The full release command includes media verification and catalog tests. Source/license review and instructional accuracy remain required when expanding the pack.

R14 deliberately does not auto-adopt the old single nutrition browser-draft key: that key could combine values from different selected clients. It leaves that local record untouched and starts context-specific drafts. Previously saved server guidance, saved foods and actual meals remain intact. Open old nutrition work should be resolved before a future hosted rollout; local browser success does not establish a cross-version hosted migration.

Backend CI now declares `content:media` and `test:catalog` after API startup. Catalog tests validate all canonical source bytes and values in a backend-only checkout; generated web-byte parity is additionally asserted when the companion checkout exists. The local full release gate always includes both repositories and generation-drift checks. Remote CI has not been executed from this local phase.

## Exercise catalog and motion update (R15)

This phase adds five forward migrations (30 total). On an existing preview, apply migrations and regenerate Prisma/types; **do not seed or reset**. Source catalog imports are reference records, separate from synthetic user fixtures. Restart a stable API after code changes, then reload the web library. Sample accounts can immediately browse the expanded corpus.

Run `content:exercise-dataset -- --check`, `content:wger-exercises -- --check`, `content:videos`, `content:check` and `test:catalog`. Content acquisition/transcoding is an explicit maintenance step described in the content guide; no provider account or FFmpeg process is needed at runtime. Keep all referenced old media versions available. Missing/corrupt media yields a readable fallback and retry; investigate hashes before regenerating. Do not rewrite published media bytes under an existing key.

## R16 additive upgrade

Run `npm run db:migrate` then `npm run db:generate` and restart the API. R16 adds three forward migrations (33 total): organization nutrition tables, the explicit sharing composite key, and the server-only subject-date projection. No seed/reset is needed. `npm run types` refreshes web transport types; format generated output with the web formatter. `npm run test:organization-nutrition` exercises the local API using owned disposable records; `npm run test:fresh` installs all migrations in a disposable database. Web acceptance must use its isolated wrapper.

Preview: Rania → Nutrition → Sara → Create plan. Sara → Nutrition can view it, record actual food and opt into sharing. Kareem's assigned-trainer view reads the same organization history when authorized. This walkthrough intentionally uses user-created preview records rather than quietly seeding dietary targets.

### R18 organization media

Apply forward migrations with `npm start`; do not reset existing preview fixtures. Keep `.local/files` with database backups. Recovery and orphan inventory now include `organization/<workspace>/<asset>` paths and SHA-256 digests. Resource archive is a visibility command, not byte deletion: published/history references still resolve. Pair-message attachments never enter the general resource library. Test fixture cleanup must delete only the owning fixture's bytes and records.
