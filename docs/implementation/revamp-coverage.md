# Current revamp coverage

Updated 23 September 2026. This is the current capability register. The original gap inventory and mistaken narrow-slice boundary remain in Git history and the [revival audit](../revival/README.md); the [role audit](role-scope-audit.md) records original-source evidence. Local implementation, hosted availability and commercial success are separate statuses.

## Product scope

| User job | Implemented replacement | Scope and remaining boundary |
|---|---|---|
| Enter with little setup | Public usable workout; verified-email invitation; preserved guest work; explicit workspace setup | Codes intercepted locally; real delivery/abuse operations await hosting |
| Independent coach manages daily work | Today attention queue, clients/context/notes, search/status, review and direct destinations | Coach-owned relationships; independent teams require explicit consent and do not merge private records |
| Organization manages its own people | Multiple admins, trainers/trainees and combined roles, intended-email invites, assignment/reassignment, active/inactive lifecycle | Separate organization ownership; original `is_staff` inconsistency replaced by server capability contexts; platform grant separate |
| Coach prepares training | Shared editor for cycles/rest days, per-set strength/timed/distance targets, grouping, effort, exercise library/custom definitions, alternatives, duplication, preview/publication | Independent and organization catalogs have separate authority. No generic builder or old runtime dependencies |
| Discover exercise technique | 1,384 shared source entries, body/equipment/type filters, bounded library and program pickers, 45 motion previews plus ten static reference sets | Requested-source English instructions imported in full; complete video/Arabic coverage and qualified technique review remain outstanding |
| Coach delivers or adapts | Reviewed recipients/schedule/current revision, atomic bounded batch, individual adaptation | Started prescriptions and published versions immutable; 50-recipient command limit |
| Trainee records and coach follows up | One durable workout queue, actuals/choices/previous performance, resume/offline/retry/conflict, completion/correction/feedback | Organization history survives responsible-trainer reassignment. Native UI remains deferred |
| Interpret training | Independent and org-trainer/admin analytics with reporting presets, named scope, activity/delivery tabs, Unovis plots, keyboard readouts and tables | No invented quality, health, revenue or historical adherence score. Current responsibility distinct from retained history |
| Independent ongoing services | Short typed check-ins/intake, reviewed responses, progress/measurements, calorie/macro targets, structured suggested meals and source-backed actual food records, appointment availability/booking | Organization nutrition is still missing and requires its own ownership/consent lifecycle; these independent records are not shared organization records |
| Organization calendar and assessment | Concrete reviewed series, groups, immutable definitions, explicit staff, per-trainee attendance/results, corrections/comparable history | Same-person cross-context collision protection. External calendar sync absent; no global ranking across incomparable tests |
| Communicate | Independent contextual messages/private attachments; organization participant channels/admin visible join; unread/read cursor, search/history and exact send recovery | Organization channels currently text-only; independent files remain governed by explicit relationship/team sharing |
| Optional notifications | Global scoped inbox, preferences/quiet hours, transactional intents, bounded/coalesced local delivery retries | Manual local dispatcher; no real email/push or claimed external delivery |
| Private resources and program recognition | Immutable private bytes and explicit sharing, private optional program cover, goal/level/duration/equipment metadata | One cover, no gallery/marketplace; hosted object store still required |
| Commercial/support/account operation | Independent coach/team entitlement state and ordered provider simulation; support/reopen/reply, export/deletion; separate audited platform user/org/support operation | No real charges/invoicing/marketplace payouts; organization billing product not silently invented. Platform does not browse private health/messages |
| Large-roster operation | Bounded people/recipients/history, selection persistence, summary totals, paged analytics and correction logs; measured index | New hot paths bounded; older read shapes retained for open clients. Local fixture ≠ production capacity |
| Operate a staff dashboard | Persistent role-aware sidebar, desktop main/collection scrolling, phone drawer, full-catalog timezone pickers and recoverable report refresh | Shared controls and scroll behavior covered in R13; human first-use outcomes remain unobserved |
| Maintain/recover | Prisma/PostgreSQL + one API + Vue, source-owned content, forward migrations, isolated browser acceptance, byte maintenance and disposable restore | Real hosted backup/monitoring, remote CI and old-open-client hosted rollout need environment validation |

## Deliberately deferred or retired

- Native mobile and health integrations remain last, after the web/backend readiness gate. No mobile rewrite has been slipped into this phase.
- Marketplace discovery/reviews/client acquisition, automated food estimation/AI, external calendar sync and social rankings need a separate useful-job/business decision. They are not marketed as implemented.
- Legacy transferable entitlement packs, cross-service trigger orchestration, mixed organization/independent ownership and unrelated old data migration are retired. Simpler interfaces do not mean dropping the supported training types, role boundaries or lifecycle recovery.
- Real notification/billing/mail/storage providers, public deployment, physical-device/assistive-technology acceptance, unaided human usability and retention/payment evidence remain unverified. No outreach or charging is authorized in this local task.

## Completion criteria and evidence

Every implemented row needs authority, data lifecycle, failure/retry, usable entry/detail/history and maintained ownership documentation. See the [feature verification map](feature-verification-map.md), [current verification](verification.md), [ledger](ledger.md), [release checklist](release-checklist.md) and [provider boundaries](provider-readiness.md). A screen, test count or successful demo alone does not establish the complete job or product success.

Current runtime: Vue 3/TypeScript, one Node API, Prisma/PostgreSQL, one durable workout queue, private local byte adapter. No Supabase runtime, retired project dependency, microservice reconstruction or legacy migration. Phase commits are on `codex/revamp`; no main push or hosting change.
