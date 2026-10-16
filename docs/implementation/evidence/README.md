# Recorded local checks

Sanitized summaries from the actual 22 September 2026 runs, alongside the reproducible source tests. Synthetic UUIDs, request tokens and mail codes are omitted from these summaries.

- `database-scenarios.txt`: 27 passing assertions, after the final clean reset including two synthetic history fixtures.
- `browser-tasks.txt`: 16 passing Playwright scenarios using bundled Chromium and phone-sized WebKit.
- `unit-tests.txt`: three passing weight/data-read checks.
- `visual-matrix-full.json`: 192 route/width/language/theme combinations plus an Arabic-dark editor accessibility check.
- `visual-matrix-phone-final.json`: 96 phone combinations rechecked after the authenticated navigation refinement, plus the accessibility check.

Node 22.16.0, Playwright 1.63.0, Vue 3.5.43, Vite 8.3.0, Supabase CLI 2.90.0. Exact pins are in the two package files/lockfiles. See `../verification.md` for the WebKit offline-test method and unverified physical-device/business gates.

R1 expansion: `r1-database.txt` (51 assertions), `r1-browser.txt` (20 scenarios), `r1-fresh.txt` (isolated migration/fixture checks), `r1-layout.json` (224 layout combinations plus accessibility check). Historical baseline evidence is retained separately.

R4: `r4-local-checks.md` is the final local verification receipt; `r4-layout.json` records the populated 176-state render/accessibility matrix. Reproducible commands, exact regression totals and observed test-harness limitations are in `../verification.md`.

R13: `r13-release.json` records the final 26-gate run; `r13-verification.txt` records 76 browser journeys, 1,120 rendered states, exact scope, discovered/fixed defects and limitations. The seven `r13-*-layout.json` files retain the declared matrices. Historical counts above describe their own checkpoints.
