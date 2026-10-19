# Verification record

## Release 1a: sports and coaching specialties — 19 October 2026

**Passed against disposable databases:** each run migrated a new `rafik_browser_*` database, started its own API and dropped the database afterward. The preview database was not migrated or changed.

- **`test:organization-sports`, 2 tests:**
  - Admin-only writes; athletes cannot read the list; trainers can read it.
  - Exact receipt replay, case-insensitive duplicate rejection, fixed kind, stale revision, and an event per change.
  - Athletes refuse specialties; administrators cannot be linked; another institution's sport is rejected.
  - A stale `previous` set is a conflict; archived entries cannot be newly added but existing links stay.
  - The People sport filter applies inside the coach's assigned scope.
- **`test:organizations`:** 5 existing tests pass.
- **Shared database types** were regenerated from a migrated disposable database; only the two new tables were added.

**Browser (`organization-sports.e2e.ts`, isolated wrapper, Chromium desktop and WebKit phone):**

- An admin adds, renames, archives and restores sports and specialties, including a long Arabic name.
- An athlete's picker offers sports only; a coach can take specialties.
- Sport chips appear and the People filter works, and a coach's filtered list contains only their assigned athlete.
- Layout and axe checks ran, and screenshots were inspected, in English dark and light (desktop and phone) and Arabic dark at 320 px.

**Defects found and fixed during these checks:**

- Light `--muted` measured 4.39:1 on the soft surface in WebKit; it is darkened from `#545d56` to `#4d564f`. After this shared token change, the three R0 browser journeys were rerun in both engines and all six runs passed.
- At 320 px, People cards split Arabic link words letter by letter; actions now wrap below the identity.

**Limits:**

- Sports grant no access yet.
- Browser emulation is not physical-device evidence.
- Recorded stale browser specs remain unchanged.

## R0 beta.1 close-out — 19 October 2026

**Passed:** three focused browser tests in Chromium desktop and WebKit phone (iPhone 13 emulation), all six runs on the final source, through the isolated browser wrapper. A production web build also passed, with the known P3 Vite config warning. It used its own database, API and web ports and removed them afterward.

- **Workout feedback link:** an athlete completes an institution workout, opens **Rate your session** and reaches the feedback form. Before the fix this run showed the link going to `/institution/…`.
- **Later-page browsing:** a coach with 26 assigned athletes opens a page-2 athlete plan, reloads, closes it, searches and reloads again. The same check covers a page-2 nutrition plan and a page-2 training event with the activity filter, returning with Back to the same page and filter. Arabic dark at 320 px was checked on plans and events, including a long mixed-script name.
- **Multiple message attachments:** two photos and a PDF are selected and one is removed. The draft survives reload in order. A lost acknowledgment followed by **Retry saved change** produces exactly one message with both files, and the recipient sees both, including the PDF's file name. After the recipient's membership is deactivated, reads of both files are refused.

Layout-containment and axe checks ran on each captured state. Screenshots of every state were inspected, then removed.

**Defects found and fixed by these checks:**

- The dark-theme `--muted` text measured 4.23:1 on soft surfaces (tags, message timestamps), below the 4.5:1 minimum. Raised from `#b0bdb2` to `#bcc8be`; light theme unchanged.
- Sent attachments showed only **Download**, with no file name, and saved as `attachment`. The thread read now returns attachment names to the same channel audience.
- The events list read "1 athletes" (Arabic "1 رياضيين"). It now uses an `Athletes: n` label.

**Also passed:**

- `npm test`: 28 frontend unit tests, including token definitions.
- Frontend and backend typecheck.
- Prettier on the touched files.

**Limits:**

- Four other specs (`instance-branding.e2e.ts`, the first `organization-feedback.e2e.ts` test and both `responsive-inbox.e2e.ts` tests) fail identically on unmodified source; they are recorded as stale in [known issues](../known-issues/README.md#browser-test-maintenance). The shared token change was therefore checked through the R0 journeys' axe scans, not those specs.
- Browser emulation is not physical-device or assistive-technology evidence.
- The Galaxy S20+ check and release-asset alignment remain owner actions.
- H1 was confirmed by tracing the code, not by a new automated check.

**Local environment note:** this preview's PostgreSQL volume was created before Stage 3 under Debian `postgres:17.6` (glibc collation 2.41). The current Compose image `postgres:17.6-alpine` (musl) refuses to create databases from it. For this run only the `db` container used `postgres:17.6` through an untracked override; the volume, preview data and tracked Compose file were unchanged. See [development troubleshooting](../development/README.md#troubleshooting).

## GitHub check repairs — 19 October 2026

The failed GitHub run stopped before web tests because Linux compiler bindings were missing, and at an obsolete invitation-preview assertion in the backend. The merged first repair restored platform metadata, corrected invitation/onboarding fixtures and stale CSS tokens, and replaced marketing/package workflow commands. Follow-up checks corrected the new lock test to follow Node's nested/hoisted package resolution and resolved the scoped Xcode UUID override.

**Passed locally:** all 28 frontend unit tests; five invitation/workspace authorization cases; isolated Chromium first-run super-admin setup and coach/athlete signup (one journey, English/light desktop). The browser wrapper built the web bundle, created its own empty database/services and cleaned them up; normal preview records were untouched. The Xcode CommonJS consumer generated 100 unique valid project IDs with UUID 11.1.1 in an isolated dependency fixture. This does not establish an Android native build or full device/theme/locale acceptance.

**Online audit:** 27 entries before the UUID override, 19 high entries after; see known issues for two unpatched underlying Expo-tooling dependencies. The earlier offline zero result is invalid. Linux run 39243654014 passed clean installation, all web unit tests, production build and the full Chromium onboarding job. Backend passed invitation authorization, then found a stale program-library denial assertion (200 versus expected 403); ADR 0020 permits read-only published versions. That fixture was corrected to verify immutable reads and denied edits. A direct local programming run lacked the canonical seeded catalog and failed validation; no preview seeding/reset was performed. Run 39244169705 passed the web job, programming and all other domain suites except operations/assets. Its failures were outdated production-error wording and peer denial for media referenced by a published library snapshot. The fixtures now verify the actual self-host configuration guard and exact published bytes while retaining private/unpublished/foreign denials; the focused local boundary case and both asset/privacy cases pass. Final backend results remain separate from the passing web job.

## Whole-product beta documentation review — 19 October 2026

**Passed:** root `npm run build` completed Vue type checking and Vite production bundling (3,963 modules; Vite phase 9.85s). Web runtime source is unchanged from `4e4ffd3`; this follow-up changes documentation and its checker only. The build emitted a nonfatal future-native-config-loader warning for the JSON import attribute; it is recorded as P3 in known issues rather than hidden. No browser, Android rebuild or database reset was needed for this documentation pass.

**Passed:** enhanced `npm run docs:check` runs two isolated regression cases and scans 53 maintained root/app/docs/infrastructure documents after archiving two historical active guides, including relative heading anchors. It caught the new beta-summary fragment mismatch, which was corrected. Root README npm commands were checked against their actual root/workspace scripts; the OpenAPI JSON parses as 3.1.0, contract version 0.1.0 with six supported paths. One Compose definition remains. Targeted formatting and whitespace checks passed. External URLs are outside the local link scan; official GitHub release/archive guidance was consulted separately. Fixtures removed their own temporary directory.

The review corrected stale stage/API status, Compose profile descriptions, monorepo paths, default demo seeding and the health-only coach walkthrough. The [project beta decision](../operations/release-checklist.md#project-beta-readiness-19-october-2026) separates supported synthetic-data evaluation from publication actions and each institution’s live-data checks. First-user/cloud gates remain the founder-accepted backlog; no unperformed test is marked passed. Newer web browse/multi-attachment rendering, updated Android physical acceptance and production recovery remain explicit limits. The founder subsequently confirmed signing-key backup with 7-Zip copies on PC and cloud storage; this is owner-reported completion, not an independently inspected archive/restore. See the [raw receipt](receipts/2026-10-19-whole-beta-docs.json).

Paired English/Arabic landing guides in PR #8 now cover setup without mandatory seeding, main promotion, current native scope, evidence/limits and GitHub-hosted downloads. Frontmatter/translation pairing and local guide targets were statically reviewed; no landing runtime build or device check is claimed.

## Public-beta readiness fixes — 19 October 2026

A final source review found a second cold-start gate: the workspace schedule refresh held the general busy lock. Cached event opening now uses its local snapshot immediately and initial schedule refresh has a separate busy state. A newer download is explicit via **Refresh roster**. This final change passed source/test TypeScript and React lifecycle review (including unmount guards, observer cleanup, separate schedule locks and selected-event response guards); the final signed build below passed, with physical UI acceptance still open.

**Source checks passed:** six focused request/client cases cover raw connection-detail suppression, failure → authenticated recovery, no recovery notification for denied requests, observer cleanup/error isolation, malformed responses/context data, URL boundaries, bilingual sign-in/throttling feedback and selection after coach-access changes. Eighteen existing SQLite queue cases passed, retaining exact retries, persistence, isolation and conflict/completion semantics. Mobile source/test TypeScript passed after correcting two test typing errors. Documentation links across 50 maintained files, targeted formatting and whitespace checks passed. Node transport tests mock fetch and Expo storage; they do not render Home, prove Keystore behavior or establish native UI acceptance. The first native test invocation needed Node transform-types for an existing parameter property; the maintained command includes it.

**Dependency correction:** the earlier [zero-result receipt](receipts/2026-10-19-beta-dependency-audit.json) was produced with npm offline mode and is invalid as an online advisory check. Explicit online audit confirmed 27 affected entries. Resolving Xcode UUID to 11.1.1 reduced this to 19 high entries from unpatched `braces` and `node-forge` in Expo tooling. See current [known issues](../known-issues/README.md) and online [before](receipts/2026-10-19-ci-audit-before.json)/[after](receipts/2026-10-19-ci-audit-after.json) reports.

Source now rechecks offline access in the background without unmounting roster/editor UI and opens cached work after local storage rather than waiting for a network timeout. The updated signed APK built successfully in 2m20s (585 tasks: 41 executed, 544 up-to-date). Its package/version, bundled JavaScript, ARM64/x86_64 libraries and configured certificate passed the release verifier. Compiled source: `5d1ce761505b07272c6d5b43414cd1d754b41517`, clean at build start. SHA-256: `1654e44fd6f324d2403984a6a880b3dffabf81f3615c9ac8a71c5992a417fb5e`. The earlier APK is preserved under ignored `artifacts/mobile/prior-beta1-2026-10-19/`. This new APK includes the source fixes; the earlier emulator UI receipt does not establish their rendered acceptance. The founder’s Galaxy S20+ workflow check remains open. See the [build/check receipt](receipts/2026-10-19-beta-readiness.json). No physical-device acceptance, blanket security/UX approval or new release version is claimed. Signing-backup and USB/offline instructions were reviewed against official 7-Zip/Android guidance; the founder subsequently confirmed backup completion. Physical workflow execution remains open.

## Beta Step 3 — 19 October 2026

**Build/signature passed:** the corrected build succeeded in 7m49s, 585 tasks (528 up-to-date), with native work reused. SDK 37 reports `V2 Signer`; the first post-build guard expected legacy `Signer #1` wording and rejected export even though fingerprints matched. The corrected verifier accepted the actual APK without another build, required one matching signer, checked package/version/non-debuggable metadata, embedded JavaScript and ARM64/x86_64 libraries. Compiled source: `f5a0daf`; Android code `1000001`; SHA-256 `3524f42db80790a37835e60d3aba12f14f7eb44d5f75c8f1a92ccd9aac279236`. Certificate SHA-256: `df1a1bc534b1bd1375aaadce3048416bff65e8a02a7ad534ce7dbd76ef5d9255`. Install/upgrade acceptance remains separate below; no public APK release has occurred.

**Standalone emulator acceptance passed:** installed a controlled qualification baseline with the production bundle and release certificate, but Android versionCode 1. With Wi-Fi/mobile data off, saved uncertain attendance and an unsubmitted score draft `13.75`. Force-stopped the app and installed the untouched code `1000001` APK in place. With Metro stopped and no active network, cold startup restored the account, event, pending attendance and score draft. Reconnecting and saving produced present attendance and exactly one result at revision 1; completion reached the server and showed the read-only summary. This proves preservation of current-format state through an Android version-code upgrade. The baseline differs only in versionCode/signature packaging; it is not evidence of a historical release or schema migration.

Inspected [before upgrade](receipts/2026-10-19-before-upgrade.png) and [offline after upgrade](receipts/2026-10-19-after-upgrade-offline.png). Coverage: isolated Android 14 x86_64 AVD, 800×1280 at density 320 (400dp), English/light. Initial System UI stalls required disabling Google Play services/store in this temporary AVD; physical-device performance, TalkBack, the full layout/theme/locale matrix and native account-switch/conflict/revocation journeys remain unverified. The earlier offline error banner remained after successful sync; this verified display defect is in [known issues](../known-issues/README.md).

**Cleanup complete:** stopped only the verified temporary AVD, ended the interactive acceptance runner, and removed its disposable API/database and private fixture/helpers. Original AVD/account, normal development services and data were preserved. The signed APK/checksum/build metadata and private ignored signing key are retained. Private key backup was subsequently confirmed complete by the founder (7-Zip copies on PC and cloud). No public APK upload occurred. See the [raw receipt](receipts/2026-10-19-release-acceptance.json).

**Packaging history:** native compilation initially reached fatal lint for three missing `includeSubdomains` attributes. Explicit `false` fixed exact-host exceptions. The founder authorized retaining beta.1 for these initial packaging corrections and correcting the provisional source tag. Shortened app staging yielded 61 ARM64 object paths, maximum 254 characters, none above 256. Script syntax/help, targeted formatting, documentation links across 50 maintained documents and `git diff --check` passed; no additional native build or broad browser suite was run for the verifier/docs correction.

## Beta acceptance step 2 — 18 October 2026

**Passed:** 18 Node SQLite queue cases; one native HTTP + real SQLite integration scenario against a freshly migrated disposable PostgreSQL database/API; backend TypeScript and launcher syntax. The queue command initially hit Windows child-process `EPERM`; the same file passed with `--test-isolation=none` on Node 24.21.0. The integration fixture first reused a session intentionally revoked by refresh-token reuse; the corrected fixture passed. The final API-only runner also passed and automatically stopped its API and removed its database/files.

Coverage: native login/session/refresh/reuse/logout; server-committed lost acknowledgements for attendance, fractional Arabic-entered scores and event completion; exact receipt replay and changed-payload rejection; 25+3 score-history pagination without duplication; wrong participant/outside-account denial; stale revision pause without replacing the saved base; membership revocation blocking new and previously acknowledged operation replay. This does not establish event-staff reassignment behavior.

**Passed native slice:** resumed on emulator-5554, Android 14, 1280×800 landscape at density 320, using the temporary managed profile and a fresh isolated API/database. Synthetic sign-in succeeded. Downloaded a roster, recorded attendance, then disabled both Wi-Fi and mobile data. A fractional score draft showed device-save acknowledgment; submitting produced an uncertain queued result. Force-stopped only the temporary app, restored connectivity for Metro, and reopened it. The queue replayed and the API showed one score result, value `12.5`, revision 1. Attendance and score history rendered the matching entries. Event completion reached the server and removed capture controls, showing the confirmed read-only summary. This does not prove cold startup without Metro/network access.

Native storage initialization passed the app's `cipher_version` guard. The temporary profile's database first 16 bytes differed from the plaintext SQLite header. This supports SQLCipher use in this build; it is not a cryptographic or key-extraction audit.

A separate offline attendance entry remained uncertain. Recovery sharing required the privacy confirmation, opened Android's text chooser with the exact pending operation, and cancellation retained the entry without a delivery claim. Restored connectivity, read fresh server records separately and switched to Arabic. Inspected [English score history](receipts/2026-10-18-mobile-score-history.png) and [Arabic dark recovery](receipts/2026-10-18-mobile-recovery-ar-dark.png): history values were visible; recovery text/actions mirrored and aligned RTL. These are two inspected states, not a complete locale/theme/layout matrix.

**Cleanup complete:** verified and removed only temporary profile 10, its shared temporary UI/screenshot files, isolated database `rafik_browser_1792352387524`, isolated API/runner and ignored fixture/helper files. Restored emulator Wi-Fi/mobile data, light mode and the original account's foreground app. The runner was launched without interactive stdin, so `done` could not be sent; cleanup used verified process IDs and the exact disposable database name. Original profile/sign-in/data were not reset.

See [raw receipt](receipts/2026-10-18-field-acceptance.json). No broad browser suite or native rebuild ran. Remaining acceptance includes physical hardware, portrait/phone layouts, assistive technology, native account switching, rendered conflict/revocation recovery, event-staff reassignment and cold offline startup/distribution. This focused pass does not declare the whole beta release ready.

## Web/API and deployment baseline evidence

| Area                       | Retained evidence                                                                                                                                                                       | Limits still applicable                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| University web workflows   | Stage 4 accepted focused Chromium desktop/WebKit phone conversation and injury consent/status/correction/withdrawal journeys; API role/lifecycle checks and source/build checks passed. | Current beta web build passes; later browse-list/multiple-attachment journeys still need focused rendering. This is not universal usability/device acceptance. |
| Branding and local support | Stage 5 focused Chromium desktop/WebKit phone branding flow passed; the founder observed branding persist across service restarts. Outbound support remains disabled.                   | Branding-specific database restore and later style/loader combinations were not independently proven by the initial browser run.                               |
| Compose/recovery           | Implemented self-host foundation; earlier paired backup/restore has founder acceptance. Isolated database/API outage/restart passed.                                                    | No disposable Unix update/rollback or actual alert delivery claim. Each institution configures and reviews its own environment.                                |
| Optional cloud templates   | Provider-specific VM starters are present.                                                                                                                                              | No Terraform/provider deployment, cost, backup/restore or teardown acceptance; founder-deferred user testing.                                                  |

Detailed earlier check narratives and failed/configuration-only attempts are in the [dated verification snapshot](../archive/verification-through-2026-10-19.md). Raw receipts remain under [receipts](receipts/). Use [known issues](../known-issues/README.md) and the [release checklist](../operations/release-checklist.md) for current gaps and publication actions. Historical snapshots are evidence, not current onboarding instructions.
