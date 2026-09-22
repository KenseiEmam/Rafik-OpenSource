# My execution plan for the Rafik revamp

**Scope correction, 22 September 2026:** the user rejected the implemented narrow core as the entire revamp. The exclusions and completion boundary below record the earlier plan and are superseded by [revamp coverage and corrected execution scope](../implementation/revamp-coverage.md). Keep the local-first, clean-rebuild, branch and native-deferral constraints. Complete the broader useful web/backend capabilities without making them contingent on customer acquisition.

**Execution owner: Codex. Updated 22 September 2026 with the founder's latest constraints.** This is my implementation guide and project memory. The old product is inactive; legacy data and old-client compatibility are not requirements. Build a clean replacement locally, with a new Supabase project later when hosting is needed. Finish the analysis before prototyping. Revamp the web product and backend first; mobile comes after everything else is ready.

## 1. Binding decisions

- **Clean rebuild:** new core schema and application flows. Do not restore the old platform as an implementation prerequisite, surgically remove triggers, backfill user histories, reconcile credits or maintain old mobile compatibility. Use the captured backend as evidence of mistakes to avoid.
- **Local first:** implement and test against a new local Supabase environment. Do not create a hosted project, deploy functions, change old production settings or send real messages during the current analysis/local phase. The user permits a new Supabase project later; it is the default deployment target.
- **Branches:** all four provided checkouts are on `codex/revamp`. Never push revamp work to `main`. No commits or pushes were made during this audit. When a push is needed, name the `codex/revamp` destination explicitly and verify it.
- **Web and backend first:** no Flutter repair, native prototype, compatibility adapter or mobile feature work until the web/backend release gates pass. Phone-browser usability belongs to the web work and remains essential.
- **Full UX/UI redesign:** public offer, entry/authentication, first value, logger, plan editor, coach review, errors and recovery are all in scope. Use the requested [design-taste-frontend skill](/Users/sami/.agents/skills/design-taste-frontend/SKILL.md) instead of `frontend-design`, applying it within its scope. Customer acquisition is not a prerequisite for fixing established design failures.
- **Small product:** useful existing-plan delivery and reliable training are the initial proposition. No marketplace/lead-generation promise, nutrition/AI platform, organizations, credit system or custom form builder in the first core.
- **Tools are reusable; old structure is not binding:** Vue 3/TypeScript and Supabase are suitable defaults for a fresh implementation. Do not retain old global stores, routes or business rules simply because they exist.
- **Old data is off the critical path:** leave the old project alone during construction. Selectively reuse exercise/media content only when it is genuinely useful and its provenance is clear. No old-account import by default.

The earlier compatibility-heavy plan is superseded by these decisions, not merely shortened. The [architecture document](/Users/sami/Developer/GitHub/rafik-api/docs/revival/03-architecture-and-migration.md) specifies the replacement. The [UI/UX blueprint](/Users/sami/Developer/GitHub/rafik-api/docs/revival/02-product-and-ux.md) specifies the complete core experience. The [business analysis](/Users/sami/Developer/GitHub/rafik-api/docs/revival/00-market-and-business.md) distinguishes the recommended hypothesis from proven demand.

## 2. What I have already established

| Area | Completed evidence |
|---|---|
| Product and market | Failed activation/commercial history, competing offers, model comparison, candidate proposition and outcome tests |
| Four repositories | 35 findings, source references, inventory, public-page inspection, build/type checks and five isolated logic reproductions |
| Live Supabase | Authenticated CLI/Chrome inspection of `pexviywnztvqomfosvho`; 35 public tables, 35 custom functions, 27 public triggers, Auth/storage/realtime/operations |
| Deployed behavior | All eight Edge Functions recovered/compared; schema-only reference; aggregate consistency; eight synthetic database reproductions passed |
| Design | Full task/screen/state brief and current visual evidence; no prototype delivered |
| Branch preparation | `codex/revamp` created from the current checkout in all four repositories; existing local changes preserved |

The eight database checks exposed update-trigger deletion, replayed progression, ineffective duplicate prevention, cross-client week numbering, a broken previous-weight link, entitlement date resets and trigger-order dependence. They also confirmed that expiry recalculation works. These are lessons for the new implementation, not a repair backlog for every old feature. See the [live audit](/Users/sami/Developer/GitHub/rafik-api/docs/revival/06-live-backend-audit.md).

## 3. Source and environment ownership

| Root | Role in the revamp | Current branch / starting point |
|---|---|---|
| `/Users/sami/Developer/GitHub/RAFIK-FRONTEND` | Fresh responsive web application; replace old structure on the revamp branch | `codex/revamp`, from `reset-password` at `a0c723e` |
| `/Users/sami/Developer/GitHub/rafik-api` | New Supabase migrations, commands, fixtures, provider adapters and this execution record | `codex/revamp`, from `main` at `652e9ee` |
| `/Users/sami/Developer/GitHub/rafik-worker` | Reference only; do not carry the worker into the new system by default | `codex/revamp`, from `main` at `36fbd31`; pre-existing `.DS_Store` modification preserved |
| `/Users/sami/Developer/GitHub/rafik-mobile` | Parked until web/backend complete | `codex/revamp`, from `main` at `49390b6`; no application changes |

Two active codebases are enough: web and backend. Do not spend a phase moving all repositories into a monorepo. A shared short contract document and generated database types are enough for this product. Build new local configuration with an explicit project identity; guard against accidentally targeting the old linked remote. Do not copy old credentials into new environments.

## 4. Implementation sequence

Each unit below is mine to implement, document and verify. No invented staffing plan or fixed engineering calendar. Real-user observation requires participants and elapsed time; the core rebuild does not wait for those observations.

### E01 — Establish the clean local foundations

**I will:** preserve the audit package, record branch/state, and create clean web and Supabase configurations in their respective repositories on `codex/revamp`. Pin toolchains and lockfiles, add repeatable scripts and a minimal CI configuration, and isolate all new runtime configuration from the old project. Build a new synthetic seed, not a restored copy of the legacy database. Stub outbound mail/notifications during local development.

**Edit surface:** frontend scaffold/configuration; API `supabase/config.toml`, new migrations/seed/tests; setup/runbook. Replacing old source on a revamp branch is allowed; Git retains its history.

**Done:** clean local setup builds, type-checks and resets the new database from source; no old keys/project reference in runtime configuration; no live provider effects. No full old-system restoration required.

### E02 — Define and implement the minimal domain

**Depends on:** E01; use the audit lessons without copying the old schema.

**I will:** implement one Auth-linked profile identity, simple coach/client relationship, invitation, exercise catalog, draft plan, published plan version, assignment, session and set entries. Validate prescription JSON. Define occurrence identity, local dates, actual-value units and exact completion/review states. No workspace hierarchy or credit/billing schema by default.

**Edit surface:** new backend migrations, focused transaction functions, generated types and command examples.

**Done:** the schema supports the whole core task; ownership and unique occurrences are explicit; sessions preserve their prescription; inputs/results/errors and retry behavior are documented. No broad trigger changes an unrelated feature.

### E03 — Design the complete experience, then prototype

**Depends on:** the completed analysis and agreed core constraints; can proceed alongside E01/E02.

**I will:** write the Design Read, resolve the information architecture, define tokens/components and produce the clickable prototype. Cover public sample, private invite, training start/log/resume/finish, coach starter/import/edit/assign/review and all empty/error/recovery states. Include desktop, phone-browser and the Arabic critical path with realistic synthetic content.

**Done:** complete tasks are understandable without training; visual hierarchy and interaction states are deliberate; no attractive shell around the old workflow. Every core screen has an implementation brief. No native/mobile-app prototype at this stage.

### E04 — Build coherent entry and authentication

**Depends on:** E01–E03.

**I will:** build new public routes, useful fallback/404 and policy routes, one session adapter and contextual verification. Public preview/sample requires no account or installation. Private invitation uses verified intended identity; signup/recovery preserves task context and guest work. Choose one email verification method and test it locally with the supported mail tooling before hosted delivery.

**Done:** fresh phone/desktop entry reaches useful content; no width redirect, affiliate copy, repeated login/setup, dead payment form or fabricated metrics. Session expiry, wrong account and recovery have clear next steps.

### E05 — Build durable workout recording

**Depends on:** E02–E04.

**I will:** implement routine preview and the logger with clear prescription, previous actual result, units and focused recording. Persist entries locally before acknowledging them. Implement stable operation IDs, start/completion transactions and a small retry queue for workout records. Keep guest limits explicit and account switching safe.

**Done:** preview → start → record → interruption → resume → finish works on ordinary iPhone/Android browsers; reconnect does not lose/duplicate entries; coach can see a synced result. Record actual timing and keyboard behavior. Phone-browser testing is web validation, not mobile-app work.

### E06 — Make plan changes and results dependable

**Depends on:** E02, E05.

**I will:** implement deliberate publication of future plan versions, stable session snapshots and explicit result correction/review. Show prior results rather than silently prescribing automatic load increases. Completion is one transition; changing a note does not rerun it.

**Done:** open work survives edits; two starts return one occurrence; week numbering belongs to one assignment; retry/note correction has no extra progression or notification; legitimate two-session days work. Test these new invariants with synthetic fixtures. Do not port weight/nutrition/assessment logic just to reproduce every old test.

### E07 — Build the coach's complete work surface

**Depends on:** E03, E05–E06.

**I will:** implement a new plan editor with a populated starter, duplicate/adapt, recoverable draft, client preview and deliberate assignment. Build a truthful client list and concise review queue. Provide a contextual session note/reply before introducing a full inbox. Advanced prescription options stay out of the default path.

**Done:** coach prepares/assigns a plan and reviews real results without learning credits or configuring an organization. Errors preserve drafts; conflicts are clear; saved states are truthful. The editor and review experience are required parts of the revamp, not contingent on first recruiting customers.

### E08 — Prepare a useful, small content foundation

**Depends on:** E02, E05–E07.

**I will:** select or author the initial exercise and starter-plan set, validate prescriptions/units, verify media rights/links and prepare English/Arabic content. Reuse useful old exercise/media assets selectively; do not import users, forms, conversations, entitlements or old workout histories.

**Done:** the new app opens with content that lets someone complete a realistic task; no placeholder-only demo or blank builder. Content can be edited through one documented process. No bulk legacy migration is needed.

### E09 — Add only necessary operational services

**Depends on:** E04–E08.

**I will:** implement minimal outcome/reliability events, account/help flows and an operator view of failed saves/delivery. Start with invitation links shared through the coach's existing channel. Add a provider adapter or small delivery queue only for a defined need. If reminders are included, one due item per period, correct local timing, bounded retry and overdue handling are required.

**Done:** automated record counts cannot masquerade as engagement; support can explain failures; no unneeded Cloudflare/Firebase/AI chain. External email/notification tests remain local or use controlled recipients in the later hosted phase.

### E10 — Verify the complete local web/backend product

**Depends on:** implemented E01–E09.

**I will:** run task-based visual/browser verification, Arabic/accessibility checks, local transaction/access tests, device interruption/retry/conflict cases and a clean-reset/rebuild. Exercise a representative small copy, prescription-field or review-rule change to verify maintainability. Apply new-project access and secret handling as normal bounded engineering, not the center of the product narrative.

**Done:** all critical core tasks work; no unresolved lost work, false success, blocking navigation or authorization defect. A short report distinguishes passed checks from any device/participant tests still unavailable. This is the main readiness gate before hosted rollout and any mobile-app work.

### E11 — Prepare the new hosted release when needed

**Depends on:** E10 and transition beyond the user's local-only phase.

**I will:** provision a new Supabase project using the user's authorization when hosting is actually needed, record its distinct environment identity, apply the new migrations/content and configure Auth/media/required providers. Prepare the web deployment, backup/restore and rollback for the new system. Test with controlled accounts/recipients before public exposure. No push to `main`; any remote work stays on `codex/revamp`.

**Done:** the new system is independently deployable and recoverable; no dependency on the legacy project. Prepare a short old-resource shutdown list to stop stale automation/costs when appropriate. Do not turn retirement into a data-cleaning or compatibility project.

### E12 — Observe usefulness and iterate the new product

**Depends on:** a usable core; real-use observations need actual participants.

**I will:** prepare task scripts, concrete pilot offers, demos and analytics views. Test the coach-distributed offer and bounded direct-client alternative from document 00. Use observed behavior, support effort and paid continuation to guide changes. Fix usability blockers directly; revise the offer when a usable product still has no value to its intended audience.

**Done:** the release has an evidence log for activation, return, payment response and recurring maintenance cost. Automated tests cannot certify willingness to pay. Expand only where the corrected product demonstrates usefulness; do not recreate the old feature list to fill perceived gaps.

## 5. Mobile is a later phase

Do not work on `rafik-mobile` while the web/backend is being revamped. After E10 passes and the web/backend release path is ready, assess whether a native client adds a concrete benefit. If selected, make a separate native execution brief using the established product design and backend commands. No duplicated business rules and no obligation to retain the old FlutterFlow screen structure. The branch already exists solely to keep future work off `main`.

## 6. Release contract

| Dimension | Required result |
|---|---|
| Immediate value | Useful public sample without setup; clear private invitation leading to the intended training |
| UI/UX | Coherent readable task flows, realistic content, responsive layout and designed recovery; Arabic critical path |
| Training correctness | Stable occurrence, explicit completion, correct units, immutable started prescription and deliberate future revisions |
| Reliability | Durable local save, interruption recovery, deduplicated retries, visible conflicts and truthful sync state |
| Coach usefulness | Easy first-plan setup, usable editor/assignment, actual client results and clear review action |
| Maintainability | New source-controlled schema, predictable feature modules, meaningful checks, documented setup/deployment and one rule owner |
| Scope | No legacy migration/compatibility burden; no mobile work ahead of the web/backend; deferred breadth absent from the new core |
| Business evidence | Real activation/return/support/payment observations; no guarantee that a rebuild alone creates demand |

## 7. Execution ledger and next action

At the end of each unit I will record its status, changed files, tests, any environment changes and the exact next action. I will verify the branch before committing or pushing. Existing audit evidence remains historical; resolved/superseded findings get an explicit reference to the new behavior rather than being erased.

**Current status:** the clean web/backend implementation is now built locally on `codex/revamp`. Its source, command contract, checks, known limits and next actions are tracked in the [implementation ledger](../implementation/ledger.md). The audit above remains historical evidence. No hosted project, main push, native-app change or real outreach was performed.

**Next action:** execute R1 in the corrected coverage register: specify client/resource ownership and expanded prescription/schedule contracts, then build the client workspace and exercise/programming flows. The current build is a foundation, not a finished revamp. No legacy migration, hosting or native work is required to continue.
