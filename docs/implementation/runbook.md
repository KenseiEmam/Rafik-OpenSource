# Local operation and next-release runbook

## Environment

Use the `codex/revamp` branches in `rafik-api` and `RAFIK-FRONTEND`. The native app and worker are parked; preserve the worker's pre-existing `.DS_Store` change. Never push `main`. No commit or remote push is needed to inspect this build.

Node is pinned to 22.16.0. The backend pins Supabase CLI 2.90.0 and a patched `tar` transitive dependency. Docker must be running. The local project is `rafik-revamp-local`, with API 55321, database 55322 and test inbox 55324; it has no remote link. Do not reuse the retired project's environment files.

```sh
# Backend, from rafik-api
nvm use
npm ci
npm start
npm run reset
npm run web-env
npm run types
npm test

# Frontend, from RAFIK-FRONTEND
nvm use
npm ci
npm run dev
```

Visit `http://127.0.0.1:5173`. The footer's sample-account link signs into local synthetic accounts. The public sample works without an account. Codes sent from local sign-in appear only in `http://127.0.0.1:55324`; no live SMTP provider is connected.

`npm run reset` intentionally discards local fixture changes. Close preview tabs or clear this app's site storage after a reset so old browser records do not refer to a freshly reset database. Keep the local database when inspecting a test-created result. To apply a new migration without resetting records, use the pinned CLI: `npx supabase migration up --local`, then `npm run types`. Check the project guard and absence of linked metadata first. `npm stop` stops only this Supabase project. It does not manage unrelated containers.

## Verify a change

Backend: `npm test` runs the core, daily-coaching and ongoing-coaching suites (93 assertions) in rollback transactions. `npm run test:fresh` creates a disposable database inside the local Supabase container, applies all three migrations and synthetic fixtures, runs all three suites, and drops only that disposable database. It preserves the preview database. `npm run content:check` compares generated seed/web content against the canonical JSON, with both sibling checkouts present. `npm run types` refreshes web database types after a schema reset.

Frontend: `npm test`, `npm run format:check`, `npm run build`. For full browser checks, keep the dev server running on 5173; build and run `npm run preview -- --port 5174 --strictPort` in another terminal. Install test browsers once with `npx playwright install chromium webkit`, then run `npm run test:e2e`. Account/invitation scenarios require the local backend and test inbox. The production-shell scenarios use port 5174.

Browser outputs are local under `RAFIK-FRONTEND/artifacts/`, `test-results/` and `playwright-report/`. They are ignored by Git because they can contain test-session URLs and synthetic account data. Useful screenshots are linked in the verification record. Never run this suite against a hosted project or real email recipients.

CI definitions are included: backend local reset/SQL checks, and frontend type/build/unit/public-browser checks. Full cross-repository account scenarios run through the local runbook; CI has not been run remotely because nothing has been pushed.

## Normal updates

**Copy or Arabic wording:** edit the bilingual pair in its feature or shared vocabulary. Check the affected screen at a phone width in both directions. User-authored plan titles and names remain user content; exercise/day defaults come from the bilingual catalog.

**Exercise or starter prescription:** edit `rafik-api/content/starter.json`, run `npm run content`, then reset the local backend. Inspect the preview and logger. A changed prescription for real hosted users will be a new published plan version, not an update to already started sessions.

**New prescription field:** define its semantics and bounds in `validate_prescription`; update the domain interface, editor and logger that actually use it. Add a scenario showing what happens to an old session and a new assignment. Do not add a generic metadata/configuration framework for one field.

**Review behavior:** change `review_session` and the review screen. If introducing a new completion/review transition, test note corrections and retries. A review update must never regenerate the plan or create another completion.

**Schema change after shipping:** add a new migration. Test a clean reset and the migration path from the last hosted release. The current local-only initial migration is intentionally a clean baseline, not a legacy patch chain.

## Support and recovery

- Open a workout to inspect its device/server save status. Reconnect or retry while using the same account.
- A conflict does not auto-merge completed sets. Download the local draft, then deliberately load the server version. A local backup is retained under the account-scoped draft key.
- Settings provides data export and local diagnostic events. Events contain a name/time, not email, notes or invitation tokens. Treat voluntarily exported workout files as private user data.
- An expired invitation needs a new link. Revoke a misplaced pending invitation and recreate it. There is no automatic invitation email to trace.
- A lost guest browser database cannot be recovered from the backend. The UI explicitly distinguishes local storage from account backup.
- The production service worker caches static application files only. A new release activates after older tabs close; do not force-reload an in-progress workout to apply an update.

## Hosted-release gate (deferred under local-only instruction)

1. Use a **new** Supabase project. Keep the old backend unchanged until retirement is separately scheduled.
2. Apply schema migrations only; never publish the synthetic Auth fixtures or their shared local password. Create a production-owned public starter and record its stable version ID through the content pipeline. The current static sample points to the local fixture version.
3. Configure real Auth mail, allowed origins and site URL. Test verification, expiry, resend and wrong-account recovery with controlled recipients. Keep rate limits appropriate for a real deployment; current mail limits support local testing.
4. Publish operator/contact details and an accurate hosted privacy/retention policy. The current privacy page intentionally describes a local preview.
5. Supply the new public API URL/key through build configuration. Service-role credentials must never enter frontend code. Restrict the operator access path separately.
6. Deploy the SPA with route fallback and HTTPS; serve the service worker and HTML without immutable cache headers, and hashed assets with long cache headers.
7. Run the critical browser suite against controlled hosted test identities, verify physical iPhone/Android interruption and keyboard behavior, and perform backup/restore and rollback drills.
8. Push only to `codex/revamp` if a remote branch is needed. Review diff, configuration and checks before opening the first hosted release. No main push, domain change, live message or payment action has been performed here.

## Later scope decisions

Physical-device verification and real-person task observation remain separate gates; desktop WebKit emulation cannot certify those. The current foundation is not the complete revamp. Execute the broader product work in [revamp coverage](revamp-coverage.md), including client management and a usable exercise/programming library, without waiting for customer recruitment. Business experiments guide positioning and unresolved extensions, not whether established missing coaching tasks get implemented. The local core includes no payment collection or claim of validated demand. Native remains deferred until the broader web/backend is ready.

## R1 daily coaching

Open `/coach/clients` and choose a client for notes, plan/schedule and history. Use `/coach/exercises` to create or edit private catalog content. Shared authored content remains in `content/starter.json`; custom content does not require source edits. Existing published instructions are snapshots.

An assignment's cycle day 1 is its start date. Empty slots are recovery days. Moving one scheduled session preserves its original occurrence date and leaves the rest of the cycle unchanged. Changing the assignment configuration clears exceptions for future starts. Archive pauses new assigned starts, not in-progress logging or history.

`supabase/migrations/202609220002_daily_coaching.sql` defines the expansion; `r1-contract.md` records ownership and lifecycle rules. New prescription work should update validation, snapshot/start/save commands, the small prescription helpers, editor and logger together. Do not create another planner service or client-only business-rule authority.

## R2 ongoing coaching and maintenance records

See [maintainer guide](maintainer-guide.md) for the complete source tree and task tour. New fixture examples are sourced from `supabase/fixtures-coaching.sql` and composed into the generated seed by `npm run content`. They are synthetic local-only data. Do not reset a working preview merely to get these examples; during R2 the additive fixture file was applied once with fixed IDs and conflict-safe inserts.

Coach: open **Check-ins**, create a template or edit an existing one, choose a client and due date, then assign one or up to twelve weekly/fortnightly occurrences. After submission, review from Today or the request list. Client: open Check-ins, save a draft or submit, find feedback in the same response, and correct if needed. **Discuss this response** opens a conversation with context. The workout review also links to a contextual conversation. Both roles can open Messages from navigation.

Progress is in client navigation and each coach client workspace. Only acknowledged completed results appear. Client measurements default to private and explicitly select a coach when shared. Coaches only see shared records. No target result is silently used as an actual.

A message with unknown delivery retains its exact saved payload and offers **Retry send** after reload. Changing that payload is blocked until delivery is resolved. Unknown assignment delivery similarly retains a series command; retrying it cannot duplicate the scheduled series. Form corrections can conflict after review from another tab; preserve/read the local draft and explicitly load the latest response before editing again. New form submissions need a connection; durable workout offline behavior remains a separate feature.

For every further change, update root `CHANGELOG.md`, the ledger and the affected architecture/maintenance/runbook docs in the same commit. Update verification only with checks actually run. Both repositories' `AGENTS.md` enforce this continuing requirement.

## R3 Storage and service verification

Storage is enabled in `supabase/config.toml`; the local launcher no longer excludes `storage-api`. For an existing pre-R3 stack, run `npm stop`, then `npm start` to add that service without deleting the database. Confirm `supabase/.temp/project-ref` is absent before `npx supabase migration up --local`; regenerate types afterward. Do not run `reset` just to enable Storage. The configured private bucket is `rafik-private`, with a 10 MiB limit and PDF/text/JPEG/PNG/WebP MIME types.

Run `npm run test:services` with the local stack up. It uses the CLI's local credentials in memory, creates three temporary synthetic Auth identities, verifies simultaneous booking/cross-role conflicts and real file access/deletion, then removes those temporary identities. It never prints credentials or uses the hosted backend. `npm test` runs rollback-only SQL tests; `npm run test:fresh` applies all six migrations and fixtures in a disposable database. The latter bootstraps managed Storage schema but does not test HTTP bytes; both checks are needed for a Storage change. Backend CI includes the HTTP check, but no remote run has been observed in this phase.

Upload interrupted: open More → Resources. A pending row offers **Check uploaded file** if bytes may already have arrived, or **Resume upload** to select the original name/type/size again. File bytes are not cached on the device. A successful finalize acknowledgement clears the upload draft; a lost acknowledgement is reconciled against the ready record after refresh. Do not insert a second metadata record to repair one upload.

Removal interrupted: the owner sees **Removal incomplete / Retry removal**. Retrying removes bytes through Storage and then metadata. A retired resource immediately stops recipient reads. Account deletion may leave the account present with some files already removed if a later cleanup fails; retry the explicit deletion to finish. Direct SQL deletion of Storage metadata is never a byte-cleanup operation.

Appointment interrupted: the calendar disables new commands and shows **Retry calendar change**. Retry the saved exact command after reconnect/reload. A confirmed validation failure unlocks correction. An unavailable slot requires a refresh/new choice. Cancelling an upcoming booking releases the slot; attendance is recorded separately after its end. Published availability is bounded to eight occurrences, not an infinite calendar subscription.

No synthetic file is seeded into hosted Storage. Local reset is destructive to this local project and may also remove its Storage objects; download any local file you want to retain before choosing reset. Stop/start is the preservation path.

## R4 local teams, commercial simulation and support

Apply migrations 007/008 only to `rafik-revamp-local`; confirm `supabase/.temp/project-ref` is absent, then `npx supabase migration up --local` and `npm run types`. Existing preview rows require no migration/reset or team enrollment. Current synthetic Laila/Amir records are not automatically moved into a team. New resets compose `fixtures-business.sql` through `scripts/content.mjs`.

For an **existing local installation** after applying 008, enable local provider simulation without resetting records:

```sh
# Exact local container; never substitute a remote connection or apply this fixture to hosting.
docker exec -i supabase_db_rafik-revamp-local psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/fixtures-business.sql
```

The backend flag defaults false on a fresh schema without local seeds. `VITE_LOCAL_PREVIEW=true` exposes the UI, but cannot bypass the backend flag or account-owner check. Team subscription shows trial/active/past-due/cancelled plus access expiry and limits. Local event forms let the owner exercise those states with no cards, actual charges or provider requests. The initial 14-day/10-staff/50-client trial is a local default, not approved pricing. Personal commercial setup is optional and has no solo paywall in this phase.

A later hosted provider adapter must authenticate provider callbacks, resolve a valid account, order state transitions with monotonic per-account sequence and call service-only `apply_business_event`. Duplicate IDs must retain identical payloads. The current schema records older events but never applies them over newer state. Do not enable the browser simulator in production or ship service-role credentials in the web build. No hosted payment integration has been installed or verified.

### Staff/client recovery

- Staff invitation: link is manually shared, email-bound, seven-day expiry. The initiating browser retains the latest link, and an unconfirmed invite command retains its token until acknowledgement. If unavailable on another device, revoke the pending invitation and create a fresh link. No outbound email is implied by the staff invitation button.
- Pending mutation: reopen the same account and screen, then **Retry saved change**. The exact UUID/arguments are replayed. Confirmed validation conflicts clear the pending command so the user can refresh/correct. Do not manually delete IndexedDB to dismiss an uncertain write.
- Handoff: admin proposes → client approves/declines. Before approval, current coaching continues. After approval, the new coach owns a copied plan and schedule; old started sessions can still sync and a lost start acknowledgement can be recovered by stable ID. Previous private coaching records remain with their original participants. Future old-coach appointments and unanswered forms are cancelled with the handoff. New-coach future assignment, if any, is replaced.
- Team departure/deletion: hand off assigned clients or close their enrollments first. Owner transfers ownership or closes all client enrollments and then the team. Settings preflight runs before file cleanup and the final account command rechecks under locks. Closed team records may outlive the deleted owner; active teams must retain an owner.
- Group archive retains assigned client plans and bulk receipts. Template removal retains independent copies. Staff file grants can be revoked from the team library, and owners can also inspect/revoke them from Resources after leaving a team. Downloaded files are outside future-access revocation.

### Local support operator

Client/coach **More → Support** saves a real case. Selecting a team explicitly shares it with that team's owner/admins, who respond in the web app. Selecting Rafik support keeps it private to the reporter and platform operator. The local screen explicitly says no live support service is connected.

For a platform reply, read the specific case's current revision through the local database/operator context, write 1–4000 characters to a text file, then run:

```sh
npm run support:local -- <case-uuid> <current-revision> /absolute/path/to/reply.txt
```

The script validates arguments and local project identity, obtains the service credential in memory from local CLI status, and calls only `http://127.0.0.1:55321`. It updates the case response/status; it sends no external message. Identical replies replay safely; stale changed replies conflict. The reporter can reopen the case. This is a simple case/status/response workflow, not a multi-message ticketing service.

R4 verification: `npm test`, `npm run test:fresh`, `npm run test:teams`; existing `test:services` remains mandatory after changing file/access/account lifecycles. In the frontend, run `npm run test:e2e -- tests/teams.e2e.ts` and `npm run test:teams:layout`. Both use temporary fresh identities, with explicit local-only setup/cleanup. Full regression runs require dev 5173 and current production preview 5174, as before. Remote CI definition now includes `test:teams`; no remote run is claimed.
