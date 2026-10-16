# R5 local evidence

23 September 2026. Local revamp stack only. Existing preview retained; no reset, remote deployment, native change or push.

## Database / real service checks

- `npm test`: 229 rollback assertions (209 existing + 20 exercise-choice cases).
- `npm run test:fresh`: all nine migrations, synthetic fixtures and six SQL suites pass in a disposable database; preview unchanged.
- `supabase db lint --local`: no schema errors.
- `npm run test:services`: all five real HTTP booking/Storage/account lifecycle groups pass.
- `npm run test:teams`: all nine team/handoff/Storage/commercial/support groups pass; temporary identities and bytes removed.
- `npm run types`, `npm run content:check`: generated interfaces/content agree with local source/schema.
- `npm run test:docs`: checks links in maintained engineering docs, skipping historical audit baseline references and the sibling repository only when it is absent in backend-only CI.

SQL choice cases cover bounds, same-kind requirements, private/retired catalog rejection, replacing forged snapshot info, immutable prescriptions, retry identity, per-exercise consistency, unapproved choice rollback, progress/previous-performance identity, correction preserving completion, unrelated identity denial and independent import/handoff helper ownership.

## Product inspection

- Baseline: 52 layouts across 26 coach/client routes, plus source/task review; concrete findings in `product-quality-review.md`.
- Focused final matrix: 128 populated route/width/language/theme layouts; 32 phone Axe states. No overflow, page errors or failed composer visibility checks. Full matrix is `r5-quality-layout.json`.
- Directly inspected desktop and phone Messages; Arabic/dark Messages and client Today; phone exercise choice; coach review; check-in growth and optional-service role/empty states. Separate temporary exercise-choice screenshots verify original target and selected identity are distinguishable.
- These are browser renders and scripted interactions, not physical-device or human usability study results.

## Regression record

All 46 browser scenarios pass in the final serial run. Frontend unit/build/format checks and the complete browser suite are recorded in the R5 section of `verification.md`. New browser scenarios create temporary identities and clean them up: long conversation/read cursor/paging/navigation/draft/context/send focus; blocked-save choice recovery/review/progress/correction; growing check-in pagination/search/direct scheduling destination.

Development caught phone error-state clipping/hit-testing, a disabled-composer focus defect, an ambiguous SQL variable and a pagination/confirmation interaction. The exercise browser scenario completes through the actual UI, avoiding a test-only race with its in-flight save. The appointment fault test now waits for the injected failure before reload; the previous version could reload before the first request was sent. Test changes also corrected a stale button name, key-based result lookup, searchbox semantics and page-transition waiting. The older duplicate-assignment test now checks the full visible result count rather than assuming every record renders on one page; its lost-acknowledgement invariant is preserved.

The known local Postgres engine segmentation fault recurred when a SQL test attempted to call the non-executable internal validator directly inside a PL/pgSQL block. The stack recovered; the test was corrected to exercise the public `save_plan` boundary. Subsequent full SQL/fresh/lint and real HTTP runs pass. This does not claim an engine bug fix. One overlapping test-development run also caused trace-artifact collisions; final runs are serial. Raw local development logs are `/tmp/rafik-r5-*.log`; browser reports/screenshots/traces remain ignored artifacts.

## Not established

Remote CI, hosted email/Storage/backup/recovery, real payments/notifications/calendar adapters, physical device suspension/keyboard/touch, assistive technology, human task success, retention and commercial outcomes remain unverified. See the release checklist.
