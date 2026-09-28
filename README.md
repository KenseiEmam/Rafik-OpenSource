# Rafik backend

Current founder corrections and delivery order: [gym-first implementation register](docs/implementation/r17-gym-direction.md). R17 covers entry, authoring, calendar and navigation; exercise uploads/ownership, packages and staff operations follow.

The exercise library now imports 1,324 requested-source entries plus 46 wger entries alongside the 14 starters. There are 45 continuous-motion previews, category filters and immutable source credits. See [exercise correction](docs/implementation/r15-exercise-correction.md), [content maintenance](docs/implementation/content.md) and [ADR0011](docs/decisions/0011-exercise-catalog-and-motion.md).

Rafik's local revamp uses a Vue web application, one Node/TypeScript API, Prisma and PostgreSQL. Authentication and private files go through the API; there is no Supabase runtime dependency. Coach and organization web work comes first; native and hosting remain deferred.

Work on `codex/revamp`; never push main. Read the [engineering index](docs/README.md), [ledger](docs/implementation/ledger.md), [architecture](docs/implementation/architecture.md) and [contribution guide](CONTRIBUTING.md). Organizations now have their own memberships, admin/trainer/trainee views and responsibility lifecycle. Organization-owned programs, delivery and training history are implemented; organization calendar, groups, assessor-led results and role-specific analytics are implemented locally; independent-coach teams remain a separate collaboration feature.

## Local setup

Use Node 22.16.0 and Docker, with `RAFIK-FRONTEND` adjacent to this checkout.

```sh
nvm use
npm ci
npm start
npm run seed:local
npm run web-env
npm run start:api
```

`npm start` starts PostgreSQL, applies forward Prisma migrations and generates the Prisma client. `seed:local` accepts an empty database only and installs synthetic examples. Skip it on an existing preview. API: `http://127.0.0.1:55331`; database: port `55332`. Start the companion web app with `npm ci` and `npm run dev`, then open `http://127.0.0.1:5173`.

Use **Explore sample accounts** to inspect Laila, Amir, Nour and Dalia without codes. Real local email-code sign-in is also available; codes remain in the [local inbox](http://127.0.0.1:55331/local/inbox), never sent externally. `npm run dev:api` enables API autoreload during development. Use the stable `start:api` process during acceptance checks.

## Change and verify

- Domain: `prisma/migrations/` owns database schema, transactional commands and RLS; `prisma/schema.prisma` describes ORM models. Add forward migrations, then `npm run db:migrate`, `db:generate` and `types`.
- HTTP and identity: `server/`; [API conventions](docs/reference/api.md) document errors, cookies, pagination and replay.
- Content: edit the canonical starter/media/food files in `content/`; see the content guide before importing sources. `npm run content` generates the seed, web sample, media manifest, SVGs and credits; verify with `content:check`, `content:media` and `test:catalog`.
- Tests: `npm test` (rollback SQL), `npm run test:fresh` (disposable database), `npm run test:api`, `test:services`, `test:teams`, `test:organizations`, `test:programming`, `test:organization-services`, `typecheck`, `content:check`, `test:docs`.
- Full local gate: `npm run verify:release -- --full` with API and web servers on 5173/5174 running. Reports stay under ignored `artifacts/release/`.

See the [maintainer guide](docs/implementation/maintainer-guide.md) for file ownership and feature recipes, [runbook](docs/implementation/runbook.md) for operations, and [verification](docs/implementation/verification.md) for evidence and remaining limits. Update these and `CHANGELOG.md` with every phase. Old Supabase implementation is preserved in Git at `727f02d`; old product audit is under `docs/revival`.

## Organization sample accounts

At `/local-preview`, choose Rania (Madar administrator), Kareem (trainer and trainee), Sara (trainee) or Omar (a different organization). The workspace selector contains only authorized contexts. **Manage workspaces** explicitly creates an organization or activates independent coaching. See the [membership contract](docs/implementation/r7a2-contract.md) for permissions, invitation recovery and lifecycle.

## Programming and delivery

Madar has a synthetic foundation program. As Rania, open Programs, edit or duplicate sessions/weeks, preview, publish, then review recipients before assigning. As Sara, Training opens the assigned session; as Kareem, Training exposes assigned-trainee history and feedback. Programs, images and history stay within that organization. Laila's independent practice uses the same editor with its separate catalog and clients. See the [programming contract](docs/implementation/r8-contract.md).

## Calendar, assessments and analytics

Rania's Calendar shows Madar's week agenda. The Library navigation contains reusable groups and assessment templates; Schedule follows Details → People → Review. Kareem sees only assigned events, and each trainee has separate attendance/results. Results can be corrected with preserved history. Analytics distinguishes organization workload/delivery from a trainer's assigned roster; Laila has separate independent coaching analytics. Sample assessment results are explicitly synthetic. See the [service contract](docs/implementation/r9-contract.md).

R10 adds organization conversations and the global notification inbox/preferences. The local dispatcher intercepts optional generic previews; no email/push is sent. See the backend implementation ledger, ADR 0007 and runbook for authority, retry and maintenance contracts.

## Operations and large rosters (R11)

Platform operations are available through Amina in the local sample switcher, with separate authority and audited reasons. Organization people, delivery recipients, analytics breakdowns and correction history now use bounded server pages. Selected people remain visible across searches and reloads. Web `npm run test:e2e` owns a disposable database/API/build, preserving the preview; backend `test:operations`, `recovery:local` and `files:maintenance` cover operational checks and local recovery. See the companion backend runbook and maintainer guide for exact file ownership, commands and provider limits.

## Connected experience and release handoff (R12)

The homepage now leads coaches and organizations into the appropriate workspace while retaining the immediate workout sample. Sample accounts are grouped by scope; Help explains admin/trainer/independent tasks. Conversation creation scrolls naturally, scheduling preserves selections through catalog searches and focuses each step, and optional setup stays behind disclosure. Current engineering coverage and release evidence distinguish local verification from hosting, physical-device and human outcome gates. Continue maintaining the companion implementation ledger, verification and maintainer guide with every change.

## Staff dashboard (R13)

The web now has a persistent staff sidebar and independently scrolling desktop workspace. Analytics uses Unovis charts with activity/delivery tabs, reporting presets and accessible data views; timezone editors use the shared full-catalog searchable picker. [ADR0009](docs/decisions/0009-dashboard-components.md) and the [dashboard audit](docs/implementation/dashboard-quality-audit.md) explain architecture, findings and acceptance. API/Prisma ownership and runtime boundaries are unchanged.

## Reference content and nutrition (R14)

Independent-coach Nutrition now puts daily calories/macros and a structured example day first. Trainees choose a sourced food, adjust a portion and explicitly log what they ate; suggestions never count as consumption. The starter library contains 15 USDA foods, with manual/custom entries and saved foods for other choices. Ten shared exercises have sharp vector reference positions in libraries, the program editor and training, with explicit play/pause and attribution.

Canonical content lives in the backend `content/` directory. Run backend `npm run content:media`, `npm run content` and `npm run content:check`; generated web media and manifests must not be hand-edited. Backend `test:catalog` verifies provenance, bytes and public API contracts. See the [content guide](docs/implementation/content.md), [ADR0010](docs/decisions/0010-reference-content-and-nutrition.md) and [research synthesis](docs/implementation/open-source-research.md). Organization nutrition now has its own membership-scoped plan and explicit diary-sharing lifecycle (R16). Native integration and hosting remain deferred.

## Organization nutrition (R16)

Open an organization role → Nutrition, or use Nutrition beside a trainee in People. Admins can prepare plans for the organization; trainers see their assigned trainees. Publish dated calorie/macro targets and example foods with optional expiry; earlier versions stay in history. Trainees record actual portions and explicitly choose whether to share the organization diary. Turning sharing off hides its entries/corrections from staff. Independent food records are never copied into it.

The local samples Rania (admin), Kareem (trainer/trainee) and Sara (trainee) are available at `/local-preview`. There is no seeded nutrition plan: choose Sara and create one through the real workflow. The API and migrations preserve existing preview records.

Source owners: backend `server/organization-nutrition.ts`, four `organization_*` nutrition tables, account export and three forward migrations; web `features/nutrition/OrganizationNutrition.vue`, `OrganizationMealFields.vue` and `organization-nutrition.css`. Shared food/macro/example-day controls remain in the same feature directory. Run backend `npm run test:organization-nutrition`; web browser checks run through the isolated `npm run test:e2e -- tests/organization-nutrition.e2e.ts` wrapper.

See [R16 scope and authority](docs/implementation/r16-contract.md), [ADR0012](docs/decisions/0012-organization-nutrition.md) and [verification](docs/implementation/verification.md). Native/offline diary synchronization, professional nutrition review and hosted delivery remain separate gates.

## Organization uploads (R18)

`organization_assets` reuses private local files and current membership checks for exercise demonstrations and conversation attachments. `npm start` applies the forward migrations to existing previews; no reset/seed is necessary. `npm run test:organization-assets` checks ownership, authorized snapshots, exact upload retry and private-pair media. See [ADR0013](docs/decisions/0013-organization-exercise-media.md) for authorization and maintenance contracts.
