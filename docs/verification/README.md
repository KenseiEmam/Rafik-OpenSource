# Verification record

## Multiple message attachments — 18 October 2026

The additive `202610181200_message_attachments` migration applied to the preserved local database, and Prisma client generation succeeded. Shared transport types were regenerated from that schema. Frontend and backend TypeScript passed; subsequent upload error-copy changes were formatted. No test suite was run. Actual multi-file send, ordered download/export, uncertain retry, revocation and rendered phone/desktop, Arabic/theme and keyboard acceptance remain unverified. [Landing PR #3](https://github.com/KenseiEmam/rafik-landing/pull/3) pairs English/Arabic workflow and migration guidance; no landing build was run for its Markdown-only changes.

## Message attachment composer — 18 October 2026

Updated the pending attachment preview, photo/file upload controls and acknowledged-send cleanup. Frontend TypeScript (`npm run typecheck`) and `git diff --check` passed; the two Vue files were formatted. Browser, keyboard, Arabic/theme, phone and send/reload recovery acceptance have not been run for this change. No test suite was run; no preview data was created or removed.

## Swagger viewer — 18 October 2026

Documentation links passed across 48 maintained monorepo documents; `git diff --check` passed. Temporary documentation-preview services were stopped after inspection.

Passed: two isolated HTTP/initializer checks with `npm run test:api-docs --workspace @rafik/backend`, and backend TypeScript. Checks cover direct/proxy paths, bundled assets, CSP, missing assets, HEAD/method handling, local versus production interaction, same-origin targets, native marker and cookie omission. The viewer rendered in the in-app browser against a separate documentation-only preview; its endpoint groups and schemas were visually inspected. This was not a responsive, bilingual or cross-engine acceptance suite. No database, API login/write, Android device or deployed installation was exercised. The owner's running backend was not restarted. [Landing PR #2](https://github.com/KenseiEmam/rafik-landing/pull/2) contains paired documentation changes; no landing build was run for these Markdown-only updates.

This page records focused evidence for the current implementation and states what the evidence does not establish. See [testing](../testing/README.md) for the test strategy and commands; raw machine-readable evidence belongs under [receipts](receipts/). Earlier phase records are archived in the [verification history](../archive/verification-history-2026-10-17.md).

## Stage 4 — accepted prototype evidence

**Status:** prototype implementation complete. The founder deferred human and pre-production checks to the first-user/release backlog.

- The focused conversation flow passed in Chromium desktop and WebKit phone, including opening/reusing a direct conversation, message retry/reload, notification preference save, responsive layout and accessibility checks.
- The injury consent/status/correction/limited-coach/withdrawal flow passed in Chromium desktop and WebKit phone.
- Release guard tests passed 8/8. Backend and frontend typechecks, frontend build and the documentation-link check passed for the final Stage 4 source.
- A disposable database/API outage and restart rehearsal passed. The retained evidence does not establish production alert delivery, physical-device behavior, human usability, legal compliance, or a production update/rollback rehearsal.

The remaining first-user and pre-production items are listed in [known issues](../known-issues/README.md). Do not use real athlete data before the institution's privacy/security approval.

## Stage 5 — instance branding

The implementation adds PostgreSQL-backed instance name, accent, light/dark page backgrounds and optional raster logo settings. Surfaces derive from the page backgrounds and text/accent colors adjust for contrast. Only the first super admin can update the settings. Rafik attribution remains visible, the public logo endpoint serves only validated PNG/JPEG/WebP bytes up to 512 KB, and settings are included in the ordinary database backup.

The founder restarted the local backend and frontend and confirmed branding persisted. This is application-service restart evidence only; a database backup/restore check remains open.

### Checks run for this change — 17 October 2026

- Passed: backend and frontend typechecks.
- Passed: `npm run test:fresh --workspace @rafik/backend`; all 50 migrations, fixtures and eight SQL suites passed against a disposable database. The shared preview database was unchanged.
- Passed: frontend production build.
- Prettier formatted the edited TypeScript, Vue and CSS files. Prisma formatted the schema; the SQL migration has no configured Prettier parser.

The focused first-run palette journey passed in Chromium desktop and WebKit phone. It covered changing name/accent/light and dark backgrounds, uploading a logo, reload persistence, Arabic rendering, and axe accessibility checks. Viewport and full-page captures were visually inspected and saved under receipts. This does not establish physical-device or human usability evidence.

**Founder manual check:** after stopping and restarting the local backend and frontend, instance branding remained available. This confirms branding survives application-service restarts against the existing local database; it does not exercise restoring a backup.

After founder review, dark-mode card and soft surfaces were darkened slightly while leaving light mode unchanged. This CSS-only adjustment has not yet been rechecked in a browser.

After further founder review, light-theme primary and muted text were darkened slightly; dark-theme text colors were left unchanged. This CSS-only adjustment has not yet been rechecked in a browser.

A centered, accessible spinner now occupies the first render until the branding request settles, so the application shell is shown only after custom theme values are applied. The loader behavior has not yet received a browser check.

## Release and human evidence still needed

- First-user review of representative university coach and athlete tasks.
- Sport-specific taxonomy and exercise/field-drill content review.
- Institution privacy/security approval for consent, access, retention and deletion.
- Production retention alert delivery and disposable Unix update/rollback rehearsal.
- Stage 5 database backup/restore persistence check.
- Physical-device behavior and production service delivery where applicable.

Do not treat browser emulation as physical-device or human usability evidence. The [known-issues list](../known-issues/README.md) is the active record of open release gates.

## Stage 6 — cloud templates

Terraform is not installed in this environment, so `terraform fmt` and `terraform validate` were not run. No cloud credentials were used and no resources were created. The founder deferred provider application, deployment, cost, upgrade, backup/restore and teardown checks to user testing; these remain unverified and are not required before the optional templates are reviewed.

## Stage 7 — Android coach app foundation

For the initial Stage 7 implementation on 17 October, backend and mobile TypeScript workspace checks passed. The OpenAPI JSON parsed and exposed the expected native authentication and coach calendar paths. The documentation-link check passed for 46 monorepo documents, and `git diff --check` passed after correcting trailing whitespace in ADR 0023. No API integration, database migration, emulator, physical-device or UI workflow check was run. At that point the prototype stopped at sign-in and schedule display; those checks did not establish attendance/results capture or offline reliability.

### Attendance implementation — 18 October 2026

The client now implements explicitly opened attendance rosters, a SQLCipher-backed event/command store, immutable command replay, atomic acknowledgment revisions, account/server/workspace isolation, visible rejected/blocked states and explicit device-copy discard. A runtime SQLCipher check refuses plaintext fallback. Native credentials are instance-bound and sign-out waits for outstanding credential writes; Android automatic backup is disabled. These implementation controls have not yet been validated on Android.

- Passed: `npm run test:queue --workspace @rafik/mobile`, 11 tests using real Node SQLite. Covered identical retry after a simulated lost server response, second-edit revision adoption, on-disk close/reopen of a sending record, account/server/workspace isolation, simulated 403/409 pauses, stale-roster rejection, transaction rollback, storage failure, mismatched acknowledgments, single-flight capture during sending and runtime stop. This uses a simulated server sender, not the PostgreSQL/API integration.
- Passed: `npm run typecheck --workspace @rafik/mobile`, including its separate Node-test TypeScript configuration.
- Passed: `npm run docs:check`, 48 maintained documents including the mobile README.
- Formatted the changed native sources/config and maintained guides. The React review corrected the sync runner's effect cleanup/restart and session initialization cancellation; this is source review, not rendered acceptance.
- The first test invocation hit sandbox `spawn EPERM`; the focused test command passed with approved execution outside the sandbox. Tests removed their own temporary on-disk database and did not touch preview users or data.
- Android SDK tools are present, but `adb devices -l` returned no connected device/emulator. No native build, SQLCipher/Keystore runtime, Android process-death/app-upgrade, visual, accessibility or physical-device check was performed. No backend/migration or full browser suites were repeated for this client slice.

At the end of the attendance-only slice, assessment entry and completion were unfinished. The later slice below adds them. Native/API verification, correction-history UI, Arabic/RTL, URL scanning and recovery export/comparison remain open. The [Android guide](../development/android.md) describes the current workflow.

### Assessment and completion implementation — 18 October 2026

The native client now downloads an event's assessment definitions/units/limits and current results, saves raw drafts separately from submitted commands, queues results after present attendance, reviews/corrects current results using acknowledged revisions and completes an event only after its required records are confirmed. A confirmed finish atomically evicts its local package, drafts and receipts. Server correction history is preserved; the native UI currently shows current values only.

Focused queue tests exercise real Node SQLite with a simulated sender, including decimal precision, blank versus zero, definition projection, attendance → result sequencing, result corrections, draft persistence/isolation, completion gates, lost score/finish responses, mismatched acknowledgments, and rollback/retry when local completion eviction fails. Native rendering, actual PostgreSQL/API behavior, SQLCipher/Keystore and Android process death are not established by those tests. Native/API and device acceptance, correction-history UI, Arabic/RTL and URL scanning remain open. No production or browser suite is required for this native-only implementation change.

Final checks for this slice passed: `npm run test:queue --workspace @rafik/mobile` (18 tests), `npm run typecheck --workspace @rafik/mobile` (source plus Node tests), documentation links across 48 maintained files and `git diff --check`. Formatting covered the edited native sources/tests and guides. Test-created disk databases were removed; preview data was untouched. No emulator or physical-device claim is made.
