# Local verification record

## R5 verification — 23 September 2026

Executed locally on Node 22.16.0, Supabase CLI 2.90.0 and `rafik-revamp-local`. Migration 009 was applied additively; the existing preview was retained. No hosted project, external provider, remote CI run, native change or push is implied.

| Check | Actual result / boundary |
|---|---|
| Backend `npm test` | **229** rollback assertions pass: 209 prior + 20 exercise-choice cases. Validates approval/kind/bounds/access, trustworthy snapshots, immutable prescriptions, actual choice consistency, exact retry and payload mismatch, correction/completion, progress/prior performance and independent import/handoff copying. |
| `npm run test:fresh` | All **nine migrations**, fixtures and six SQL suites pass in a disposable database without resetting the preview. |
| Real HTTP services/teams | All **five service** and **nine team** groups pass, including booking races, real private Storage, consent/handoff, provider/support boundaries and temporary-account cleanup. |
| Schema/content/types | Local schema lint reports no errors; generated web types and canonical content checks pass. Domain table count stays 37 plus one internal setting. |
| Unit/build/format | **10/10** unit/data tests, production build/TypeScript, formatting and whitespace checks pass. |
| Full browser regression | **46/46** pass in one final serial run across Chromium and phone-sized WebKit: all 40 existing scenarios plus six new quality scenarios. No retries configured. New tests use disposable accounts. |
| New user journeys | Long history with reachable composer, older paging, unread while reading, phone inbox/back, draft/context recovery and send focus; coach authors alternatives, client records through a blocked save/reload and completes via UI, coach reviews actual identity, progress and correction preserve history; check-in growth/search/paging/focus/direct scheduling destination. |
| Render review | **52 baseline layouts** across 26 routes informed the audit. Final focused **128-layout matrix**, 32 phone Axe states, no overflow/page errors/accessibility violations or failed composer-in-viewport checks. Actual desktop/phone/Arabic/dark and phone validation-state screenshots inspected; this is not physical-device or human-task evidence. |
| Engineering docs | `npm run test:docs` validates local links in **29** maintained documents. CONTRIBUTING, ADRs, API conventions, current architecture/file maps/runbook and both AGENTS rules are updated. CI definition includes the doc check; remote execution remains unverified. |

Reproduce with backend `npm test`, `npm run test:fresh`, `npm run test:services`, `npm run test:teams`, `npm run content:check`, `npm run test:docs` and `npx supabase db lint --local`; frontend `npm test`, `npm run format:check`, `npm run build`, `npm run test:e2e`, `npm run test:quality:layout`. Browser checks require local backend + dev 5173 + production preview 5174. Persisted evidence: [R5 local checks](evidence/r5-local-checks.md), [layout matrix](evidence/r5-quality-layout.json), [product quality review](product-quality-review.md). Raw logs are `/tmp/rafik-r5-*.log`; web artifacts/reports/traces are ignored.

Verification found and fixed real issues, including unbounded conversations, unseen-message read marking, disabled-field focus and phone validation-state hit-testing. Pagination required a direct post-scheduling destination and full-result count assertions. A test-only completion race was removed by exercising the actual finish UI; an older appointment fault test now waits for the injected failure before reload. One stale exact-text test locator was corrected to assert its contextual region. The known local engine crash on a denied internal-function call inside PL/pgSQL was avoided by testing the public command boundary; later SQL/fresh/HTTP checks pass, but no engine fix is claimed. Development trace collisions from an overlapping run were eliminated in the final serial execution.

**Still unverified:** physical-device keyboard/touch/suspension, assistive technology, new hosted Auth/email/Storage/backup/CI operations, real external adapters, observed unaided task success, retention and payments. Follow the [release checklist](release-checklist.md); local engineering acceptance does not certify launch readiness or business success.


## R4 verification — 23 September 2026

Executed locally with Node 22.16.0, CLI 2.90.0 and `rafik-revamp-local`. R3 was checked before implementation: 135 SQL assertions, real service/concurrency tests and 36 browser scenarios passed. Existing preview data was preserved; R4 adds two migrations without reset.

| Check | Actual result / boundary |
|---|---|
| Backend `npm test` | **209** rollback assertions pass: previous 135 plus **74 R4**. Includes email/expiry/verified-invite rules, fixed-role boundaries, minimal roster/private context, exact consent/handoff replay, future plan copy, started-workout replay after handoff, atomic group selection/receipt, independent template/exercise copies with catalog-edit isolation, lifecycle guards/ownership transfer/group archive, commercial limits/out-of-order receipts/server simulator gate and support visibility/revision. |
| `npm run test:fresh` | All **eight** migrations, generated content/local fixtures and **five** SQL suites pass in a disposable database. No preview reset. |
| `npm run test:teams` | Nine real HTTP check groups pass with four temporary Auth identities: intended invitation email; concurrent handoff replay and private started history; future appointment release/unanswered-form cancellation; real staff-only Storage bytes; service-only duplicate/stale provider receipts; private support/operator reply via the actual guarded CLI; download revocation on member removal; departed file-owner audience/revocation; guarded owner deletion followed by closed-team cleanup preserving client history. Temporary accounts and bytes removed. |
| Existing `npm run test:services` | All R3 booking/concurrency, dual-role booking, registered Storage upload/overwrite/share/revoke/byte cleanup and account-deletion scenarios pass. |
| SQL lint/content | Application schema lint reports no errors. Generated content check passes. Generated API types reflect all 38 public tables (37 domain + internal settings). |
| Web unit/data tests | **10/10** pass; existing prescription/date/progress/nutrition checks retained. |
| New browser scenarios | Four R4 scenarios (two workflows × Chromium/WebKit phone configuration) pass; repeated twice for **8/8** after correcting failure-injection timing. Fresh identities exercise staff invite, client consent/Today cue, explicit group assignment with dropped acknowledgement/reload/retry, shared plan editing destination, handoff, restricted subscription and support draft/reply/reload. |
| Full browser regression | **40/40** pass across Chromium and phone-sized WebKit: all 36 prior-phase scenarios plus four R4 scenarios. Final complete run finished after the retry-test timing correction and UI permission-state adjustments. |
| Final affected-flow rerun | **4/4** R4 browser scenarios pass after the final proposed-coach access and legacy-snapshot hardening; final 209-assertion/fresh/HTTP/lint runs also pass. |
| R4 rendered layout matrix | **176/176** states: eleven populated destinations/tab states × four widths (320, 390, 768, 1440) × English/Arabic × light/dark. Zero horizontal overflow or page errors. **44** 390px states checked with Axe: zero reported violations. Representative rendered desktop/light and phone/Arabic/dark screenshots inspected. This is automated Chromium rendering, not physical-device/human usability evidence. |
| Build/format | Production build + TypeScript checks and web formatting check pass. Whitespace diff checks pass. |

Reproducible sources: `supabase/tests/team_business.sql`, `scripts/verify-teams.mjs`, `scripts/verify-fresh.mjs`; companion `tests/teams.e2e.ts`, `tests/team-fixture.ts`, `scripts/verify-team-layout.ts`. Existing suites remain in the standard test commands. Raw ignored local evidence is under web `artifacts/r4-*`, `playwright-report` and `test-results`; compact persisted receipts are in `evidence/r4-local-checks.md` and `evidence/r4-layout.json`.

Two test-development findings are recorded explicitly. The new browser fault-injection test initially reloaded as soon as the pending command appeared, which could precede the intended network abort; it now waits until that attempt finishes before reload. An intentionally denied dynamic SQL call inside the temporary PL/pgSQL test helper caused one local database process crash/recovery during development. The grant check now uses `has_function_privilege`, and denial is independently tested through real PostgREST. The final fresh/database/HTTP checks passed afterward; no database-engine fix or hosted behavior is claimed.

Local simulation is not verified payment collection. No hosted project/deployment, actual outbound support/staff email, remote CI run, physical phone, real participant retention or commercial success was tested. R5 product integration and the explicitly open substitutions/alternatives remain unfinished. Test fixture ownership/handoff does not modify existing Laila/Amir team membership or historical data.

## R3 verification — 22 September 2026

Executed against `rafik-revamp-local` with Node 22.16.0, CLI 2.90.0 and local Storage enabled. Existing preview data was preserved; no hosted stack or native device was used.

| Check | Actual result / boundary |
|---|---|
| Backend `npm test` | **135** rollback assertions pass: 27 foundation + 24 R1 + 42 R2 + 42 R3. R3 covers nutrition snapshots/unknowns/corrections, bounded/DST availability, booking/rescheduling/cancellation/attendance, permissions and resource metadata lifecycle. |
| `npm run test:fresh` | All **six** migrations, generated fixtures and four SQL suites pass in a disposable database. Auth/Storage managed schemas are bootstrapped locally; preview rows are not copied/reset. |
| `npm run test:services` | Real Auth/REST/Storage requests pass: two simultaneous clients yield exactly one booking; dual coach/client role conflicts are blocked; uploads require registration, overwrites are rejected, shared bytes match, revocation blocks subsequent download, deletion removes bytes before metadata, client deletion reopens future availability, coach deletion handles remaining bookings. Three temporary identities are removed afterward. |
| Supabase schema lint | No schema errors/warnings in application functions after final changes. |
| Web unit/data tests | **10** tests pass, including portion scaling, unknown versus zero nutrition values and existing calendar/progress/prescription checks. |
| Browser regression suite | **36/36** pass on Chromium and phone-sized WebKit, including all prior-phase scenarios. The six R3 scenarios cover guidance/food reuse/meal correction/reload; booking/rescheduling/cancellation plus a lost booking acknowledgement; real private file download/attachment/revocation/removal plus a lost finalization acknowledgement. |
| Final affected-flow rerun | **6/6** R3 scenarios pass after final UI adjustments; final SQL and HTTP tests pass after retry/lock hardening. |
| R3 visual matrix | **128** combinations: eight role/routes × widths 320/390/768/1440 × English/Arabic × light/dark. Zero document overflow, zero page errors. The 32 states at 390px have zero reported Axe violations. |
| Build and formatting | Production build/type check and Prettier check pass. Generated schema types match the final local schema. |

Repeatable sources: `supabase/tests/service_delivery.sql`, `scripts/verify-services.mjs`; frontend `tests/service-delivery.e2e.ts`, `tests/nutrition.test.ts`, `scripts/r3-visual-check.mjs`. Local render evidence is in frontend `artifacts/r3-*.png` and `r3-visual-matrix.json`. Representative populated nutrition, booked appointment and shared-resource captures were inspected, alongside desktop English and Arabic dark phone states. During inspection, unused empty nutrient summaries were removed, query-only navigation was corrected to preserve input focus, phone workspace tabs were made to wrap so More stays visible, native Safari selects were styled at touch size, and direct entry-form links were added. The full 36-scenario suite and the matrix were rerun after the shared navigation/control refinements.

Database assertions use synthetic storage metadata inside rolled-back transactions; **only the HTTP/browser checks establish real byte behavior**. Browser fault injection commits selected requests and drops the acknowledgement to exercise retry, rather than merely mocking a success response. Whole-product release readiness, real people/retention/payments, physical phones, remote CI, hosted Storage, outbound notifications and external calendar delivery remain unverified or unimplemented. No claim of malware scanning, file recall after download, all-feature offline support or production-scale performance is made.



## R2 ongoing coaching — 22 September 2026

| Check | Result and exact boundary |
|---|---|
| Database lifecycle suites | **93 assertions passed**: 27 foundation, 24 daily coaching, 42 ongoing coaching; all rollback transactions |
| Clean install | All three migrations + generated synthetic seed + all suites pass in a disposable database; working preview preserved |
| Schema lint | No schema errors reported by the pinned local Supabase CLI |
| Type/build and formatting | Production build includes `vue-tsc`; Prettier and diff whitespace checks pass |
| Unit/data checks | **8 passed**, including unit-aware mixed-result trends, response states and distinguishing rejected commands from ambiguous delivery |
| Browser regression | Final full suite: **30 scenarios passed** across Chromium and phone-sized WebKit (20 foundation/R1 regression cases and 10 R2 cases), including assignment retry and rejected-message recovery |
| Existing-layout regression | 224 route × width × language × theme combinations plus Arabic dark editor accessibility; no overflow/page errors |
| Populated R2 matrix | 11 role-specific routes × 4 widths × 2 languages × 2 themes = **176** combinations; 44 phone accessibility states checked; no overflow, page errors or checked Axe violations |
| Local preservation | Additive R2 migration and new synthetic fixture rows only; no preview reset, retired-backend change, native/worker source change, hosting or push |

R2 browser paths cover template creation, assignment, draft persistence after reload, client submission, coach review, client correction clearing old feedback, contextual message/reply and unread activity; repeated numeric assessments with compatible-history comparison and cancellation; real progress and shared measurement correction/removal; lost message acknowledgement with reload/retry producing one message; lost assignment acknowledgement with reload/retry producing one occurrence; and a confirmed invalid message context remaining editable for correction.

SQL coverage adds definition/snapshot stability, recurrence bounds and replay mismatch, required/type/range validation, coach/client ownership, stale review/response correction, original submission preservation, private/shared measurement reads, revision/units, message UUID/context isolation, forward-only/non-future cursor, archive behavior and unrelated participant rejection. Two additional progress assertions prove completed actual values (excluding incomplete sets/targets) and recomputation after a correction without another completion.

Verification found and corrected an ambiguous SQL field alias. Browser tests initially used an implicit-label selector on selects; they now target accessible combobox names. A theme-switch accessibility check sampled intermediate transition colors; it now waits for fonts and active animations to settle. Visual inspection prompted phone conversation-name truncation, automatic text direction for messages, friendly-name fallback for older snapshots, and a first-result state instead of a one-point chart. Trend positions follow calendar spacing rather than pretending all sessions occurred at equal intervals.

Captures were inspected from actual browser renders, including desktop progress, the form editor and Arabic dark phone conversation/response views. Regenerate with `node scripts/r2-visual-check.mjs`. Selected local captures:

- [Client progress](../../../RAFIK-FRONTEND/artifacts/r2-matrix-client--progress-1440-en.png)
- [Arabic phone conversation](../../../RAFIK-FRONTEND/artifacts/r2-matrix-coach--coach-messages-40000000-0000-4000-8000-000000000001-390-ar.png)
- [Arabic phone response](../../../RAFIK-FRONTEND/artifacts/r2-matrix-client--checkins-73000000-0000-4000-8000-000000000001-390-ar.png)
- [Assessment review](../../../RAFIK-FRONTEND/artifacts/r2-assessment-webkit-phone.png)

Sanitized results are stored in `evidence/r2-*`. The test pages use synthetic local accounts and actual SQL/PostgREST; only delivery-failure tests intercept acknowledgements. No real email/message recipient or external provider was contacted. No claim is made about physical devices, hosting, remote CI, production-scale performance, retention or willingness to pay. Direct conversation attachments and nutrition/booking/resources remain subsequent work.


22 September 2026. Scope: the newly rebuilt web application and local Supabase backend. Browser-generated activity is synthetic and is not customer validation. All commands ran on `codex/revamp`; no remote CI, deployment, push or live outbound message was performed.

**Coverage limitation:** these checks cover the initial training/coaching slice only. They do not establish that Rafik's full feature set has been revamped. Missing and partial capabilities and their next implementation waves are recorded in [revamp coverage](revamp-coverage.md).

## R1 verification update

The original results below remain the baseline record. The daily-coaching expansion adds these verified local results:

| Check | Result and boundary |
|---|---|
| Database suites | 51 assertions: 27 core + 24 daily coaching; both run in rollback transactions |
| Fresh schema/fixtures | `npm run test:fresh` passed in a disposable database using Auth schema only, both public migrations and synthetic fixtures; original preview records unchanged |
| Schema lint | Pinned Supabase CLI reports no schema errors or warnings after explicit array initialization and loop-variable cleanup |
| Browser journeys | 20 passed: 10 in Chromium, 10 in phone-sized WebKit; includes custom exercise, multiweek mixed plan, schedule, actual recording, group round/rest guidance, review, private notes and archive/reactivation |
| Layout | 224 combinations: 14 routes × four widths × English/Arabic × light/dark; no overflow or page errors |
| Accessibility | Checked client workspace (English and Arabic dark), catalog, editor and mixed logger report no Axe violations; Arabic dark editor matrix check also passes |
| Build/units | TypeScript + production build passed; five unit/data tests passed, including calendar dates west of UTC and leap-day/timezone boundaries |
| Preservation | No preview reset, hosted change, worker/native source change or remote push |

The roster and mixed-plan tests use real local Auth, SQL and PostgREST. Database scenarios separately prove that two clients receive independent sessions from the same plan. Schedule exceptions and wrong-date rejection are exercised at the database layer; physical-device and real-person task validation remain unperformed.

The initial browser run found outdated test selectors after the review table changed from separate load/reps columns to actual/target columns. Repeatability also required selecting the newly created test client explicitly, and waiting for durable completion feedback before a reload. SQL fixtures are isolated inside rollback transactions so preview activity no longer collides with test occurrences/context revisions. The initial layout accessibility check ran before the editor had mounted; it now waits for the actual editor field. These were corrected before the passing results above.

Actual new screenshots in the frontend's ignored `artifacts/` folder include `r1-client-*`, `r1-client-ar-*`, `r1-library-*`, `r1-plan-*`, `r1-schedule-*`, `r1-distance-*` and `r1-review-*`. Desktop and phone renders were inspected. Disabling animations for captures avoids showing transitional theme colors; unfocused skip links are clipped to avoid a WebKit full-page capture artifact while preserving keyboard access.

Sanitized command summaries are in `evidence/r1-database.txt`, `r1-browser.txt`, `r1-fresh.txt` and `r1-layout.json`. This verifies R1, not the remaining product families in R2–R5.

## Results

| Check | Result | Evidence |
|---|---|---|
| Fresh Supabase reset | Passed | New migration and synthetic seed apply from source, project `rafik-revamp-local` |
| Database regression suite | 27 assertions passed | `supabase/tests/core.sql`; rollback transaction, includes lifecycle/access/atomicity/concurrency |
| Frontend TypeScript + production build | Passed | `npm run build`, includes `vue-tsc --noEmit` |
| Unit/data-read tests | 3 passed | Weight conversion/round-trip and history beyond the 500-row server response limit |
| Browser task/fault suite | 16 scenarios passed | Eight scenarios in each of Chromium and phone-sized WebKit; `tests/core.e2e.ts` |
| Layout matrix | No horizontal overflow or page errors | 12 routes × four widths (320/390/768/1440) × English/Arabic × light/dark = 192 combinations; phone subset rechecked after navigation refinement |
| Automated accessibility | No violations in checked states | Axe checks for public entry, logger, Arabic routine/logger, editor and review; additional Arabic dark editor pass |
| Keyboard path | Passed in browser tests | Skip-link focus/activation and main-content focus; WebKit uses its Option-Tab link traversal behavior |
| Content consistency | Passed | `npm run content:check`; canonical JSON matches generated SQL and web sample |
| Dependency audit | No known vulnerabilities reported in the checked installs | npm audit; backend CLI's `tar` transitive dependency overridden to patched 7.5.22 |
| Formatting/whitespace | Passed | Prettier check for new web source/tests/configuration; `git diff --check` |
| Scope preservation | Passed | Four revamp branches; mobile clean; worker only has original `.DS_Store` change |

## Browser scenarios

1. Guest sees a useful sample, records changed actual values, reloads, and finishes without signup.
2. Arabic RTL and dark theme display the sample/logger with no overflow and no Axe violations.
3. Coach starts from a real plan, previews/publishes, creates an invitation; intended new client verifies a local email code, accepts, records, syncs and leaves a note; coach reviews; client sees the reply and corrects actual values.
4. Offline entries sync after reconnect. A server-committed request with an intentionally lost response retries safely. A second device's stale edit retains its draft and offers deliberate recovery.
5. The production shell reloads a real opened guest workout after origin/network loss and preserves subsequent edits across another reload.
6. A completed guest workout survives email-code sign-in and is adopted automatically into the account without repeating the save action.
7. A plan draft survives reload and a failed publish/save request; retry succeeds with the draft intact.
8. Invalid set values prevent completion. Correcting the value restores the action. Keyboard skip navigation reaches the main content.

The task tests use actual local Supabase Auth/PostgREST/SQL, not a mocked successful backend. Only fault injection deliberately intercepts a save response. All email recipients use the local synthetic domain and Mailpit.

## Important offline-test distinction

Chromium's production reload test uses browser offline emulation. In this macOS WebKit runner, `setOffline(true)` causes a navigation-level internal error before service-worker fallback. A separate controlled test shuts down a test-owned static server entirely, reloads the production page, verifies a new document boot identifier, and checks retained/continued workout values. That WebKit test passes. In-page offline save/reconnect tests also pass in WebKit.

This isolates an automation-mode limitation; it does **not** certify a physical iPhone in airplane mode. Physical Safari/Chrome testing, storage eviction, OS app suspension, real mobile keyboards and device power interruptions remain release gates.

## Defects found and corrected during verification

| Finding | Consequence | Correction and recheck |
|---|---|---|
| Public version policy referenced authenticated-only tables | Guest public reads failed before evaluating the public branch | Split public and authenticated policies; guest/database checks pass |
| A saved field rerender could reset another field before blur | Last typed repetition could disappear on reload | Independent input drafts and immediate valid-value persistence; exact-value reload checks pass on both engines |
| Cached clean sessions did not reread coach feedback | A client could miss a saved reply | Refresh clean records on reopen, preserve concurrent local edits; coach/client test passes |
| Recovery loaded remote data but kept old input buffers | The conflict view could still display the discarded value | Clear buffers only after deliberate remote reload; two-device test passes |
| Production static requests had differing `Vary: Origin` headers | Offline shell loaded HTML but missed cached JS/CSS | Ignore header variation only for the allowlisted same-origin static cache; production reload tests pass |
| Email sign-in returned to a guest save button | User had to repeat an already requested save | Explicit task context triggers adoption on return; automatic-adoption test passes |
| Phone header hid the training/coaching switch | Switching tasks required a trip through the landing page | Visible compact authenticated navigation; phone matrix rechecked |
| New plan save replay could add a revision | A lost acknowledgment could create extra publication revisions | Recognize identical acknowledged content; SQL replay assertion passes |

## Render evidence

Actual browser captures are stored locally in the frontend's ignored `artifacts/` directory. They can be regenerated with the task tests and `node scripts/visual-check.mjs`. Selected views:

- [Public entry](../../../RAFIK-FRONTEND/artifacts/home-chromium.png)
- [Phone logger](../../../RAFIK-FRONTEND/artifacts/logger-webkit-phone.png)
- [Arabic dark logger](../../../RAFIK-FRONTEND/artifacts/logger-ar-dark-webkit-phone.png)
- [Plan editor](../../../RAFIK-FRONTEND/artifacts/editor-chromium.png)
- [Clean synthetic coach workspace](../../../RAFIK-FRONTEND/artifacts/final-coach.png)
- [Clean client Today](../../../RAFIK-FRONTEND/artifacts/final-client.png)
- [Coach review](../../../RAFIK-FRONTEND/artifacts/final-review.png)
- [Client result and feedback](../../../RAFIK-FRONTEND/artifacts/result-chromium.png)
- [Arabic phone settings](../../../RAFIK-FRONTEND/artifacts/matrix--settings-ar-phone.png)

Screenshots include synthetic testing data. They were inspected for hierarchy, readable controls, real content, clipping and responsive flow. Automated layout/accessibility checks complement that inspection; they are not a usability study or comprehensive accessibility certification.

## Not established by these checks

No claim of customer acquisition, retention, willingness to pay, real-person completion time, production-scale performance, remote CI success, hosted deliverability or physical-device readiness is made. No external notification or payment integration exists. The local preview privacy copy and seeded public version must be replaced/configured through the hosted-release gate before deployment.

The local foundation can be reviewed, but broader product implementation remains before whole-product release readiness. Execute the coverage register, then integrated and physical-device validation; hosting and real-use observations remain separate phases described in `runbook.md` and `pilot.md`.
