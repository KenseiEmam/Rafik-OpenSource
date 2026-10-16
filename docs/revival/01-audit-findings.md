# Evidence-backed findings

**Live-backend reconciliation:** the [Supabase audit](/Users/sami/Developer/GitHub/rafik-api/docs/revival/06-live-backend-audit.md) adds 14 findings and eight local database reproductions. The original IDs below are retained; earlier database unknowns and the expiry suspicion have been corrected in place. RLS is a known setup choice, not the central diagnosis. **Scope update:** the founder now directs a clean rebuild with no old-user migration, local work on `codex/revamp` and mobile last. Corrective actions below identify the principle for retained capabilities, not an obligation to patch every legacy path. Document 07 overrides earlier compatibility-oriented advice.

**Priorities:** P0 = contain before any new production exposure; P1 = required for the revived core; P2 = planned improvement or conditional scope. **Evidence:** observed = local browser or executed check; confirmed = source demonstrates the behavior; risk = plausible impact needing runtime/data verification; hypothesis = requires customer research. Priority reflects consequence, not implementation order alone.

## Product, acquisition, and UX

### F01 · P1 · Multiple products compete for the same first experience

**Confirmed scope; product hypothesis.** Public routes address organizations, coaches, and athletes. Mobile has program discovery, food logging, chats, a calendar, and coaching; web adds entitlements, groups, assessment templates, program auditing, and support tickets. The landing page specifically describes student-athletes and MENA, while other flows look like a trainer marketplace. This breadth obscures the initial buyer and makes every change contend with multiple role variants.

**Action:** choose one pilot segment and one recurring job: deliver and review a training plan. Track every remaining feature as core, conditional, or deferred. Customer interviews must establish whether scope fragmentation actually contributed to abandonment.

**Evidence:** [web/src/router/index.ts:53](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/router/index.ts:53), [web/src/components/Navigation/DashboardSideBar.vue:20](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/Navigation/DashboardSideBar.vue:20), [mobile/lib/main.dart:174](/Users/sami/Developer/GitHub/rafik-mobile/lib/main.dart:174), [web/src/components/WhyweDo.vue:1](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/WhyweDo.vue:1).

### F02 · P1 · Entry copy does not explain who is joining

**Observed.** Registration says “REGISTER NOW TO BECOME AN AFFILIATE.” Login offers an admin-invitation link and a “Not a part of our team?” demo link. These messages do not explain whether the user is a coach, an invited client, or organization staff. A generic demo funnel adds friction for a coach who just wants to try the product.

**Action:** have one explicit coach start path and an invitation-aware client path. Carry invitation context through sign-in and show the coach/team name. Keep demos as an optional sales channel for organizations.

**Evidence:** locally rendered `/register` and `/login`; [web/src/views/LoginVue.vue:19](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/views/LoginVue.vue:19), [web/src/i18n/en.json:1](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/i18n/en.json:1).

### F03 · P1 · Phone-sized web users hit a blank dashboard route

**Observed and confirmed.** At 390 × 844, opening `/dashboard` redirects to `/application?redirect=/dashboard`, which renders no page. The router's actual download page is `/download-app`. The width-based gate applies before checking authentication and also blocks coaches using phones.

**Action:** repair the route immediately, then support responsive coach workflows. Offer app installation contextually; do not make an undefined destination the entry experience.

**Evidence:** [web/src/router/index.ts:44](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/router/index.ts:44), [web/src/router/index.ts:344](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/router/index.ts:344); local browser reproduction in the evidence report.

### F04 · P1 · Privacy navigation is broken and unknown routes have no recovery

**Observed.** The footer links to `/privacy-policy`; the registered route is `/privacy_policy`. Clicking it produces a blank page. No catch-all recovery route is declared.

**Action:** select a canonical route, redirect the alternate, add a useful 404, and smoke-test all public navigation. Broken privacy access affects credibility at the exact point users are evaluating trust.

**Evidence:** [web/src/components/Navigation/Footer.vue:20](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/Navigation/Footer.vue:20), [web/src/router/index.ts:85](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/router/index.ts:85), [web/src/router/index.ts:338](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/router/index.ts:338).

### F05 · P1 · Entitlements expose internal accounting as a coaching task

**Confirmed; usability impact is a hypothesis.** Coaches buy or obtain units, assign a unit to an email and program, put it into `review`, wait for acceptance, and depend on expiry/reuse logic. The TypeScript type says `active | inactive` while actual code uses `available` and `review`. Copy promises 30 starter units while trainer setup creates 20.

**Action:** present “Invite client” and “Assign plan.” Separate a workspace's subscription/client limit from a client's training assignment. Do not import the old credit system into the clean rebuild.

**Evidence:** [web/src/stores/entitlementstores.ts:34](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/stores/entitlementstores.ts:34), [web/src/stores/entitlementstores.ts:146](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/stores/entitlementstores.ts:146), [web/src/components/Forms/TrainerForm.vue:270](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/Forms/TrainerForm.vue:270), [web/src/i18n/en.json:1266](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/i18n/en.json:1266).

### F06 · P1 · Purchase UI invites effort without a functioning purchase

**Confirmed.** The purchase page exposes billing details, card number, expiry, and CVV inputs, then says the feature is unavailable and disables purchase. The inspected component keeps those values in local refs; it does not demonstrate payment transmission. Separately, the marketing component has organization-style monthly tiers.

**Action:** remove dead-end card inputs from the released flow. Test one understandable subscription model, use manual pilot invoicing or a hosted checkout when ready, and align published pricing with actual entitlements and support.

**Evidence:** [web/src/views/DashboardVues/Entitlements/PurchaseVue.vue:200](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/views/DashboardVues/Entitlements/PurchaseVue.vue:200), [web/src/components/SubscriptionTiers.vue:1](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/SubscriptionTiers.vue:1).

### F07 · P1 · Coach dashboard presents hardcoded performance data

**Confirmed.** The dashboard template contains literal assessment and program-adjustment counts of 12, an athlete improvement of +20%, a 4.5 rating, and “Jill Rafik.” A stock pie-chart image occupies an analytics position. These are not connected metrics in the reviewed template.

**Action:** replace them with real operational questions: who missed a session, who submitted a check-in, who needs a reply? Show a truthful getting-started state if there is no data. Sample data belongs in a clearly labeled demo workspace.

**Evidence:** [web/src/components/DashboardTabs/CoachDashboard.vue:5](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/DashboardTabs/CoachDashboard.vue:5).

### F08 · P1 · Visual hierarchy and component ownership are inconsistent

**Observed on public pages; confirmed in styles.** Global CSS forces a condensed display face onto every heading and anchor, colors every SVG yellow, and combines yellow, orange, purple, and green accents. A fixed 100vh app scroll region and large decorative illustrations compete with form navigation. At phone width, login artwork visually intrudes behind the lower links. Several UI/select/cropper libraries coexist.

Older website-bundled product images also show competing AI/program/nutrition emphasis on mobile home, large media and repetitive cards above/around set entry, and dashboard concepts with generic placeholder analytics. Their version is unknown; they are historical visual evidence, not an authenticated runtime finding. The screen brief in document 02 links and analyzes each asset.

**Action:** retain recognizable Rafik green/gold if desired, but establish semantic tokens, a readable interface face, normal-flow responsive layouts, and a small component vocabulary. Product readability takes precedence over ornamental animation.

**Evidence:** [web/src/assets/main.css:1](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/assets/main.css:1), [web/src/views/LoginVue.vue:32](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/views/LoginVue.vue:32), [web/package.json:15](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/package.json:15); local desktop and phone screenshots inspected.

### F09 · P1 · Primary button color pairing has insufficient contrast

**Calculated from source.** White on the declared `#d7bd21` accent is approximately **1.88:1**, before opacity/compositing. The button utilities use white text on the accent. This does not establish whole-page conformance; it identifies a concrete failing base pair. Inputs also use `outline-none`, so every component needs a visible focus treatment.

**Action:** use a dark foreground on gold or a darker filled background; verify actual rendered normal, hover, disabled, and focus states. Target WCAG 2.2 AA, including contrast and keyboard focus. [W3C standard](https://www.w3.org/TR/WCAG22/).

**Evidence:** [web/src/assets/main.css:174](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/assets/main.css:174), [web/tailwind.config.js:1](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/tailwind.config.js:1); `tools/reproduce_findings.mjs`.

### F10 · P1 · Arabic support is structurally incomplete

**Measured.** English has 1,323 leaf key paths; Arabic has 885. There are 500 English paths without exact Arabic matches and 62 Arabic paths without English matches. These totals reflect key placement as well as missing text. English fallback is configured, and some login/dashboard strings bypass translation entirely.

**Action:** define one semantic key structure, align both locales, and make key parity a build check. Review Arabic copy with a native reader; test directionality, mixed-language exercise names, numerals, and long labels. Do not advertise complete Arabic support based on the existence of an Arabic JSON file.

**Evidence:** [web/src/main.ts:31](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/main.ts:31), [web/src/views/LoginVue.vue:21](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/views/LoginVue.vue:21), [web/src/components/DashboardTabs/CoachDashboard.vue:6](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/DashboardTabs/CoachDashboard.vue:6); `evidence/inventory.json`.

### F11 · P1 · Onboarding requests secondary information before coaching value

**Confirmed path, unmeasured abandonment.** Mobile has profile completion, experience, diet preference, and fitness-goal screens chained together. Push permission is requested from onboarding, registration, and home code paths. Trainer setup requires title, summary, experience, and preferred client types before completion.

**Action:** first establish identity, invitation, and the minimum information needed for the assigned plan. Defer marketing profile/certificates and optional nutrition setup. Ask for notifications after explaining a useful reminder. Preserve any genuinely necessary readiness questions for the chosen service.

**Evidence:** [mobile/lib/pages/authentication_profiles/experience/experience_widget.dart:599](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/authentication_profiles/experience/experience_widget.dart:599), [mobile/lib/pages/authentication_profiles/diet_preference/diet_preference_widget.dart:322](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/authentication_profiles/diet_preference/diet_preference_widget.dart:322), [mobile/lib/pages/home/home_widget.dart:300](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/home/home_widget.dart:300), [web/src/components/Forms/TrainerForm.vue:205](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/Forms/TrainerForm.vue:205).

## Trust and data boundaries

### F12 · P0 · Privileged credentials are tracked in source control

**Confirmed presence; validity/external exposure unknown.** Tracked API `.env` files contain nonempty service-role and provider credential variables; the tracked service-account JSON contains a private key. The SMTP function also has a literal provider bearer credential. Deployed SMTP/push bundles also contain the corresponding literal credential/service-account material. Values are intentionally omitted from this package; no credential-validity or misuse test was performed. The frontend's publishable/anon key is a different category and is not inherently a secret.

**Action:** establish deployment consumers, rotate/revoke the privileged credentials through their owners, move replacements to deployment secrets, verify recovery, then remove sensitive tracked material and coordinate history cleanup. Add secret scanning. Deleting the files alone cannot revoke a key already copied.

**Evidence:** tracked paths `supabase/.env`, `supabase/functions/.env`, `supabase/functions/service-account.json`; literal credential locations `supabase/functions/smtp/index.ts:95,175,272,332`. Do not copy values into tickets or logs.

### F13 · P0 · Privileged functions lack explicit caller/object authorization

**Confirmed handler defect; deployed exploitability untested.** `delete-user` only checks whether `user_id` is present, then calls `auth.admin.deleteUser(user_id)`. API AI handlers similarly accept object IDs used by service-role helpers; inspected push handlers parse webhook payloads without a handler-level signature check. A platform JWT gate, if enabled, does not by itself prove ownership of the requested object.

**Action:** bind self-service deletion to the verified caller; put staff deletion behind explicit authorization and audit. Check ownership for chat/program/document operations, authenticate internal webhooks, and enforce bounded inputs and cost limits. The live gateway has JWT verification enabled for `delete-user`/`api` and disabled for `smtp`/`push`/`org-push`; this was inspected without invoking them. Ownership checks remain necessary.

**Evidence:** [api/supabase/functions/delete-user/index.ts:4](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/delete-user/index.ts:4), [api/supabase/functions/api/index.ts:137](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/api/index.ts:137), [api/supabase/functions/_shared/chatbot.ts:12](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/_shared/chatbot.ts:12), [api/supabase/functions/push/index.ts:24](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/push/index.ts:24), [api/supabase/functions/org-push/index.ts:28](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/org-push/index.ts:28).

### F14 · P1 · Null identity can silently remove a mobile query filter

**Confirmed and locally reproduced.** `eqOrNull` returns the unchanged query when its value is null. It is used in mutation paths with nullable IDs. A missing ID therefore means “omit this restriction,” rather than “match nothing.” Live access definitions have now been captured and are broadly permissive (the known initial setup choice). The underlying helper defect still needs fail-closed identity handling; no live mutation was attempted.

**Action:** require non-null typed IDs for mutations, reject missing identities before building a query, and add server authorization plus cross-user tests. Reserve optional-filter helpers for intentional search filters.

**Evidence:** [mobile/lib/backend/supabase/database/table.dart:65](/Users/sami/Developer/GitHub/rafik-mobile/lib/backend/supabase/database/table.dart:65), [mobile/lib/pages/my_program/workout_log/exercise_view/exercise_view_widget.dart:536](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/my_program/workout_log/exercise_view/exercise_view_widget.dart:536); local reproduction script.

### F15 · P1 · The database cannot be reconstructed from tracked source

**Confirmed repository gap.** No tracked SQL files, migrations, RLS definitions, RPC definitions, or seed files were found. Clients depend on RPCs such as `search_exercises` and `get_latest_messages2`; AI depends on `match_documents` and food similarity functions. A configuration file under `supabase/functions/` references a missing seed file. The live audit subsequently recovered 35 custom function definitions, 27 public triggers and a public-schema snapshot. Migration history is empty. These audit references close the knowledge gap, but a clean managed Supabase rebuild is still unproven.

**Action:** convert the recovered schema, metadata and function evidence into a reviewed baseline. Keep those exports as reference; build the new schema independently with synthetic seed data and stubbed delivery. Restoring the old database is no longer required. See E01 and B14.

**Evidence:** [api/supabase/functions/config.toml:42](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/config.toml:42), [web/src/stores/chatsstores.ts:1](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/stores/chatsstores.ts:1), [api/supabase/functions/_shared/chatbot.ts:44](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/_shared/chatbot.ts:44); tracked-file inventory.

### F16 · P1 · Client session and role state have multiple sources of truth

**Confirmed.** Web guards inspect `LoggedInUser`, `UserID`, `LoggedInTrainer`, and stringified `Roles` in localStorage. The user store separately records an access token and queries identity by email. Its `LogOut` function clears local values without invoking Supabase sign-out in that function. These checks are UI gating, not an authorization boundary.

**Action:** use Supabase session lifecycle and a single session/profile adapter; derive presentation permissions from verified membership. Enforce all real permissions in the database or command layer. Test expired sessions, refresh, role changes, logout, and invitation deep links.

**Evidence:** [web/src/router/index.ts:344](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/router/index.ts:344), [web/src/stores/user.ts:173](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/stores/user.ts:173), [web/src/stores/user.ts:196](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/stores/user.ts:196), [web/src/stores/user.ts:215](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/stores/user.ts:215).

## Reliability and business rules

### F17 · P1 · A failed program save can still announce success

**Confirmed and locally reproduced as control flow.** `updateProgram` catches database failures and shows an error without rethrowing or returning failure. The planner then attaches a fulfilled-promise callback that shows success. Editing mode also closes before persistence resolves.

**Action:** return a typed success/failure result, keep drafts on error, and let the UI own its save state. “Saved” must mean an acknowledged write; test error, retry, and navigation during save.

**Evidence:** [web/src/stores/programstores.ts:343](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/stores/programstores.ts:343), [web/src/components/ProgramTabs/WorkoutPlanner.vue:950](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/ProgramTabs/WorkoutPlanner.vue:950).

### F18 · P1 · Screen loads perform domain work

**Confirmed in source and live definitions.** Mobile home fetches users/profiles, creates missing profiles, reads the plan and iteration, creates workout sheets if absent, creates a nutrition sheet if needed, and handles notification setup. Opening a screen changes domain state. The live guard returns `NEW` on a duplicate and no appropriate uniqueness constraint exists; local database replay confirmed another insertion is accepted (B03).

**Action:** give screens read-oriented view models. Make session creation an explicit, idempotent server operation with a unique logical identity. Remove critical progression from page lifecycle callbacks.

**Evidence:** [mobile/lib/pages/home/home_widget.dart:48](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/home/home_widget.dart:48), [mobile/lib/pages/home/home_widget.dart:121](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/home/home_widget.dart:121), [mobile/lib/pages/home/home_widget.dart:247](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/home/home_widget.dart:247).

### F19 · P1 · Assignment and completion span independent client writes

**Confirmed; partial-state consequences are risks.** Accepting an invitation inserts a user program, updates a profile, and updates an entitlement in separate requests. Workout completion marks a sheet done and later increments the profile iteration. Live assignment triggers do atomically perform some substeps, including copying content and setting expiry, but do not make the separate client requests one transaction. They additionally cause the broad update side effects documented in B01–B04. Partial failure across requests remains a risk.

**Action:** move each business operation into one transaction, authorize inside it, and give retries a stable operation key. Test concurrent acceptance/completion and failures at each boundary.

**Evidence:** [mobile/lib/pages/settings/program_invites/program_invites_widget.dart:371](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/settings/program_invites/program_invites_widget.dart:371), [mobile/lib/pages/my_program/workout_log/exercise_view/exercise_view_widget.dart:517](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/my_program/workout_log/exercise_view/exercise_view_widget.dart:517).

### F20 · P1 · Rest-day processing can lose progression after partial failure

**Confirmed sequence; production incidence unknown.** The worker marks a rest-day sheet `done` before reading and incrementing the profile iteration. A later failure leaves the sheet excluded from the next `done = false` run. Two concurrent runs can also read the same iteration. Errors are logged and processing is grouped in broad catches.

**Action:** use a transaction and a conditional state transition; avoid read-modify-write counters from separate network calls. Record job results and alert on failed or stale work.

**Evidence:** [worker/worker.js:105](/Users/sami/Developer/GitHub/rafik-worker/worker.js:105), [worker/worker.js:120](/Users/sami/Developer/GitHub/rafik-worker/worker.js:120), [worker/worker.js:151](/Users/sami/Developer/GitHub/rafik-worker/worker.js:151).

### F21 · P1 · Reminder suppression checks the wrong time window

**Confirmed and locally reproduced.** Both reminder queries look for messages *older* than a day and only send when none exist. An old reminder can suppress later reminders indefinitely while a recent reminder does not suppress another run. Nutrition messages use the latest available sheet without checking its day; the no-sheet branch claims the protein goal was reached.

**Action:** schedule by user-local day and actual missing action, deduplicate by recipient/type/date, respect notification preferences and quiet hours, and never infer completion from missing data.

**Evidence:** [worker/worker.js:530](/Users/sami/Developer/GitHub/rafik-worker/worker.js:530), [worker/worker.js:552](/Users/sami/Developer/GitHub/rafik-worker/worker.js:552), [worker/worker.js:615](/Users/sami/Developer/GitHub/rafik-worker/worker.js:615), [worker/worker.js:639](/Users/sami/Developer/GitHub/rafik-worker/worker.js:639).

### F22 · P1 · Follow-up lookups and inserts use different identity domains

**Confirmed against live foreign keys.** Follow-up lookup compares `forms.client_id` (a user ID) with `user_programs.client_id` (a profile ID), while insertion uses `clientProfile.user_id`. The live snapshot contains 2,182 pending follow-up forms over six client/program combinations. This supports the failure diagnosis; attribution to the exact deployed writer remains unverified without worker logs (B05).

**Action:** distinguish user IDs, client memberships, and assignments in schema and types. Deduplicate a check-in by assignment and period instead of reconstructing identity through several tables.

**Evidence:** [worker/worker.js:219](/Users/sami/Developer/GitHub/rafik-worker/worker.js:219), [worker/worker.js:393](/Users/sami/Developer/GitHub/rafik-worker/worker.js:393), [worker/worker.js:467](/Users/sami/Developer/GitHub/rafik-worker/worker.js:467).

### F23 · P1 · Automatic renewal relies on fragile timing and ambiguous data

**Corrected after live inspection.** Renewal only selects expiries between now and the next 24 hours, so a missed daily run has no catch-up path for already expired rows. Its singular `user` relation is absent in the live schema and entitlement consumption spans multiple requests. However, the live `updateExpiry` trigger correctly recalculates `expires_on` from `latest_start`; local replay verified this. Missing explicit expiry code in the worker is therefore not itself a bug. Fourteen of 18 active assignments had past expiries at capture; the exact deployed failure path remains unverified (B06).

**Action:** separate subscription access from training assignment, process all due records with idempotent transitions, and define expiry behavior. In the clean rebuild, omit legacy credits and renewal semantics unless a new commercial requirement calls for them.

**Evidence:** [worker/worker.js:181](/Users/sami/Developer/GitHub/rafik-worker/worker.js:181), [worker/worker.js:235](/Users/sami/Developer/GitHub/rafik-worker/worker.js:235), [worker/worker.js:252](/Users/sami/Developer/GitHub/rafik-worker/worker.js:252), [worker/worker.js:293](/Users/sami/Developer/GitHub/rafik-worker/worker.js:293), [worker/wrangler.toml:6](/Users/sami/Developer/GitHub/rafik-worker/wrangler.toml:6).

### F24 · P1 if retained · Food cache normalization destroys meaning

**Confirmed and locally reproduced.** Removing everything except JavaScript `\w` and whitespace strips decimal points and Arabic letters. “1.5 cups” and “15 cups” produce the same normalized quantity; different Arabic-only food names normalize to an empty string. The recovered RPCs use trigram similarity with 0.9/0.7 thresholds; this cannot restore information already removed from the input. The unrelated English full-text index does not establish acceleration for that query (B10).

**Action:** defer AI estimation in the first release. If restored, preserve Unicode and parse amount/unit separately; cache on canonical food, quantity, unit, locale, and schema/model version. Verify exact equivalence before reuse.

**Evidence:** [api/supabase/functions/_shared/foodAI.ts:50](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/_shared/foodAI.ts:50); local reproduction script.

### F25 · P1 if retained · Nutritional provenance is asserted by a model

**Confirmed implementation limitation.** The food response schema asks the model to return a USDA boolean, but this helper does not retrieve a USDA record or carry a source ID. A model-generated label cannot establish provenance. Catching failures returns a string answer, which the outer API can wrap as successful output.

**Action:** distinguish catalog data, user entries, and estimates. Require actual source identifiers for verified catalog claims, show estimates as estimates, and use a stable error schema. This finding concerns data provenance, not nutritional or medical advice.

**Evidence:** [api/supabase/functions/_shared/foodAI.ts:40](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/_shared/foodAI.ts:40), [api/supabase/functions/_shared/foodAI.ts:135](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/_shared/foodAI.ts:135), [api/supabase/functions/_shared/foodAI.ts:182](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/_shared/foodAI.ts:182), [api/supabase/functions/api/index.ts:170](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/api/index.ts:170).

### F26 · P2 / P1 if retained · AI adds an incompletely owned deployment chain

**Confirmed.** Embedding forwards to a hardcoded DigitalOcean function whose implementation is absent from these repositories. Chat reads messages newest first and passes older history onward without reversing it. Deno checking found invalid `Deno.env.OPENAI_API_KEY` access alongside other type errors. A live Supabase `embed` function was also recovered despite being absent locally, and alternate search RPCs have stale-table/ordering defects (B10). These are additional operational and correctness obligations before AI creates validated customer value.

**Action:** hide AI from the pilot; preserve documents and disable unused production jobs only after dependency review. Reintroduce a narrow, measured assistive feature when it reduces a proven task cost and has ownership, isolation, failure handling, and an evaluation set.

**Evidence:** [api/supabase/functions/api/index.ts:93](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/api/index.ts:93), [api/supabase/functions/_shared/chatbot.ts:137](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/_shared/chatbot.ts:137), [api/supabase/functions/_shared/chatbot.ts:171](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/_shared/chatbot.ts:171), [api/supabase/functions/_shared/foodAI.ts:116](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/_shared/foodAI.ts:116); Deno check log.

### F27 · P1 · File privacy is not expressed consistently

**Confirmed URL construction and live bucket configuration.** Trainer certifications construct public storage URLs; uploaded AI documents also request a public URL. The live `storage` bucket is public, contains 237 objects and has broad policies. Object contents were not fetched or individually classified. Separate file classes/lifecycles rather than assuming all existing content is suitable for publication.

**Action:** classify files by purpose; separate public presentation assets from private documents, use authorized access/signed URLs, and include files in export/deletion rules. Verify file type, size, and ownership server-side.

**Evidence:** [web/src/components/Forms/TrainerForm.vue:215](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/Forms/TrainerForm.vue:215), [web/src/components/ProgramTabs/DocumentsForms.vue:42](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/ProgramTabs/DocumentsForms.vue:42), [web/src/components/ProgramTabs/DocumentsForms.vue:102](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/components/ProgramTabs/DocumentsForms.vue:102).

## Maintainability and delivery

### F28 · P1 · Data shapes blur templates, assigned plans, and completed activity

**Confirmed.** Program workouts are copied into user programs and workout sheets. Profiles hold an active user-program pointer and mutable iteration. Nutrition macros use positional arrays. Flexible JSON is not itself wrong, but ownership, versioning, units, and historical immutability are not explicit in the reviewed workflows.

**Action:** distinguish a reusable plan, an immutable assigned revision, and a performed session. Use named quantities with units. Keep versioned workout prescriptions as validated JSON initially if it avoids needless table proliferation; normalize logged sets that need reliable edits and aggregation.

**Evidence:** [web/src/stores/programstores.ts:358](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/stores/programstores.ts:358), [mobile/lib/pages/settings/program_invites/program_invites_widget.dart:387](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/settings/program_invites/program_invites_widget.dart:387), [mobile/lib/pages/home/home_widget.dart:159](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/home/home_widget.dart:159), [mobile/lib/flutter_flow/custom_functions.dart:126](/Users/sami/Developer/GitHub/rafik-mobile/lib/flutter_flow/custom_functions.dart:126).

### F29 · P2 · Integration and UI dependencies overlap

**Confirmed.** Nutrition OAuth implementation appears in both a standalone function and shared helper. Package manifests contain several select, cropper, and UI systems. There are Vue, Deno, Cloudflare, Flutter, Firebase, SMTP, nutrition-provider, AI, and externally hosted embedding concerns. Some are justified—for example native push delivery—while others lack a first-release need.

**Action:** map actual imports and deployed consumers before removal. Retain one implementation per integration and one component per job. For the clean rebuild, introduce only integrations required by the new core; inspect old consumers later for resource retirement.

**Evidence:** [api/supabase/functions/fat-secret/index.ts:1](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/fat-secret/index.ts:1), [api/supabase/functions/_shared/fatSecret.ts:1](/Users/sami/Developer/GitHub/rafik-api/supabase/functions/_shared/fatSecret.ts:1), [web/package.json:15](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/package.json:15), [mobile/pubspec.yaml:29](/Users/sami/Developer/GitHub/rafik-mobile/pubspec.yaml:29).

### F30 · P1 · Release checks do not protect the coaching journey

**Observed and confirmed.** Vue type checking and a Vite production build pass with the selected environment; Vitest reports no tests. No tracked CI workflows were found in the four repositories. The mobile test only pumps `MyApp` without assertions. The API entrypoint fails Deno checking with ten errors. The worker's test command is a placeholder.

**Action:** add a small, high-value safety net: isolation, invitation acceptance, assign-plan, interrupted/retried logging, completion, and new-schema reset/release recovery. Pin runtime versions and establish a clean install/build path. Do not spend the first sprint chasing an arbitrary coverage percentage.

**Evidence:** [mobile/test/widget_test.dart:12](/Users/sami/Developer/GitHub/rafik-mobile/test/widget_test.dart:12), [worker/package.json:8](/Users/sami/Developer/GitHub/rafik-worker/package.json:8), [web/package.json:7](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/package.json:7); command outcomes in the evidence report.

### F31 · P2 · Web bootstrap ships a large shared bundle

**Measured.** The inspected build outputs a main JS chunk of 1,277.82 kB, 400.35 kB gzip, and a 316.41 kB calendar chunk. Some routes already lazy-load. Global imports include both translation dictionaries, datepicker, phone input, and alert styles. These numbers do not establish real-user load time or identify the whole cause.

**Action:** measure first useful content on target devices, inspect the bundle, lazy-load feature-specific UI, remove unused dependencies, and keep calendar/advanced builders off the public entry path.

**Evidence:** [web/src/main.ts:1](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/main.ts:1), [web/src/router/index.ts:18](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/router/index.ts:18); Vite build log.

### F32 · P1 · Large files combine unrelated reasons to change

**Measured and confirmed.** Web `user.ts` is 1,268 lines; the workout planner is 1,186. Flutter home is 3,127 lines and food log 3,047. Database calls occur in 53 web files and 39 mobile files by a simple source heuristic including storage access. This increases the number of places a rule change needs investigation.

**Action:** refactor touched features into UI, application operations, and data adapters. Keep session, clients, plans, and organization administration separate. File length is a diagnostic, not a rule requiring artificial splitting.

**Evidence:** `evidence/inventory.json`; [web/src/stores/user.ts:173](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/stores/user.ts:173), [mobile/lib/pages/home/home_widget.dart:44](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/home/home_widget.dart:44).

### F33 · P1 · Mobile generation and dependency ownership are unclear

**Confirmed repository gap.** Mobile identifies itself as a FlutterFlow project; generated widgets, helpers, custom actions, and handwritten integrations coexist. No maintained regeneration policy or product setup guide was found. `pubspec.lock` is ignored. This creates a risk that source edits are overwritten or the same checkout resolves differently.

**Action, deferred until the web/backend is ready:** decide whether FlutterFlow remains the source of truth for any later native rebuild. If yes, define generated/custom boundaries and a regeneration check; if no, formally take code ownership and stop re-exporting over edited modules. Commit the application lockfile and pin the Flutter toolchain after a successful device build.

**Evidence:** [mobile/README.md:1](/Users/sami/Developer/GitHub/rafik-mobile/README.md:1), [mobile/.gitignore:1](/Users/sami/Developer/GitHub/rafik-mobile/.gitignore:1), [mobile/lib/custom_code/actions/save_cardio_workout.dart:1](/Users/sami/Developer/GitHub/rafik-mobile/lib/custom_code/actions/save_cardio_workout.dart:1).

### F34 · P1 · Workout recovery is not demonstrated

**Source-based risk; no device test performed.** Set inputs and exercise state are managed inside widgets; completion writes remotely. In the reviewed paths, no durable queue with per-operation IDs, retry status, and conflict handling was found. The presence of Hive/sqflite dependencies does not establish offline support.

**Action:** implement local durability only for the critical workout path first. Test airplane mode, app termination, session expiry, duplicate completion, and reconnect. Show “Saved on this device” separately from “Synced with coach.”

**Evidence:** [mobile/lib/components/set_logger_widget.dart:13](/Users/sami/Developer/GitHub/rafik-mobile/lib/components/set_logger_widget.dart:13), [mobile/lib/pages/my_program/workout_log/exercise_view/exercise_view_widget.dart:517](/Users/sami/Developer/GitHub/rafik-mobile/lib/pages/my_program/workout_log/exercise_view/exercise_view_widget.dart:517), [mobile/lib/app_state.dart:23](/Users/sami/Developer/GitHub/rafik-mobile/lib/app_state.dart:23).

### F35 · P1 · Commercial and product success are not measurable from this checkout

**Evidence gap with founder context.** No historical activation/retention funnel, customer research records, revenue data, operational runbook, or product-event specification is present in the reviewed repositories. Mobile includes Firebase Performance, which is not evidence of a defined product funnel. The founder reports interest/downloads without meaningful use and organization meetings without customers; this supports an activation/conversion diagnosis. Live aggregate inspection now adds historical activity and a large generated-form backlog, but still does not provide a trustworthy activation funnel or commercial cohorts. The exact abandonment causes and a paying segment remain unverified (document 06, section 6).

**Action:** recover any existing analytics/support records, interview former users, instrument a minimal event set, and run a time-bounded paid pilot with stop/continue criteria. Treat market fit as an experiment, not a consequence of redesign.

**Evidence:** repository documentation inventory; [mobile/pubspec.yaml:49](/Users/sami/Developer/GitHub/rafik-mobile/pubspec.yaml:49). Validation protocol is in document 05.

## What is worth preserving

Preserve domain understanding, selected useful exercise/media content and bilingual intent. Existing components demonstrate some useful loading/empty states, lazy loading and subscription cleanup, but the new design is not obliged to keep their structure. Do not carry over message histories, forms, roles or user records simply because they exist. Select content by relevance and rights, then implement the new product from its own brief.
