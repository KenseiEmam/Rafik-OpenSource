# Live Supabase architecture: recovered behavior and revamp decisions

**Inspected 22 September 2026:** `Rafik-Supabase-Backend`, project `pexviywnztvqomfosvho`, through the authenticated Supabase CLI and Chrome dashboard. This closes the principal gap in the original repository-only audit. The earlier claim that architecture analysis was complete was too broad without this inspection.

This document concentrates on behavior, data consistency, maintenance, recovery and the connection to UX. RLS was deliberately relaxed during the original build, as the founder clarified; its observed state is recorded briefly at the end rather than treated as the main diagnosis.

**Purpose:** preserve the understanding I need to execute the revamp. The companion [agent execution plan](/Users/sami/Developer/GitHub/rafik-api/docs/revival/07-agent-execution-plan.md) names the changes I will make, their dependencies, the files involved and the evidence required to call them done.

**Updated execution decision:** after this audit, the founder confirmed the product is inactive and legacy data is not a concern. The revamp will be a fresh local web/backend build, later hosted in a new Supabase project. No legacy restoration, backfill, compatibility or surgical trigger retirement is required. Findings below describe the old system and design lessons; they do not oblige us to repair every old feature. Work stays on `codex/revamp`, with mobile deferred until everything else is ready.

## 1. What actually exists

| Layer | Verified live state | Architectural implication |
|---|---|---|
| Database | PostgreSQL 15.8; 35 public tables; about 34.4 MB database size at capture | This does not call for a distributed data platform. Correct workflow ownership and data integrity come first |
| Database behavior | 35 non-extension public function definitions; 27 public triggers | A substantial part of the application is hidden in database side effects; the API repository alone is not the backend |
| Migrations | Zero rows in the live migration history; no tracked migration baseline in the original checkout | Capture the old system as evidence; define the new schema independently |
| Edge Functions | Eight active functions: `api`, `fat-secret`, `hello`, `smtp`, `delete-user`, `embed`, `push`, `org-push` | Deployed code and repository code must be reconciled; `embed` was missing locally |
| Storage | One public `storage` bucket; 237 objects totaling about 675.7 MB by object metadata; no bucket-specific MIME/size restrictions | Media, uploaded documents and other file classes need distinct lifecycle/access rules; do not fetch or migrate every object blindly |
| Realtime | Publications for `chat_messages` and `ai_chat_messages` | Realtime is a messaging facility here, not evidence of an offline workout synchronization system |
| Scheduling | No `pg_cron` extension or `cron.job` relation | Supabase Cron is not the existing scheduler. The worker repository declares `radfik-worker` with `0 0 * * *`; its live Cloudflare deployment was not inspected |
| Hosting/recovery | Free project; NANO/t4g.nano in `us-east-1`; dashboard reports no managed backups, no branches and no connected GitHub repository | Give the new system repeatable setup and recovery; old-project restoration is not a prerequisite |
| Authentication | Email enabled, signup enabled, email confirmation disabled, anonymous Auth sign-ins disabled, listed social/phone providers disabled | The current product can register without an email-confirmation round trip; a redesigned private invitation still needs an explicitly verified identity policy |
| Auth email delivery | Dashboard reports built-in email service, not custom SMTP | The deployed function called `smtp` is separate from Supabase Auth email delivery; its existence does not establish reliable password-reset/invitation mail |

Evidence: [catalog](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/catalog.json), [structure](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/structure.json), [behavior](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/behavior.json), [operations](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/operations.json), [dashboard observations](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/dashboard-observations.json).

## 2. The current domain model, including its misleading names

| Domain | Existing tables | What I must preserve or simplify |
|---|---|---|
| Identity | Auth users, `users`, `profiles`, `trainer_profile`, `user_settings`, `roles` | `users.id` is a bigint, not an Auth UUID; no direct Auth-UID field/FK was found. Email is used for matching. Add an explicit mapping rather than treating IDs as interchangeable |
| Coaching/content | `programs`, `user_programs`, `exercises`, `entitlements`, `reviews` | `programs` is a template/content object; `user_programs` is a client assignment with its own mutable workout array. Separate access accounting from assignment and plan history |
| Activity | `workout_sheets`, `nutritional_sheets`, `weights` | Preserve actual records while replacing ambiguous day/iteration identity and mutable embedded set data |
| Conversations/check-ins | `chat_messages`, `forms`, `notifications`, `org_notifications` | Forms and messages point to each other. Generated follow-up work dominates the message count. Do not mistake automated rows for engagement |
| Organizations | `organizations`, `groups`, `slots`, `assessment`, `assessment_template` | Membership/participants often use arrays; domain matching assigns organization on user insertion. Avoid expanding this into the first product release |
| AI/integrations | `chatbots`, `ai_media`, `ai_vectors`, `ai_chat_messages`, `food_cache`, `secret_tokens`, `debug_logs` | Keep separate from core training and retire unused paths deliberately; they currently add several inconsistent representations |
| Reference/support | `countries`, `nationalities`, `certifications`, `support_tickets`, `ticket_messages` | Keep reference content and support history where needed; a custom support product is not a prerequisite |

**Critical ID dictionary:** `user_programs.client_id → profiles.id`; `workout_sheets.client_id → users.id`; `forms.client_id → users.id`; `reviews.user → profiles.id`. The same label “client” therefore means different records. The worker's follow-up lookup uses the assignment's profile ID while new forms store a user ID, confirming the structural basis of F22.

There are also two duplicate foreign-key constraints on `users.profile_id`, and bidirectional cascading links among users/profiles/weights. Deleting a referenced current weight can cascade to its profile and onward through the user/profile relationship. Deleting a program cascades through assignments into workout/message history. These are verified constraint definitions, not deletion experiments. Archiving is the appropriate default for content retirement.

## 3. The actual workflow chains

| User/system action | Additional live behavior | Why a revamp must account for it |
|---|---|---|
| Accept program invitation | Client inserts assignment, then updates profile and entitlement separately. Assignment triggers copy workouts/trainer, calculate sets, set expiry, update profile coach, create induction form/message | Some substeps inside assignment insertion are transactional, but the entire acceptance is still not one transaction |
| Insert a workout sheet | `workout_new_iteration` attempts duplicate detection, sets week/previous record and calculates summary values; another trigger updates streak | Opening a client screen can produce state changes and apparent progress before a completed workout |
| Update a sheet whose `done` is true | Progression trigger rewrites the assignment's workout JSON | The trigger is not limited to the transition from unfinished to finished |
| Update an assignment for any reason | Recompute derived sets, update profile coach, delete unfinished workout sheets, create a plan-updated notification | A status or renewal update can destroy in-progress work and announce an exercise change that did not happen |
| Change exercise results on a completed sheet | Best-performance trigger updates the sheet again, in addition to updating profile bests | The nested sheet update can invoke progression again; no single visible command owns the operation |
| Insert a notification | Database webhook invokes `push` or `org-push` | A supposedly local database edit can initiate external delivery; never replay these triggers against production to test a hypothesis |
| Update profile weight/height/activity | Calorie/macro recalculation; same function also wraps workout iteration | Unrelated nutrition and workout scheduling decisions are coupled in one trigger |

This is the central architecture problem: simple user actions carry broad, implicit side effects. Adding another API wrapper without changing those triggers would retain the same complexity underneath a nicer interface.

## 4. Findings that change the implementation

### B01 · P1 · Assignment updates delete unfinished workouts

`trigger_delete_incomplete_workouts` runs after **every** `user_programs` update and deletes matching sheets where `done=false`. There is no condition requiring a changed plan, no exception for a started session, and no version migration. An unrelated status update was enough to delete synthetic unfinished sheets in the local replay.

**I will:** replace this with explicit plan publication affecting future occurrences only. Started sessions retain their snapshot and entries; canceled future occurrences get a state, not silent deletion. Add a regression test for renewal, status, coach and note changes while a session is open.

### B02 · P1 · Completion is not a single state transition

`trg_apply_progression` fires after any sheet update when `NEW.done IS TRUE`. A completed-session note edit therefore recalculates assignment content and triggers another notification. The local replay confirmed this. `update_best_perf_sql` also performs a nested update on the sheet; that creates another route to the same side effects.

**I will:** make `completeSession` own completion once. Separate correcting actual results from publishing future plan changes. Initially, progression should be a clear coach decision/suggestion rather than an invisible blanket automatic prescription rewrite. Do not claim that each repeated invocation necessarily compounds the weight; the confirmed defect is repeated side effects and uncontrolled rule ownership.

### B03 · P1 · Session identity and week calculation are unreliable

The bound duplicate guard returns `NEW` when it finds an existing unfinished row, so insertion continues. The separate `ensure_workout_sheet` function returns null on duplicates but is **not attached to a trigger**. There is no appropriate unique constraint. The bound function counts all rows with the same iteration when calculating `week_of_program`, without restricting the count to a client or assignment. Local replay admitted duplicates and assigned another client's first workout “week 3.”

**I will:** define a stable scheduled-occurrence ID, use one idempotent start command and enforce its uniqueness. Do not use `(client,date)` alone: legitimate multiple sessions in one day must remain possible. Derive week from the assignment schedule, not a global count.

### B04 · P1 · Plan copying depends on trigger order and duplicated client input

The `trg_user_program_sync_sets_muscle` before-insert trigger runs before `trigger_copy_workouts`, based on trigger name order. Omitting the workout array produces a null-loop error before the later copy can populate it; local replay confirmed this. The current mobile invitation flow supplies the array, so this does not establish that every current invite fails. It shows that the backend's apparent “copy template” responsibility secretly depends on client-supplied duplicate content.

**I will:** build the new assignment command to load and validate one chosen plan revision before calculating summaries. Do not port the order-dependent copying/calculation triggers. PostgreSQL documents both trigger return behavior and ordering. [Trigger functions](https://www.postgresql.org/docs/15/plpgsql-trigger.html), [CREATE TRIGGER](https://www.postgresql.org/docs/15/sql-createtrigger.html).

### B05 · P1 · The follow-up system accumulates work without evidence of completion

At the captured snapshot, all **2,182 forms were pending follow-ups**, spread over six client/program combinations; the largest combination held 438 pending forms. Recent daily counts show repeated creation, usually five per day. Of 2,213 messages, 2,182 were linked to forms. This strongly supports treating row growth as automation, not conversation activity. The exact live writer was not traced through Cloudflare logs, so attribution to the repository worker remains a supported inference rather than a deployed-runtime proof.

**I will:** use one due check-in per relationship/period, an explicit submitted/reviewed lifecycle, and a policy for an unanswered previous period. Do not import the old generated backlog. The new UI starts with meaningful current work; no cleanup-notification exercise is needed.

### B06 · P1 · Renewals work partly in the database, but their semantics are inconsistent

**Correction to F23:** `updateExpiry` does recompute `expires_on` when `latest_start` changes. Local replay verified the expected month advance. The earlier repository-only uncertainty about an absent expiry update is resolved.

Other problems remain: the worker's narrow upcoming-expiry window can miss overdue assignments; its singular `user` lookup targets a relation that does not exist; 14 of 18 rows labeled active already had past expiry timestamps. That discrepancy alone does not prove the exact failure path. The entitlement date trigger also resets start/end dates on every update while status is active, even when status did not transition; local replay confirmed it.

**I will:** define one access/renewal transition with due-and-overdue processing and explicit grace behavior. Keep training progression independent. No old-credit import or reconciliation is required for the clean rebuild.

### B07 · P1 · Identity and historic records require reconciliation

The database has 57 Auth users, 92 application-user records and 87 profiles. An email-based comparison matches 51 application rows to Auth and leaves 41 unmatched. Four user IDs have multiple profiles; one profile has no user. These can include tests, deleted accounts or historical drift; they are not proof that 41 customers are broken. Existing linked profile/user pairs and linked workout/assignment identities passed the aggregate mismatch checks.

**I will:** use one Auth-UUID-linked person identity in the new schema and prevent new duplicates. The founder has removed legacy-account migration from scope, so the old counts do not create a reconciliation project. Leave those records in the old project rather than mapping or merging them.

### B08 · P1 · “Progress” is not consistently tied to completed activity

Workout streaks update on sheet insertion and inspect yesterday's completion; diet streaks update on nutrition-sheet insertion and inspect yesterday's nonzero macros. Multiple inserts can repeatedly affect counters. The database contains 49 client/assignment/date groups with multiple workout rows (68 rows beyond one per group), and 12 duplicated nutrition profile/date groups (14 extra rows). Multiple workouts on a date are not automatically invalid; the model lacks an occurrence identity to distinguish intentional sessions from duplicates.

The previous-weight before-insert trigger updates a row that does not exist yet instead of setting `NEW.previous`; local replay left the link null. The calorie-update function filters a timestamp with `created_at = CURRENT_DATE`, which targets midnight rather than the full day. These issues can make a polished dashboard report misleading or stale numbers.

**I will:** derive new visible progress from verified session outcomes, define logical local days and avoid unneeded stored counters. Weight/nutrition are deferred; their broken old linkage/formulas are not a reason to port or repair those features now.

### B09 · P1/P2 · Assessment and derived-metric logic need simplification, not cosmetic charts

The assessment performance function assumes the first trainee, merges only the exercises present in the new assessment, and uses a one-based JSON ordinality as a removal index. Workout and assessment functions use different formulas for values both labeled as performance estimates. These are source-confirmed implementation differences; this audit does not certify exercise-science validity or prove every resulting record is wrong.

**I will:** keep raw prescriptions and actual results as the source of truth. Defer bespoke assessment analytics in the first product; if retained for an actual organization, define one metric with clear units/provenance and tests for multiple trainees, correction and history preservation.

### B10 · P2 · AI/search has overlapping, stale and partly missing paths

The live `embed` function was absent from the local repository. The web also references an external embedding endpoint, so neither should be assumed to replace the other without checking callers. An older `search_ai_documents` overload refers to `documents`, which does not exist. Another orders cosine distance descending, returning more distant matches first. The `match_documents` functions use ascending distance; the defective alternate is not proof that the main chat path currently uses the wrong ordering.

The food-cache index uses English full-text search, while its similarity RPCs call trigram similarity. They are different query strategies, so that index is not evidence of acceleration for those RPCs. Several functions accept arbitrary filter/identity inputs, and provider behavior remains scattered.

**I will:** exclude AI from the new core. Check old service consumers only when retiring old resources. If a later use case earns it, retain one loader/retrieval contract, one provenance model and one integration adapter, with explicit tenant scope and a small relevance evaluation. Do not build an AI import system merely to avoid manually setting up the first few plans.

### B11 · P1 · Authentication recovery spans mismatched UI and configuration

The web reset form sends `redirectTo: window.location.origin`; the allowlist contains three `/change-password` URLs. The live email template appends `/change-password` to `{{ .ConfirmationURL }}`, which is already a verification URL. This is a fragile coupling to generated URL structure, not a verified failed-email experiment. No recovery event handler was found in the web source. There is no native deep-link callback in the observed allowlist.

The web signup flow also sends users to login after signup, although live email confirmation is disabled. Optional configuration and UI assumptions are therefore adding or obscuring steps that the backend does not require. Auth mail is on the built-in service despite a separate provider-backed business-mail function.

**I will:** implement one explicit callback/recovery route, preserve invitation/task context, use a supported redirect/template construction and test real delivery to a controlled test inbox when authorized. Choose the email sign-in experience deliberately rather than stacking signup, confirmation, login and profile completion. [Supabase redirect guidance](https://supabase.com/docs/guides/auth/redirect-urls).

### B12 · P1 · Deployed code and local code are not a reproducible release

I downloaded all eight functions to an isolated temporary directory and compared them without exposing credentials. `smtp`, `push` and `org-push` source files match the local versions byte-for-byte. API/shared helper differences shown by byte hashes largely disappear after line-ending normalization. `delete-user` has older runtime/import code but retains the same missing object-authorization check. `embed` is genuinely missing locally. Two trigger-returning database functions, `ensure_workout_sheet` and `send_workout_feedback`, are unbound; their existence does not mean those workflows run.

**I will:** keep the new backend source and deployment configuration reproducible from the start. Captured old versions remain evidence; do not restore `embed` or port unbound functions into the new product. Add a small deployment comparison/check for the new release. [Deployment comparison](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/deployment-comparison.json).

### B13 · P1/P2 · Operational work should match the actual scale

The advisor reports 53 unindexed foreign-key findings and four unused indexes. Those counts are a triage list, not a requirement to create/remove all of them. The database also reports 669 cumulative deadlocks with no useful reset timestamp; that cannot establish a current rate or identify the culprit. The small database does not establish acceptable phone latency, especially with repeated network round trips and an East US region.

**I will:** avoid multi-call transactions and broad trigger writes in the new design. Measure the new core queries, then add indexes supporting actual lookups. The old cumulative deadlock count is not a requirement to investigate the inactive database before building. Do not move regions, add caches, provision replicas or buy larger compute based on geography or advisor counts alone.

### B14 · P1 · Recovery and migration must include more than schema SQL

The schema-only CLI export succeeded after a fresh-login retry. It includes current public tables, functions, constraints, indexes and triggers, and is saved as an audit snapshot. It is **not** a backup of user records, Storage files, Auth settings, deployed secrets or external services. The dashboard confirms managed backups are not included for this project. External backups have not been inspected.

**I will:** prove a synthetic rebuild of the new schema and establish backup/recovery for the new product when it receives actual use. Never apply the old snapshot as the new baseline: it intentionally preserves behaviors the audit says to avoid. No old-data migration or full old-environment restoration is required.

## 5. Local reproductions: what was actually tested

Eight checks passed against selected captured functions in an isolated PostgreSQL 15 container with networking disabled, no host mounts and synthetic records. The local image is 15.6; live is 15.8. This is not a full Supabase restore or a production mutation test.

| Test | Observed result |
|---|---|
| A | Duplicate workout guard allows both inserts |
| B | A second client's first workout gets week 3 from the global count |
| C | No-op assignment status update deletes open workouts and inserts a notification |
| D | Completed-session note edit runs progression and notification again |
| E | Previous-weight before-insert routine leaves previous ID unset |
| F | Updating latest-start correctly advances expiry: a correction to the earlier uncertainty |
| G | Editing an already-active entitlement resets its access dates |
| H | Omitted workout array fails before the plan-copy trigger runs |

[Reproduction runner](/Users/sami/Developer/GitHub/rafik-api/docs/revival/tools/reproduce_backend_triggers.py) · [results](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/local-trigger-reproductions.json). The SQL fixture is labeled local-only and must never be submitted through `supabase db query --linked`.

## 6. What the aggregate data means for the product decision

At capture, 209 workout sheets included 141 completed non-rest sheets across 11 client IDs. The latest populated completion timestamp was 3 February 2026, with none in the preceding 30 days. Nutrition records last appeared in March 2026. One Auth user had signed in in the preceding 30/90 days. These are record-based aggregates, not validated commercial cohorts; test activity, missing dates and service-generated state may be included.

The data supports the founder's report of poor adoption, but cannot isolate UX as the only cause. It does establish that the database is not empty and that ongoing automation can conceal inactivity. The new product's first success metrics must count a real user completing a useful task, not forms generated, sheets created, messages inserted or profile counters changing.

[Aggregate snapshot](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/aggregate-usage.json) · [consistency checks](/Users/sami/Developer/GitHub/rafik-api/docs/revival/evidence/live-backend/consistency.json).

## 7. How this informs the clean rebuild

Use Supabase with a new schema and fresh web flows. Build explicit invitation, assignment, session, publication and review operations. Keep constraints and narrow invariants close to the data; ordinary row edits must not launch unrelated workflows.

Do not carry over the Cloudflare worker, Firebase, embedding services or the old trigger network by default. Shared invitation links and contextual session reviews do not require a recurring-job platform. Introduce a small delivery queue/dispatcher only when a concrete retained task needs it. If scheduling becomes necessary, one new-project Supabase Cron schedule is a possible simple host.

The old system is useful because it exposes failure modes. It does not dictate the new feature list, data model or deployment topology. The execution plan explicitly removes legacy backfills, compatibility adapters, historical credit accounting and full old-system restoration. Build the web/backend locally first; mobile comes later.

## 8. Known access configuration, recorded without making it the whole project

The founder states that permissive RLS was intentional during initial development. Inspection found 34 public tables with RLS disabled and anonymous/authenticated CRUD grants, with all 35 tables exposed through the enabled Data API. Storage has an unrestricted `ALL` policy in addition to bucket-wide policies. `smtp`, `push` and `org-push` have gateway JWT verification disabled; their webhook triggers send only a content-type header. Privileged credential material exists in deployed bundles as well as the repository; values were not copied into the report.

These remain release-hardening work, but they do not explain the whole product failure and they will not replace the UX/domain redesign in my plan. No data-access attack, mutation, deletion, email, push or settings change was performed on the live project.

## 9. Remaining checks under the revised scope

- Prove a clean reset and integration tests for the **new** local Supabase schema, using synthetic data.
- Visually exercise the new authenticated web journeys and phone-browser durability; old native/runtime restoration is unnecessary and mobile work is deferred.
- Verify new Auth callbacks/delivery and any retained notification behavior with local tooling, then controlled recipients when hosted release is in scope.
- Review only the exercise/media content selected for reuse, not every old user/file record.
- Inspect old Cloudflare/provider resources only to prepare their eventual shutdown and avoid ongoing unused costs; do not make that an architecture-recovery project.

The audit evidence is complete enough to begin the clean local revamp. No production state changed during inspection. The next implementation action is E01 in the [execution runbook](/Users/sami/Developer/GitHub/rafik-api/docs/revival/07-agent-execution-plan.md).
