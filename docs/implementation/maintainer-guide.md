# Working on the Rafik revamp

Last updated: 22 September 2026, R2 ongoing coaching. This is the practical entry point for developers and future Codex work. Update it when responsibilities, files or workflows change. The [ledger](ledger.md) records what is actually implemented; [architecture](architecture.md) specifies behavior; [verification](verification.md) records evidence and limits. The full product is still being rebuilt: R3–R5 remain open in [coverage](revamp-coverage.md).

## What changed from the retired product

The old four-repository platform is preserved in Git history and audited in `docs/revival`. The new runtime uses **two repositories, one Vue web application and one local Supabase project**. The old native and worker implementations are parked, not dependencies. There is no legacy compatibility layer or old-user migration requirement.

Backend baseline before revamp: `652e9ee`; frontend baseline: `a0c723e`. Foundation checkpoints: backend `dc60441`, frontend `a6afdc3`. R1 checkpoints: backend `31084bb`, frontend `8097f0d`. Root `CHANGELOG.md` files describe subsequent phases. Do not use old source links in the audit as current implementation instructions.

The new application has one person identity who may train, coach, or do both. A direct coach–client relationship grants access. Plans publish immutable versions; sessions copy the prescription and save actual results through explicit commands. R1 adds client context, private exercise content and richer cycles. R2 adds ongoing coaching through versioned question snapshots, measurements and conversations. Old trigger-driven orchestration, organization setup requirements, credits, provider chains and global store complexity have not been restored.

## Runtime and responsibilities

```mermaid
flowchart LR
  Person[Coach or client] --> Web[Vue web app]
  Web --> Auth[Supabase Auth]
  Web --> Read[PostgREST reads with RLS]
  Web --> Commands[Explicit Postgres RPC commands]
  Read --> DB[(Postgres)]
  Commands --> DB
  Web <--> Device[(IndexedDB drafts and workout queue)]
  Auth --> Mail[Local Mailpit inbox]
```

- **Database is the authority:** ownership, value bounds, immutable snapshots, revisions and retry semantics live in SQL. RLS permits reads; ordinary direct table writes are revoked.
- **UI owns interaction:** input state, validation hints, loading/error/empty states, navigation and local draft recovery. It never declares a server mutation successful before acknowledgement.
- **Auth is one adapter:** `src/app/auth.ts`. No separate coach identity system.
- **Device storage is limited in purpose:** workout recording supports durable queued commands and offline continuation. Form/template/message drafts support recovery; form submission and new assignment require the backend. Do not claim all screens are offline-first.
- **No notification provider:** in-app activity is derived from requests/messages. Message persistence succeeds independently of any future delivery adapter. Foreground polling is currently sufficient; no Realtime server is enabled.

## Backend file map (`rafik-api`)

```text
AGENTS.md                         required working rules and documentation-update rule
README.md                         quick setup and navigation into maintained docs
CHANGELOG.md                      concrete changes grouped by implementation phase
content/starter.json              canonical shared exercises and starter prescription
supabase/config.toml              local project identity, services and ports
supabase/migrations/
  202609220001_core.sql            identity, relationships, plans, workouts, core commands
  202609220002_daily_coaching.sql  client notes, custom catalog, cycle scheduling, rich results
  202609220003_ongoing_coaching.sql forms/requests, measurements, messages/cursors, progress
supabase/fixtures-users.sql        synthetic local Auth identities
supabase/fixtures-history.sql      synthetic training history
supabase/fixtures-coaching.sql     synthetic forms, requests and example conversation
supabase/seed.sql                  GENERATED content + local fixture composition
supabase/tests/
  core.sql                        foundation invariants and account lifecycle
  daily_coaching.sql              R1 domain/ownership/retry/snapshot scenarios
  ongoing_coaching.sql            R2 response/measurement/message lifecycle scenarios
scripts/local.mjs                 guarded start/stop/reset/types/env/test commands
scripts/content.mjs               generates seed and sibling web sample from canonical content
scripts/verify-fresh.mjs          isolated clean-schema verification; preserves preview records
docs/implementation/              current contracts, status, maintenance and verification
docs/revival/                     completed audit and historical business/design rationale
```

The backend no longer runs an application API server. `npm start` starts this local Supabase stack. The SQL functions are the API. No service-role key belongs in the web application.

## Frontend file map (`RAFIK-FRONTEND`)

```text
src/App.vue                       shared shell, workspace navigation, language/theme controls
src/app/router.ts                 public/private routes and safe return paths
src/app/auth.ts                   Auth identity and profile loading
src/features/public/             landing, local privacy and not-found page
src/features/account/            login, invitation, settings/export/delete, help/local preview
src/features/training/           Today, public sample, workout logger and history
src/features/coaching/           coach home, roster/client workspace, library, plans and review
src/features/ongoing/
  FormEditor.vue                  reusable check-in/assessment questions, template draft recovery
  RequestsPage.vue                assignment schedule, response queue/history, template links
  ResponsePage.vue                client draft/submission/correction, coach review, comparison
  MessagesPage.vue                participant inbox, paged conversation, context, durable send retry
  ProgressPage.vue                acknowledged exercise trends, current schedule, measurements
  CoachingActivity.vue            actual due/review/unread links on both Today pages
  types.ts                       module data contracts (JSON question/answer shape included)
  helpers.ts                     pure response-state and unit-aware trend calculations
src/components/PageState.vue      common loading/error rendering
src/lib/backend.ts                typed table/RPC entry point, paged record reads, old-host guard
src/lib/database.types.ts         GENERATED SQL schema types
src/lib/domain.ts                 training/program/client domain types
src/lib/prescriptions.ts          schema 1/2 compatibility and target/actual presentation
src/lib/dates.ts                  date-only and timezone utilities
src/lib/storage.ts                IndexedDB stores and account-scoped draft helpers
src/lib/training.ts               workout start/adoption, durable edits, sync, correction/conflict
src/lib/i18n.ts                   bilingual vocabulary, locale and contextual error copy
src/content/sample.json           GENERATED public training sample
src/style.css                    tokens, controls and semantic feature layouts
public/                          local assets/brand; no remote font dependency
scripts/visual-check.mjs           route/width/language/theme overflow checks
scripts/r2-visual-check.mjs        populated ongoing-coaching render and accessibility matrix
tests/*.test.ts                   pure unit/data invariants
tests/*.e2e.ts                    real browser workflows against local Supabase
```

Modules use the existing Vue Composition API; there is no new global store layer, chart package, general form-rule engine or repository abstraction. Check-ins and assessments share one small typed question vocabulary because their assignment/submission/review lifecycle is the same. They retain different purposes and separate compatible-result histories. The editor does not support nested rules, branching, uploads or calculated scoring.

## Routes and a useful test tour

Start at `http://127.0.0.1:5173/local-preview`. Choose **Laila Khoury** for the coach or **Amir Hassan** for the client; these buttons sign into real synthetic local accounts. No emailed code is needed. The ordinary login flow sends mail only to `http://127.0.0.1:55324`.

| Task | Coach | Client |
|---|---|---|
| Work queue | `/coach` | `/today` |
| Programming | `/coach/plans`, `/coach/plans/:planId` | assigned workouts from Today |
| Client context/schedule | `/coach/clients/:relationshipId` | Today schedule |
| Exercise catalog | `/coach/exercises` | exercise instructions inside workout |
| Progress | `/coach/clients/:relationshipId/progress` | `/progress` |
| Requests/history | `/coach/checkins` | `/checkins` |
| Template creation/edit | `/coach/forms/new`, `/coach/forms/:formId` | assigned snapshots only |
| Response/review | `/coach/checkins/:requestId` | `/checkins/:requestId` |
| Conversations | `/coach/messages/:relationshipId` | `/messages/:relationshipId` |

**Client workspace URLs use the relationship UUID, not the person's UUID.** The local Laila–Amir relationship is `40000000-0000-4000-8000-000000000001`.

For R2: open the seeded reflection as Amir, save a draft, submit it; switch to Laila and review it from Today; return as Amir and correct an answer. The review clears and the original submitted timestamp stays fixed. Use **Discuss this response** to send a contextual message, then reply from the coach inbox. Create another assessment from the same template revision to compare compatible numeric results. In Progress, record a measurement with **Only me** or share it explicitly with Laila; correct or remove it. The coach only sees shared records.

## Safe local development

For the exact commands see [runbook](runbook.md). Keep both repositories on `codex/revamp`; never push main. Node is 22.16.0. Docker must be running. Local API: 55321; database: 55322; mail: 55324; dev: 5173; production preview: 5174.

1. Install pinned dependencies with `npm ci` in both checkouts, start the backend, generate the ignored frontend environment with `npm run web-env`.
2. **First setup only, or deliberate fixture restart:** `npm run reset`. This erases the new local preview data. Do not use it simply to test a migration.
3. **Existing preview:** verify `supabase/.temp/project-ref` is absent, then `npx supabase migration up --local` and `npm run types`. Preserve entered notes/invitations/history.
4. Start frontend dev. Build and run preview for browser regression tests. All tests must target this local stack, never hosting.
5. Use `npm run test:fresh` to validate a clean install in a temporary database without disturbing the preview.

Schema changes go into the next migration. Existing uncommitted local migration functions may be iterated during development, but the actual preview schema and checked-in migration must match before completion. Once a migration has been shared/applied beyond this local rebuild, use forward migrations. Never apply synthetic Auth seeds to hosting.

## Change recipes

**New UI capability:** locate the task module, describe the user action and states, add only needed routes/components, then add the bounded command and read policy if data changes. Reuse the semantic tokens and bilingual pairs. Do not add signup questions to expose optional features.

**New question type or answer semantics:** update SQL `validate_coaching_fields` and `save_coaching_response`, then `ongoing/types.ts`, editor and response rendering. Test old assigned snapshots. New template revisions apply only to future assignments. Do not mutate assigned `fields` from the frontend.

**Progress metric:** start from acknowledged `set_entries`, include its unit and meaningful denominator, update `training_progress` plus `helpers.ts` and its pure tests. Never convert a missing value into a reported zero or blend strength/time/distance into one score. Current schedule counts describe the current assignment configuration, not historical adherence after arbitrary schedule edits.

**New message feature:** keep send UUID/payload persistence and context ownership checks. Notification delivery is a future adapter; failures there must not roll back or duplicate a message. New attachments require a private storage contract in R3, not arbitrary public URLs in message JSON.

**Shared content:** edit `content/starter.json`; run `npm run content` and `content:check`. Generated files are not independent sources. Synthetic R2 examples live in `fixtures-coaching.sql`; keep them out of production data provisioning.

**Schema:** add a migration, run SQL tests and clean-schema verification, regenerate web types, then build/test affected UI. Add a new SQL suite to both `scripts/local.mjs` and `scripts/verify-fresh.mjs` if introducing a new suite file. Do not hand-edit generated TypeScript.

## Required finish checklist for every future change

- Update the relevant root `CHANGELOG.md` with the actual behavior/files changed; maintain accurate implemented/partial/deferred status in `ledger.md`.
- Update `architecture.md` for any data, ownership, API, snapshot, retry or lifecycle contract change.
- Update this guide and the affected README when files, modules, setup or development workflow change; update the runbook for operational changes.
- Record executed verification and its limitations in `verification.md`. Do not copy a previous test count as evidence for new code. Preserve evidence under `docs/implementation/evidence/` without secrets or user messages.
- Run the checks appropriate to the change and inspect affected rendered screens in both languages and phone/desktop layouts. Keep native and hosting deferred until the user changes that scope.
- Commit code and matching documentation together on `codex/revamp`. Never label the whole revamp complete just because one phase passes local tests.
