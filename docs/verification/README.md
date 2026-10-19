# Verification record

## Public-beta readiness fixes — 19 October 2026

A final source review found a second cold-start gate: the workspace schedule refresh held the general busy lock. Cached event opening now uses its local snapshot immediately and initial schedule refresh has a separate busy state. A newer download is explicit via **Refresh roster**. This final change passed source/test TypeScript and React lifecycle review (including unmount guards, observer cleanup, separate schedule locks and selected-event response guards); it awaits the updated bundle and physical UI checks; the `af41c22` build below is the preceding packaging receipt.

**Source checks passed:** six focused request/client cases cover raw connection-detail suppression, failure → authenticated recovery, no recovery notification for denied requests, observer cleanup/error isolation, malformed responses/context data, URL boundaries, bilingual sign-in/throttling feedback and selection after coach-access changes. Eighteen existing SQLite queue cases passed, retaining exact retries, persistence, isolation and conflict/completion semantics. Mobile source/test TypeScript passed after correcting two test typing errors. Documentation links across 50 maintained files, targeted formatting and whitespace checks passed. Node transport tests mock fetch and Expo storage; they do not render Home, prove Keystore behavior or establish native UI acceptance. The first native test invocation needed Node transform-types for an existing parameter property; the maintained command includes it.

**Dependency check:** `npm audit --json` reported zero known advisories for the current lockfile tree. See the [raw registry receipt](receipts/2026-10-19-beta-dependency-audit.json). This supersedes the old install finding count; it is not a source/security audit. No dependency updates or database changes were made.

Source now rechecks offline access in the background without unmounting roster/editor UI and opens cached work after local storage rather than waiting for a network timeout. The updated signed APK built successfully in 2m37s (585 tasks: 41 executed, 544 up-to-date). Its package/version, bundled JavaScript, ARM64/x86_64 libraries and configured certificate passed the release verifier. Compiled source: `af41c22395449a61e649cc0fbb462efbf9813940`, clean at build start. SHA-256: `320ed2ebcc7840ae50de925d9f153cd110f016b81ef5a79821a7b4ee5a1afaf6`. The earlier APK is preserved under ignored `artifacts/mobile/prior-beta1-2026-10-19/`. This new APK includes the source fixes; the earlier emulator UI receipt does not establish their rendered acceptance. The founder’s Galaxy S20+ workflow check remains open. See the [build/check receipt](receipts/2026-10-19-beta-readiness.json). No physical device, backup completion, blanket security/UX approval or new release version is claimed. Signing-backup and USB/offline test instructions were reviewed against official 7-Zip/Android guidance; operator execution is still required.

## Beta Step 3 — 19 October 2026

**Build/signature passed:** the corrected build succeeded in 7m49s, 585 tasks (528 up-to-date), with native work reused. SDK 37 reports `V2 Signer`; the first post-build guard expected legacy `Signer #1` wording and rejected export even though fingerprints matched. The corrected verifier accepted the actual APK without another build, required one matching signer, checked package/version/non-debuggable metadata, embedded JavaScript and ARM64/x86_64 libraries. Compiled source: `f5a0daf`; Android code `1000001`; SHA-256 `3524f42db80790a37835e60d3aba12f14f7eb44d5f75c8f1a92ccd9aac279236`. Certificate SHA-256: `df1a1bc534b1bd1375aaadce3048416bff65e8a02a7ad534ce7dbd76ef5d9255`. Install/upgrade acceptance remains separate below; no public APK release has occurred.

**Standalone emulator acceptance passed:** installed a controlled qualification baseline with the production bundle and release certificate, but Android versionCode 1. With Wi-Fi/mobile data off, saved uncertain attendance and an unsubmitted score draft `13.75`. Force-stopped the app and installed the untouched code `1000001` APK in place. With Metro stopped and no active network, cold startup restored the account, event, pending attendance and score draft. Reconnecting and saving produced present attendance and exactly one result at revision 1; completion reached the server and showed the read-only summary. This proves preservation of current-format state through an Android version-code upgrade. The baseline differs only in versionCode/signature packaging; it is not evidence of a historical release or schema migration.

Inspected [before upgrade](receipts/2026-10-19-before-upgrade.png) and [offline after upgrade](receipts/2026-10-19-after-upgrade-offline.png). Coverage: isolated Android 14 x86_64 AVD, 800×1280 at density 320 (400dp), English/light. Initial System UI stalls required disabling Google Play services/store in this temporary AVD; physical-device performance, TalkBack, the full layout/theme/locale matrix and native account-switch/conflict/revocation journeys remain unverified. The earlier offline error banner remained after successful sync; this verified display defect is in [known issues](../known-issues/README.md).

**Cleanup complete:** stopped only the verified temporary AVD, ended the interactive acceptance runner, and removed its disposable API/database and private fixture/helpers. Original AVD/account, normal development services and data were preserved. The signed APK/checksum/build metadata and private ignored signing key are retained. Private key backup remains an owner action. No public APK upload occurred. See the [raw receipt](receipts/2026-10-19-release-acceptance.json).

**Packaging history:** native compilation initially reached fatal lint for three missing `includeSubdomains` attributes. Explicit `false` fixed exact-host exceptions. The founder authorized retaining beta.1 for these initial packaging corrections and correcting the provisional source tag. Shortened app staging yielded 61 ARM64 object paths, maximum 254 characters, none above 256. Script syntax/help, targeted formatting, documentation links across 50 maintained documents and `git diff --check` passed; no additional native build or broad browser suite was run for the verifier/docs correction.

## Beta acceptance step 2 — 18 October 2026

**Passed:** 18 Node SQLite queue cases; one native HTTP + real SQLite integration scenario against a freshly migrated disposable PostgreSQL database/API; backend TypeScript and launcher syntax. The queue command initially hit Windows child-process `EPERM`; the same file passed with `--test-isolation=none` on Node 24.21.0. The integration fixture first reused a session intentionally revoked by refresh-token reuse; the corrected fixture passed. The final API-only runner also passed and automatically stopped its API and removed its database/files.

Coverage: native login/session/refresh/reuse/logout; server-committed lost acknowledgements for attendance, fractional Arabic-entered scores and event completion; exact receipt replay and changed-payload rejection; 25+3 score-history pagination without duplication; wrong participant/outside-account denial; stale revision pause without replacing the saved base; membership revocation blocking new and previously acknowledged operation replay. This does not establish event-staff reassignment behavior.

**Passed native slice:** resumed on emulator-5554, Android 14, 1280×800 landscape at density 320, using the temporary managed profile and a fresh isolated API/database. Synthetic sign-in succeeded. Downloaded a roster, recorded attendance, then disabled both Wi-Fi and mobile data. A fractional score draft showed device-save acknowledgment; submitting produced an uncertain queued result. Force-stopped only the temporary app, restored connectivity for Metro, and reopened it. The queue replayed and the API showed one score result, value `12.5`, revision 1. Attendance and score history rendered the matching entries. Event completion reached the server and removed capture controls, showing the confirmed read-only summary. This does not prove cold startup without Metro/network access.

Native storage initialization passed the app's `cipher_version` guard. The temporary profile's database first 16 bytes differed from the plaintext SQLite header. This supports SQLCipher use in this build; it is not a cryptographic or key-extraction audit.

A separate offline attendance entry remained uncertain. Recovery sharing required the privacy confirmation, opened Android's text chooser with the exact pending operation, and cancellation retained the entry without a delivery claim. Restored connectivity, read fresh server records separately and switched to Arabic. Inspected [English score history](receipts/2026-10-18-mobile-score-history.png) and [Arabic dark recovery](receipts/2026-10-18-mobile-recovery-ar-dark.png): history values were visible; recovery text/actions mirrored and aligned RTL. These are two inspected states, not a complete locale/theme/layout matrix.

**Cleanup complete:** verified and removed only temporary profile 10, its shared temporary UI/screenshot files, isolated database `rafik_browser_1792352387524`, isolated API/runner and ignored fixture/helper files. Restored emulator Wi-Fi/mobile data, light mode and the original account's foreground app. The runner was launched without interactive stdin, so `done` could not be sent; cleanup used verified process IDs and the exact disposable database name. Original profile/sign-in/data were not reset.

See [raw receipt](receipts/2026-10-18-field-acceptance.json). No broad browser suite or native rebuild ran. Remaining acceptance includes physical hardware, portrait/phone layouts, assistive technology, native account switching, rendered conflict/revocation recovery, event-staff reassignment and cold offline startup/distribution. This focused pass does not declare the whole beta release ready.

## Stage 7 recovery, history and localization — 18 October 2026

Backend and mobile TypeScript passed during integration. A read-only handler/database diagnostic returned one attendance-history entry and one score-history entry for an authorized event participant; it created no records and is not HTTP authentication or denied-access evidence. A static translation scan found no unmapped literal labels in the existing Home, WorkspaceScreen and ScoreEditor call sites.

The founder supplied an Android Arabic screenshot with text incorrectly left-aligned. Inspected the installed Android paragraph code, corrected logical-start alignment, and directly viewed final English/Arabic schedule screenshots through ADB on emulator-5554 at 1920×1200, landscape, light theme. Confirmed heading/feedback/card alignment, mirrored toolbar and mixed English event titles. Only language selection was changed; no event writes occurred. Temporary screenshots were removed after inspection; none are committed because they contain account identity. This is emulator evidence, not physical hardware or complete responsive acceptance.

No test suite or native rebuild ran for this slice. Pending acceptance: populated/later-page correction history, revoked/changed authority, live conflict comparison, exact uncertain retry, native sharing cancellation/large-item fallback, preference persistence/failure and open-draft language switching, portrait/tablet/dark layouts and assistive technology. Signed release packaging and encryption/process-death acceptance remain separate gates.

## Founder field walkthrough and browse fixes — 18 October 2026

The founder reports running the Android pipeline, scheduling an assessment, recording attendance offline, restarting the backend, reconnecting and syncing successfully. Device type was not reconfirmed. This establishes a user-reported attendance recovery journey; assessment scores, event completion, app process death, SQLCipher encryption and physical-device acceptance remain unverified.

Frontend, backend and mobile TypeScript checks passed. Direct Vue template compilation passed for ScheduledEvents, OrganizationCalendar, SessionHistory and HelpPage. A read-only local diagnostic invoked the corrected Athlete plans handler for an active coach and returned one assignment. The new scheduled-events handler returned two authorized events. It used the existing local database without creating, modifying or deleting records. This is handler/database evidence, not authenticated HTTP or browser acceptance. The original `tsx` diagnostic could not spawn esbuild (`EPERM`); Node type transformation ran it successfully. Rendered list pagination/filtering, phone completion/timing feedback and bilingual layout acceptance remain pending. No test suite or native rebuild was run.

## Staff plan browsing and event creation — 18 October 2026

Passed: `npm run backend:typecheck` and `npm run typecheck`. The founder then observed Vite template parse errors in the two new list filters, which TypeScript had missed. Replaced multiline inline handlers with named functions; direct Vue template compilation passed for both affected files. These are static checks only. No test suite, database/API execution or rendered browser acceptance was run for this change. Remaining checks include populated later-page selections and exact-version links, coach reassignment/revocation, expired/replaced nutrition classification, cross-tab template handoff, and English/Arabic phone/desktop layouts in both themes. Restart the backend to expose the new read routes; no migration is required. Android native acceptance remains separate.

## Android autolinked object paths — 18 October 2026

The founder's rebuild failed in app x86_64 codegen with an explicit filename-over-260 error. The saved CMake cache contained the helper's 180 limit; configure warnings showed a 178-character Gesture Handler target directory and insufficient space to hash object names. Changed the maintained helper to 256. Direct CMake regeneration of the existing app build files passed without compiling or warnings. Inspection of the generated Ninja manifest found 61 C++ object outputs: maximum full path 254 characters, zero above 256, and the previously failing Gesture Handler object now hashed at 249 characters. A Ninja dry run of the four failing app/codegen targets exited successfully without compilation; diff whitespace checks passed. Native rebuild/install acceptance remains open; no test suite was run.

## Windows Android launcher — 18 October 2026

Passed: Node syntax check and `npm run mobile:android -- --prepare-only`. Preparation verified installed Ninja 1.12.1 and applied the maintained Gradle helper to ignored generated Android output without compiling or starting services. A configuration-only `gradlew help --offline --max-workers=2 --no-parallel --console=plain` passed in 50 seconds (one help task executed, 28 plugin tasks up to date), after fixing early helper registration. The first configuration check caught a late `buildStagingDirectory` assignment; the launcher now registers its hooks before React Native's root plugin evaluates app projects. The supplied failed-build log confirms Reanimated's Ninja mkdir failure and that an `R:` launch still used canonical long paths. No full native compilation, install or emulator/device recovery was run; configuration acceptance does not prove the original failure is resolved. No test suite was run.

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
