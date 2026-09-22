# Local verification record

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
