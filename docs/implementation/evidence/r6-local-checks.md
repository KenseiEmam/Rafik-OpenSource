# R6 local maintenance and release evidence

23 September 2026. Node 22.16.0, pinned Supabase CLI 2.90.0, `rafik-revamp-local`, sibling web/backend checkouts on `codex/revamp`. No hosted project, real provider, native change, preview reset or push.

## Report ownership

The final serial release report and per-step logs live in ignored backend `artifacts/release/`. The sanitized report/aggregate layout summaries alongside this document identify the completed run. Web screenshots/traces remain in ignored web `artifacts/`, `test-results/` and `playwright-report/`; regenerate with documented commands. Temporary account fixtures clean up their own records. Older browser journeys still leave synthetic sample-coach examples.

## Concrete fixes and regressions

- Before: at 390×844, inbox width 478px inside 352px available space; each contact row 250px. After: inbox 352px, rows approximately 82px; long names truncate within their row, search stays contained, all workspace navigation is visible. The populated regression uses two fresh contacts and a long unbroken name across five viewport shapes, two languages and both engines; search/no-match/back navigation stays usable.
- The all-feature route audit found WebKit overflow in roster plan selections at 320px and Arabic resource filters at 390px. Real long-title and Arabic native-control regressions now pass. Roster navigation was also exercised on the populated preview: 12 visible → show more gives 24 → search Amir gives one → clearing search resets to 12.
- A full browser run caught transient low contrast during theme interpolation. Removed interpolated foreground/background transitions; retained actual hover/focus states and the unchanged Axe assertion. Both engines passed the targeted check, then the final full suite.
- Production update checks cover a failed **first** install and retry without reloading, a failed later update, a ready worker waiting beside an open workout, old-version reload, activation after tabs close, retained actual values, API exclusion from caches and offline reload after the test origin is shut down.
- A real generated-output check initially failed: the worker was hashed before final Vite transformations, and two HTML-only builds had identical identities. Generation now runs against final emitted files in `writeBundle`; the same check passes and requires distinct HTML-only versions.
- Piping the SQL launcher exposed truncated logs from immediate `process.exit`. Replaced it with an exit code plus normal stream draining. A piped rerun retained **229 PASS notices and all six ROLLBACK completions** (121,460 bytes of combined output at that run).

## Feature and visual review

Use [the feature verification map](../feature-verification-map.md) for each feature family's lifecycle, failure and access evidence. The complete browser suite exercises 52 scenarios across Chromium and phone-sized WebKit. It includes all prior training, programming, forms, progress, conversation, nutrition, booking, files, teams, business and support journeys plus new responsive/update cases.

Directly inspected: compact inbox with multiple/long-name contacts; desktop conversation; short/tall/landscape phone inbox; Arabic/dark client and coach Today, check-ins, progress, nutrition, appointments, More, support, settings and editor entry; corrected roster/resource controls; update ready/current states in English and Arabic. Also inspected Arabic/dark team client/staff/group/shared-library tabs and business/support surfaces. Team tab and final matrix evidence is recorded in the accompanying summary. Captures are browser renders, not physical devices or an unaided human usability study. Not every generated screenshot is claimed to have been manually inspected.

## Development failures and evidence boundaries

An early new inbox test read row geometry before back-navigation loading completed; it now waits for the actual multi-row surface. The first update test recorded a URL before workout navigation completed; it now waits for the real workout route. These changes preserve the assertions.

One intermediate release run was invalidated by a Vite restart during an Axe scan while the build-stage correction was being applied. Another run correctly stopped on the theme contrast failure. The extended WebKit team matrix also recorded startup request errors while its setup replaced a session before the login route finished loading. It now waits for that route before switching identities; no page errors are filtered or ignored. The team matrix is rerun independently after this harness correction. These intermediate failures are not accepted checks. The final full browser run uses the corrected frozen application and runs all 52 scenarios serially. Final acceptance combines that run with the corrected team-matrix rerun; it is not represented as one uninterrupted green command. The SQL log-draining-only maintenance fix was separately rerun through a pipe after the report's SQL step; schema/test semantics were unchanged.

No claim of physical keyboard/touch/suspension, screen-reader acceptance, hosted Auth/email/Storage/CDN/backups, remote CI, actual notification/calendar/payment delivery, human task success or retention is made. Notification preferences/intercepted delivery remain an explicit local product gap. The revamp remains a locally verified implementation, not a completed hosted/business launch.
