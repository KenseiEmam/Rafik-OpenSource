# Local verification record

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
