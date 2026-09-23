# Feature verification map

This maps the implemented user jobs to executable checks. It is a coverage index, not a claim that every possible combination has been exercised. Concrete run results belong in [verification](verification.md).

| User job | Behavior and recovery checked | Primary evidence source in web / backend |
|---|---|---|
| Entry and account | Guest value, email-code invitation/acceptance, guest adoption, profile/data ownership; export/deletion and owned file cleanup | `core.e2e.ts`, core SQL, service/team HTTP suites |
| Training | Strength/timed/distance/group actuals, save/reload, offline/reconnect, dropped acknowledgement, concurrent edit conflict, completion/correction and immutable history | `core.e2e.ts`, `daily-coaching.e2e.ts`, `product-quality.e2e.ts`, core/daily/choice SQL |
| Programming and clients | Draft recovery, publish/preview, custom exercise, mixed cycle, assignment/archive/reactivation, private context and approved alternatives | `daily-coaching.e2e.ts`, `product-quality.e2e.ts`, daily/choice SQL |
| Roster and plan navigation | Whole-list search, status filtering, bounded visible records; long native option text in WebKit | `responsive-inbox.e2e.ts`, broad route audit; R6 observed 12→24→search→12 roster flow |
| Progress and measurements | Completed actual identity, units, date filtering, correction, personal/shared visibility | `ongoing.e2e.ts`, `product-quality.e2e.ts`, ongoing/choice SQL |
| Forms and assessments | Versioned definition, assignment, typed drafts, submission/review/correction, compatible comparisons, lost-acknowledgement retry, large request navigation | `ongoing.e2e.ts`, `product-quality.e2e.ts`, ongoing SQL |
| Conversation | Inbox/list/detail/back/search/no-match, long names/history, independent scrolling, composing/focus, unread cursor, context permissions, pending send and exact retries | `responsive-inbox.e2e.ts`, `product-quality.e2e.ts`, `ongoing.e2e.ts`, ongoing SQL |
| Nutrition | Guidance snapshots, saved food and meal actuals, correction/visibility | `service-delivery.e2e.ts`, service SQL |
| Appointments | Timezone availability, booking/reschedule/cancel, ambiguous acknowledgement, concurrent/cross-role collision, attendance rules | `service-delivery.e2e.ts`, service SQL and real HTTP suite |
| Files | Real bytes, upload/finalize recovery, explicit sharing, conversation context, revocation, deletion and account cleanup | `service-delivery.e2e.ts`, service/team HTTP suites, service SQL |
| Teams | Staff invitation/roles, client consent, groups/shared material, independently copied handoff, access after departure and deletion preflight | `teams.e2e.ts`, populated team-tab layout matrix, team HTTP/SQL suites |
| Organizations and contexts | Separate organizations, combined roles, verified invitation/revocation, current trainer responsibility, last-admin/concurrent departure guards, preserved membership after deletion, scoped drafts and exact retry | `organizations.e2e.ts`, `tests/workspaces.test.ts`; owned programs/history now covered by `programming.e2e.ts` and `tests/programming.test.ts`; services follow |
| Organization programming/media | Scoped publication, session/week reuse, private cover retry/access, reviewed atomic delivery, lost ACK/reload, trainee actuals, previous performance, correction and reassignment | `programming.e2e.ts`, `program-structure.test.ts`, `tests/programming.test.ts`, `tests/program-media.test.ts`, `scripts/audit-programming.ts` |
| Business and support | Local entitlement state/order/retry, owner simulation, private/team support, response/reopen and draft recovery | `teams.e2e.ts`, team HTTP/SQL suites; no real payment/delivery claim |
| Application updates | Failed install, waiting release with two tabs, old-version navigation, retained workout on activation/offline reload; final built-file/HTML-only cache identity | `app-updates.e2e.ts`, `offline-shell.test.ts`, `scripts/check-shell-build.mjs` |
| Shared shell and accessibility | Phone/desktop, short height/landscape/resizing, both engines, English/Arabic, light/dark, document and internal overflow, labels/focus/Axe | `layout-contract.ts`, `audit-product.ts`, quality/team matrices and journey tests |
| Developer operation | Wrong project/remote/main/runtime rejection, non-destructive fresh database, serial acceptance logs and current doc links | `release-guard.test.mjs`, `verify-release.mjs`, `check-docs.mjs` |

## Required review practice

Inspect the entry/list state and the selected/detail state separately. Use more than one record, long labels, optional controls and no-match/error cases. Measure nested scroll containers, control containment and row spacing. Wait for data loading to finish before measuring. Review both viewport captures and full-page context; full-page images alone can make tall broken layouts appear harmless when scaled down.

The broad matrix uses current synthetic preview records; isolated scenario tests supply deterministic fresh fixtures for sensitive state/retry contracts. Some older lifecycle tests leave synthetic sample-account records for inspection; do not depend on their presence or delete the user's preview to conceal layout failures. Each new fixture should clean up only its own records.

## Remaining boundaries

No matrix establishes every possible record count, translation, device size, keyboard state or race. Phone-sized WebKit is not a physical iPhone. Physical keyboard/touch/suspension, assistive technology, hosted email/Storage/backup/CDN behavior, remote CI, actual notification/calendar/payment providers and human task success/retention remain separate gates. In-app Today activity is implemented; notification preferences and local delivery/outbox are not yet implemented. Marketplace/AI/rankings/native remain explicitly deferred decisions.

## Organization services (R9)

| User task | Evidence | Remaining evidence |
|---|---|---|
| Admin schedules a reviewed group assessment; designated assessor records separate trainee values and correction | `tests/organization-services.test.ts`, web `tests/organization-services.e2e.ts` | Physical keyboard/touch and unaided human task observation |
| Trainer reassignment changes roster analytics/history access while an event-specific assessor grant stays narrow | HTTP reassignment/revocation/export assertions | Hosted environment acceptance |
| Admin and independent/organization coach interpret real operational diagrams | Report filters/definitions, chart tables, browser role checks and 104-state service audit | Real workload scale/retention evidence, R11 pagination |

Rendered chart label readability was checked after the automated matrix; see product quality review.
