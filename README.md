# Rafik web revamp

Engineering entry points: [documentation index](../rafik-api/docs/README.md), [contribution workflow](CONTRIBUTING.md), [architecture decisions](../rafik-api/docs/decisions/README.md).

A responsive Vue 3/TypeScript application for training and ongoing coaching: programming, client management, progress, check-ins, assessments, conversation, optional nutrition, appointments and private files. The local product includes team/business workflows and exercise choices; hosted/device release gates remain open. English/Arabic, light/dark themes, public sample workouts, email-code entry, coach plans/invitations/review, and recoverable local drafts.

Work belongs on `codex/revamp`. The old application is preserved in Git history. No native app or legacy backend is required.

**Current direction:** web development prioritizes coaches and organization staff. The local runtime is Prisma/PostgreSQL behind one TypeScript API; identity and private files use that API. The [role-scope audit](../rafik-api/docs/implementation/role-scope-audit.md) documents the original six roles and the current organization gaps. R7A1/R7A2 implement the API transition and separate organizational memberships, invitations, role views and trainer responsibility; R8 adds organization-owned programs, reviewed delivery and training history; R9 adds organization calendars, groups, assessor-led assessments and separate coach/admin analytics. Current teams are not a complete organizational implementation.

## Start here

- [Developer and architecture guide](../rafik-api/docs/implementation/maintainer-guide.md): complete file map, responsibilities, data flow, routes, local tour and change recipes for both repositories.
- [CHANGELOG.md](CHANGELOG.md): exactly what changed in each implementation phase.
- [Current status and remaining scope](../rafik-api/docs/implementation/ledger.md): distinguish implemented work from the rest of the revamp.

Future work must update these records and the relevant architecture/runbook/verification docs in the same change. The requirement is recorded in both repositories' `AGENTS.md`.

## Run locally

Use Node 22.16.0 and start the companion backend in `../rafik-api` first. Its `npm run web-env` writes the ignored local configuration; do not copy any retired-project credentials.

```sh
nvm use
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Start with **Try a workout**, or use **Explore sample accounts** in the footer to inspect both sides of the local workflow. Sample accounts use real local identity and database calls. Sign-in email stays in the backend's test inbox at `http://127.0.0.1:55331/local/inbox`.

## Explore R3

Sign into Laila or Amir at `/local-preview`, then choose **More** in the workspace navigation. Nutrition supports guidance and actual meal records; Appointments supports availability and booking; Resources supports real private upload and explicit sharing. Shared files can be attached to Messages. Upcoming appointments appear on Today when there are bookings in the next week. No extra signup fields are required.

See the [R3 contract](../rafik-api/docs/implementation/r3-contract.md) for units, timezones, retries and file lifecycle. New modules are `src/features/nutrition`, `appointments`, `resources` and `services`; there is no new global state layer.

## Explore R4

Open **More → Teams** as Laila. Create a team, invite `coach2@rafik.test`, and open the generated invitation link as **Nour Mahfouz** in another browser profile. Both identities have buttons at `/local-preview`; no email code is needed. Choose an existing client for enrollment; **Amir Hassan** approves on Today or **More → Teams**. Team admins manage staff/groups and propose coach handoffs; clients approve before their future plan changes. Published team plans become independent editable copies. Files have separate, explicit staff sharing.

**More → Business** is an optional personal account; **Team subscription** handles the selected team. Its owner-only local simulator exercises subscription states without cards, charges or a real provider. **More → Support** saves actual local requests and supports admin replies, resolve/reopen and draft recovery. See the [R4 contract](../rafik-api/docs/implementation/r4-contract.md) and maintainer guide for access and retry boundaries.

Modules: `src/features/teams` (workspace, invitations and one persisted pending command), `business` (account state), `support` (cases). The existing workout queue and solo-coaching architecture remain in place. `tests/team-fixture.ts` creates isolated synthetic accounts and removes them after the R4 browser/layout checks; it must only run with the sibling local backend.

## Check and build

```sh
npm test
npm run format:check
npm run build
npm run preview -- --port 5174 --strictPort
```

The production build includes a service worker for the public application shell, so an already opened workout can reload without a network connection. API responses are never cached by it. IndexedDB retains workout records; a durable local save and a server acknowledgment have distinct statuses.

For full browser checks, keep both dev (5173) and production preview (5174) servers running with the local PostgreSQL/API stack:

```sh
npx playwright install chromium webkit
npm run test:e2e
```

Tests use only synthetic local identities. Chromium and phone-sized WebKit are covered; physical phones and real-person observation are separate checks. CI runs public browser paths plus build/type/unit checks. Full account tests need the companion local backend.

## Source map

- `src/features/public`: offer, local privacy summary and fallback page.
- `src/features/training`: preview, workout logger, Today and history.
- `src/features/coaching`: plans, roster/client workspace, library, assignment schedule and session review.
- `src/features/ongoing`: templates, requests/responses, assessments, progress/measurements, conversations and Today activity. Each page owns a user task; `types.ts` contains question/answer contracts and `helpers.ts` holds pure calculations.
- `src/features/account`: email entry, invitation acceptance, profile/help/export/deletion.
- `src/lib/training.ts`: start/adoption, durable edits, retry and conflict handling.
- `src/lib/storage.ts`: bounded IndexedDB access; no server behavior hidden here.
- `src/app/auth.ts`: one Auth session adapter.
- `src/style.css`: semantic tokens, shared controls and feature layouts, including RTL.
- `src/content/sample.json`: generated from `../rafik-api/content/starter.json`; do not edit directly.
- `src/lib/database.types.ts`: generated by the backend's `npm run types`.

See the companion [execution ledger](../rafik-api/docs/implementation/ledger.md), [architecture](../rafik-api/docs/implementation/architecture.md), [runbook](../rafik-api/docs/implementation/runbook.md) and [verification record](../rafik-api/docs/implementation/verification.md).

The current privacy page, sample version IDs, test mail settings and synthetic seed are local-preview material. Follow the hosted-release gate before any deployment. No remote deployment, main push, live outreach or payment action is part of this build.

## Daily coaching expansion

After signing in through `/local-preview`, open **Clients** for each client's overview, private notes, plan/schedule and history. **Exercises** contains the shared catalog and your editable private exercises. **Plans** now supports cycle weeks, rest days, per-set targets, timed/distance work and consecutive exercise groups. Published instructions and started workout prescriptions remain fixed.

The wider revamp remains in progress. Current coverage and the next phase are in the backend's `docs/implementation/ledger.md`. Full browser checks now include `tests/daily-coaching.e2e.ts`; run both repositories' checks before changing prescription or scheduling rules.

## R2 test tour

Open `/local-preview` and choose Laila (coach) or Amir (client). Buttons use real local identity; you do not need an email code. Seeded reflection/assessment examples make the new paths immediately usable.

- Coach **Check-ins**: create/edit a template, assign a client with bounded recurrence, review submitted responses or cancel unsubmitted occurrences.
- Client **Check-ins**: save draft, submit, read feedback and correct results. **Discuss this response** adds verified context to a message. Assessments show earlier compatible results.
- **Messages**: choose the relationship, send/retry, refresh or load older records. New messages appear through foreground polling; there is no email/push delivery.
- **Progress**: inspect completed actuals and current schedule counts. Clients can add private/shared measurements and correct/remove them; coach progress is linked from the client workspace.

The client workspace and conversation routes use a **relationship ID**. The Laila–Amir fixture relationship is `40000000-0000-4000-8000-000000000001`.

`tests/ongoing.e2e.ts` verifies the R2 lifecycles; `tests/ongoing.test.ts` checks unit-aware trends and response states. `node scripts/r2-visual-check.mjs` checks populated R2 screens across widths/languages/themes. Run the companion SQL suites after changing response, progress or conversation contracts. This is still local verification, not a physical-device or hosted-release claim.

R4 checks: `npm run test:e2e -- tests/teams.e2e.ts` runs both browser engines; `npm run test:teams:layout` checks 176 populated layouts and saves its local report/screenshots in ignored `artifacts/`. The layout script uses Node 22's explicit experimental type-stripping flag; production application code does not depend on it.

## Product quality and exercise choice

Messages now keeps history and composing in a bounded workspace, with a searchable inbox and phone back flow. Today prioritizes training; check-ins/plans/reviews handle growing lists. Coaches can offer up to three same-kind exercise alternatives in the plan editor; publish and assign the version, then the client chooses within the workout. Recorded choices flow through offline recovery, coach review and progress while original targets remain unchanged.

Read the [product quality review](../rafik-api/docs/implementation/product-quality-review.md), [R5 contract](../rafik-api/docs/implementation/r5-contract.md) and [release checklist](../rafik-api/docs/implementation/release-checklist.md). The contribution rules require real user-task inspection, complete lifecycle implementation and matching docs for future work.

## R6 responsive checks and application updates

`npm run test:product:layout` audits client/coach routes in Chromium and WebKit with internal clipping checks. `tests/responsive-inbox.e2e.ts` covers populated long-name inboxes, short/tall/landscape/resized viewports, search/back and native select overflow. Inspect screenshots in ignored `artifacts/`; a passing metric is not visual acceptance.

Production Help/Settings includes **App updates**. A downloaded release waits for old tabs to close; no automatic reload or data clearing occurs. `build/offline-shell.ts` owns versioned worker generation, `src/app/updates.ts` its status, and `AppUpdates.vue` its UI. `tests/app-updates.e2e.ts` checks failed installs, waiting releases, preserved workouts and offline reopening on both engines. `npm run test:build` verifies the emitted files and HTML-only release identities. The dev server does not register a worker.

Run the companion backend's `npm run verify:release -- --full` for one guarded serial verification chain across both repositories. See the [runbook](../rafik-api/docs/implementation/runbook.md) and [ADR 0003](../rafik-api/docs/decisions/0003-application-updates.md). This remains local preparation, not a hosted release.

## Organization workspaces

Use **Manage workspaces** to explicitly create an organization or activate independent coaching. Sample Rania administers Madar; Kareem has separate trainer and trainee views; Sara sees her own organizational membership; Omar belongs to Athar. `src/features/organizations/` owns these routes and context-scoped drafts; `tests/organizations.e2e.ts` verifies invitations, role changes, responsibility and uncertain-request recovery.

## Programming ownership

`src/features/coaching/program-context.ts` adapts the shared editor/library to independent or organization scope. `DeliverPlan.vue` provides reviewable assignment; `ProgramCover.vue` renders private optional covers. `src/features/organizations/OrganizationTraining.vue` provides scoped delivery/history entry. Both scopes use `lib/training.ts` and its existing durable queue. New adaptation draft/retry keys include source and recipient. The backend [R8 contract](../rafik-api/docs/implementation/r8-contract.md) documents authorization, revision and lifecycle rules.

## Organization services

Calendar supports reviewed group scheduling, specific assessors, attendance and separate per-trainee results with corrections. More contains Groups and Assessment templates. Analytics provides date/trainee filters, current workload and participation, accessible chart tables and metric definitions. `src/features/organizations` owns these workflows; `src/features/analytics` owns shared charts/reports. `tests/organization-services.e2e.ts` covers the full schedule/result/correction/recovery journey; `scripts/audit-services.ts` checks role/locale/theme/viewport states.

R10 adds organization conversations and the global notification inbox/preferences. The local dispatcher intercepts optional generic previews; no email/push is sent. See the backend implementation ledger, ADR 0007 and runbook for authority, retry and maintenance contracts.

## Operations and large rosters (R11)

Platform operations are available through Amina in the local sample switcher, with separate authority and audited reasons. Organization people, delivery recipients, analytics breakdowns and correction history now use bounded server pages. Selected people remain visible across searches and reloads. Web `npm run test:e2e` owns a disposable database/API/build, preserving the preview; backend `test:operations`, `recovery:local` and `files:maintenance` cover operational checks and local recovery. See the companion backend runbook and maintainer guide for exact file ownership, commands and provider limits.
