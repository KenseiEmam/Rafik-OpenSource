# Validation, evidence and remaining uncertainty

**Audit date:** 22 September 2026. Evidence comes from four local checkouts, local checks, public application pages, authenticated read-only Supabase CLI/Chrome inspection, synthetic database reproductions, the founder's account and cited public primary sources. Existing CLI authentication was used without printing credentials. No live records/settings/functions/jobs were changed, no outreach was sent and no production remediation was performed.

**Execution scope update:** the old product is inactive; the founder wants a clean replacement, with local work on `codex/revamp`, no legacy-data migration and mobile last. Old runtime/restore gaps below remain honest limits of the audit; they are not prerequisites for the new build.

## 1. Repositories and inventory

| Repository | Audited commit | Tracked source files / lines |
|---|---|---|
| rafik-api | `652e9eeef65ee089a7796c41e3ce5da5fd3f6f6d` | 14 / 1,855 |
| RAFIK-FRONTEND | `a0c723e1e15042e7cbed51cc391a4acd0e064fb3` | 158 / 37,332 |
| rafik-mobile | `49390b6991e427baa851c2e6519ce403efe15c45` | 198 / 62,747 |
| rafik-worker | `36fbd31dd4275c16017027b51c50d78f472f66db` | 1 / 684 |

The total is **371 files and 102,618 lines** for tracked `.ts`, `.js`, `.vue`, `.dart` and `.sql` files. It includes generated Flutter helpers. It excludes assets, dependencies and these untracked audit documents. It is not a complexity score. No tracked SQL/migration files or `.github` CI files were found in these checkouts; this does not establish the absence of live database policies or externally configured CI.

The read-only inventory script and its JSON output document the counting method. Direct service access counts use simple `.from(` / `Table().` heuristics and include some storage access. English/Arabic parity compares exact key paths; the 500 unmatched English paths are not necessarily 500 untranslated visible strings.

## 2. Executed technical checks

| Check | Result | What it establishes and what it does not |
|---|---|---|
| Vue TypeScript build check | Passed with `vue-tsc --build --force` | Type-checkable under installed dependencies; not runtime correctness |
| Vite production build with explicit Node 23.11.0 | Passed | Bundle produced; main chunk 1,277.82 kB / 400.35 kB gzip; calendar chunk 316.41 kB. Not real-device load time |
| Default Node build attempt | Failed on `crypto.getRandomValues` under Node 16.15.0 | Local toolchain mismatch; no enforced runtime pin was found. Node 23 was an available audit runtime, not the recommended production version |
| Vitest with explicit Node 23 | Exited 1: no test files found | No runnable Vitest cases in this checkout; not evidence that no testing ever happened elsewhere |
| Deno 2.2.10 API check | Failed with ten type errors | Invalid client option, environment access typing, LangChain compatibility and OAuth indexing problems. `--no-lock` resolves allowed dependencies now; this is not the exact deployed bundle |
| Flutter/native build | Not run: Flutter executable unavailable on PATH | Mobile conclusions are source-based. Native visual appearance, device behavior and runtime integration remain unverified |
| Five isolated logic reproductions | Passed assertions | Reproduces normalization collision, reminder cutoff inversion, caught-error success, null-filter omission and base-color contrast. Does not execute the live application or database |
| Live Supabase catalog/configuration | Captured through CLI and Chrome | Project identity, table/constraint/function/trigger/storage/realtime metadata, Auth/recovery/operations settings; read-only |
| Live aggregate consistency | Captured with reviewed SELECT queries | Counts, ID relationships, duplicate groups, expiry/activity/form state; no individual application records exported |
| Deployed function comparison | All eight downloaded to isolated temporary directory | Source/version drift and missing local function identified; saved copies sanitized; no invocation or deployment |
| Public schema-only export | Succeeded on fresh-login retry | Public SQL reference recovered; not a full data/Auth/Storage backup or approved migration |
| Eight database behavior reproductions | Eight passed | Selected captured functions replayed with synthetic fixtures in PostgreSQL 15.6, network disabled; live is 15.8. Not a full managed Supabase restore |
| Complete Supabase restoration and isolation/migration suite | Not yet run | The old-system suite is not required. New-system E01/E02/E10/E11 must prove clean reset, intended behavior/access and release recovery |

Audit command forms, run from their relevant repository:

```sh
python3 docs/revival/tools/collect_inventory.py
node docs/revival/tools/reproduce_findings.mjs
python3 docs/revival/tools/reproduce_backend_triggers.py
node node_modules/vue-tsc/bin/vue-tsc.js --build --force
node node_modules/vite/bin/vite.js build
node node_modules/vitest/vitest.mjs run
deno check --no-lock --config supabase/functions/api/deno.json supabase/functions/api/index.ts
```

For Vite/Vitest the successful tool invocation used `/Users/sami/.nvm/versions/node/v23.11.0/bin/node` explicitly. These commands describe the audit, not a finished clean-machine installation guide. Runtime versions and dependency locks should be deliberately pinned during recovery. Logs and reproduction outputs in `evidence/` are supporting artifacts; credentials and values from environment files are intentionally excluded.

## 3. Browser observations

The original Vue application ran locally with a dummy Supabase URL/key pointing at localhost. No login, database mutation or real account inspection was attempted. Screenshots were inspected in the browser tool but are not bundled as screenshot artifacts.

| Route / viewport | Observed result |
|---|---|
| Landing, 1280 × 720 | Green gradient, large decorative/empty areas, yellow accents and condensed headings/links; animated scrambling text delays the stable headline; multiple audience signals |
| `/login`, desktop | Email/password form, several invitation/demo links and large stock-athlete artwork |
| `/register`, desktop | Affiliate registration language; password criteria visible before input |
| Footer Privacy Policy | Navigates to `/privacy-policy`, which is blank; router declares `/privacy_policy` |
| `/dashboard`, 390 × 844 | Redirects to `/application?redirect=/dashboard`, which is blank; actual download route differs |
| `/login`, 390 × 844 | Form renders, but decorative imagery intrudes behind lower navigation; source-defined button pair has poor contrast |

Authenticated coach dashboards, plan editors and native mobile screens were traced in source, **not visually exercised with an authenticated account**. Findings label this distinction. The new implementation must capture and test its authenticated states with synthetic accounts. Restoring the old application to complete that visual audit is no longer part of the revamp.

Four existing website assets were also visually inspected: `homescr.jpeg`, `setlog.jpeg`, `Workout Breakdown.png` and `Client Statistics.png`. Document 02 links them and records their visual problems. Their date/runtime version is unknown; they may be older marketing or design snapshots. They supplement the public-page observations and do not substitute for a native-device or authenticated-session audit.

Chrome also inspected the live Supabase project overview, Data API, Auth providers, redirect URLs, email delivery/templates and managed-backup availability. Those observations are recorded in [dashboard observations](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/dashboard-observations.json). No settings were saved or test emails sent. This is backend configuration inspection, not authenticated product usability testing.

## 4. Interpreting the evidence

- Deployed handler source and gateway settings are now captured. A JWT gate does not replace object ownership; no live access attack or destructive invocation was performed.
- Tracked private credentials warrant remediation, but this audit does not establish validity, unauthorized use or a breach.
- The recovered triggers explain some transactional substeps and expose additional side effects. They do not make separate client requests atomic. Local replay proves selected behaviors, not their historical incidence for real users.
- A logic reproduction demonstrates an isolated behavior, not production incidence or user harm.
- The founder's account establishes failed activation and commercial conversion. It does not quantify where each user stopped or prove that friction was the only cause.
- Competitor pages establish advertised offers/prices. They do not establish comparative usability, market share, profitability or Rafik's chance of winning.

The 35 source/UX findings and the business hypotheses deliberately remain separate. Avoid converting plausible explanations into measured facts.

## 5. Minimal product measurement

Instrument meaningful outcomes, not an exhaustive click stream. Keep health notes, free-text responses, names, email addresses, auth tokens and private plan contents out of analytics payloads. Use pseudonymous identifiers with a defined access/retention policy. Apply applicable consent requirements during launch review.

| Event | When it means success | Useful dimensions |
|---|---|---|
| `routine_preview_viewed` | Useful plan content actually rendered | Public/private entry type, locale, coarse device category |
| `invite_opened` | Invitation page rendered | Invitation ID, entry channel; no raw token |
| `invite_accepted` | Server transaction committed | Cohort/workspace, new or existing account |
| `session_started` | Stable session identity and prescription available | Sample/assigned, delivery surface, online/offline |
| `set_saved_local` | Durable local write acknowledged | Session/operation ID, latency; no measurement values required |
| `session_completed_local` | User finished and local state is durable | Session ID, guest/account context |
| `session_synced` | Server acknowledged the final session state | Lag, retries, conflict category |
| `coach_reviewed` | Coach explicitly reviewed/replied/adjusted | Result type; no private message content |
| `paid_continuation` | Actual payment received | Cohort, offer/version, net cash; separate signed commitments |

Deduplicate events by stable event/operation IDs. Queue retries must not inflate activation. A public guest sample and a private assigned session have different denominators; never combine them into a single flattering conversion figure.

| Metric | Definition and observation window |
|---|---|
| Preview activation | Distinct eligible people reaching useful rendered content / distinct eligible entry visitors, reported separately by route and cohort |
| Client activation | Distinct accepted clients completing and syncing a first assigned session within 7 days / distinct accepted clients eligible to train during that window |
| Invitation funnel | Delivered → opened → authenticated → accepted → first session; report raw counts and delivery failures separately |
| Repeat usefulness | Clients completing a second session on a distinct day within 14 days / enrolled clients with two scheduled opportunities and complete observation time; also report all-enrolled results and exclusions |
| Coach activation | Coach supplies/assigns a plan and receives a first real client result within 7 days / coaches entering that test |
| Week-four coach retention | Activated coaches reviewing actual client results in week four / activated coaches with a full four-week observation window |
| Assistance | Founder setup, prompts and support minutes per coach/client; distinguish normal coach reminders from founder chasing |
| Reliability | Lost entries, unresolved syncs, duplicate completions, authorization failures and support incidents, with denominator and severity |
| Maintainability | Time and files/systems touched for a small reminder/copy/plan-field change; review/release effort and resulting defects |

At small sample sizes, show counts first and percentages second. Segment recruitment sources, language and surface only where counts remain interpretable. Avoid formal uplift claims or A/B-test conclusions from five-person usability sessions.

## 6. Proposed launch quality gates

| Area | Required check on the implemented core |
|---|---|
| Access | Anonymous, client A/client B, coach A/coach B and staff allow/deny cases across rows, files and privileged commands; session expiry and revoked membership |
| Invitations | New/existing account, duplicate request, wrong email, expiry/revocation, failed delivery and retried acceptance |
| Workout correctness | Previous prescribed/actual values, units, double start/finish, zero/invalid values, plan revised after start, rest/skipped/completed distinction |
| Durability | Offline entry, forced close/reopen, failed local write, network reconnect, duplicate operation, account switch and cross-device conflict |
| Scheduling | Client timezone, local-day boundary, overdue jobs after outage, concurrent job runs, notification preferences and deduplication |
| New data/content | Clean schema reset, synthetic fixtures, valid selected exercise/media seed; no old-account/history/credit migration |
| UI/UX | All core tasks with realistic data at phone/desktop sizes; no blocking navigation issue, false success or data loss; task tests meet proposed targets |
| Accessibility/localization | Keyboard and visible focus, readable contrast, screen-reader labels, zoom/reflow, Arabic direction/text and units; no raw translation keys |
| Operations | One support owner, reproducible deploy, actionable failure alerts, backup restore, provider limits and documented rollback |

No critical data-loss/privacy/access defect is acceptable in the pilot. Performance budgets should be set on an agreed ordinary target phone and connection, with measured first-use timing; a desktop build's gzip size is only a diagnostic.

## 7. Unanswered questions with a way to resolve them

| Unknown | Why it matters | Resolution |
|---|---|---|
| Old Cloudflare/external resources | May incur cost or continue generating unused work | Inspect only to prepare eventual resource shutdown; not a new-core prerequisite |
| New authenticated web integration and device behavior | Audit replays do not prove a product that has not yet been implemented | Codex tests the new local schema/app with synthetic accounts; mobile toolchain and native work wait until the rest is ready |
| Legacy-account classification | Removed from revival scope by the founder | No import, mapping or backfill; old project remains separate from the new runtime |
| External participants, spending and commercial commitments | Affects real-use/payment observations and paid services | Codex prepares concrete materials/configuration; request only the specific external input when needed; do not assume a staffed team |
| Reachable geography/language segment | Determines distribution, copy and service needs | Start with actual former prospects and explicit cohort definition; UAE/MENA is a research context, not an assumed exclusive market |
| Why each user stopped | Determines whether UX fixes or offer changes resolve activation | Reconstruct actual task/artifact with former users; inspect historical analytics if available |
| Revenue, pricing response and acquisition cost | Determines whether this is a software or labor-heavy service business | Specific paid offer, cash receipts, onboarding/support time and channel cost |
| Exercise/media/content rights and accuracy | Determines reusable content and launch quality | Owner/license review and qualified content review before publication |
| Institutional/minor/health-data obligations | Depends on actual service, jurisdiction and population | Separate applicable review if that segment is selected; do not build a school product by assumption |

These are implementation/commercial verification steps, not reasons to leave the analysis vague. Documents 00–07 state recommended defaults; document 07 assigns implementation and verification to Codex.

## 8. Research sources and claim discipline

The market document links current first-party product, help and pricing pages next to the claims they support. Provider marketing is useful for establishing competitive offers, but is biased evidence of quality or outcomes. Prices may change after this audit.

Architecture references include [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security), optional [Cron documentation](https://supabase.com/docs/guides/cron) and [migration guidance](https://supabase.com/docs/guides/deployment/database-migrations). Rafik's actual configuration is separately established by the captured CLI/dashboard evidence. The new core does not inherit the worker; scheduling is added only for a concrete retained need. PostgreSQL trigger semantics are linked next to the relevant findings in document 06. Accessibility requirements use the [WCAG 2.2 standard](https://www.w3.org/TR/WCAG22/); the report is not a conformance certification.

The [NN/g login-wall research](https://www.nngroup.com/articles/login-walls/) supports the rationale for preview-before-registration. It does not supply a conversion estimate for Rafik. Market-event participation and subscription-platform aggregate results are qualified in document 00 and are not used as a revenue forecast or addressable-customer count.

## 9. Reusable backend evidence

The [live audit](/Users/sami/Developer/GitHub/rafik-api/docs/revival/06-live-backend-audit.md) links the catalog, structure, behavior, operations, aggregates, consistency checks, deployment comparison and eight synthetic test results. The [public schema snapshot](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/public-schema.snapshot.sql) is a historical architecture reference, not a new-system baseline or migration to execute. The [function index](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/function-index.json) maps each recovered definition to its trigger bindings. Those files are evidence, not a requirement to preserve the old schema in the replacement.

The saved deployed sources omit service-account private material and redact embedded credentials. No environment-variable values, Vault values, customer messages, health notes, email addresses or file contents were exported into the evidence package. Aggregate snapshots can differ from planner row estimates and were captured at slightly different times; neither is a historical funnel.

## 10. Branch and mutation record

Created `codex/revamp` in all four supplied repositories from their existing checkout revisions. The frontend branch starts from `reset-password`; the other three start from `main`. No commits or pushes were made. No application source was edited. The Supabase CLI's incidental `supabase/.temp/cli-latest` change was restored; the worker's pre-existing `.DS_Store` change was preserved. No hosted Supabase project was created. Current work products are this analysis package, scripts and sanitized evidence.
