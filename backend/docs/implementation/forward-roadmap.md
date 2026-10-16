# Forward implementation roadmap after R6

Historical sequencing record. For current R21 scope and acceptance, use the [ledger](ledger.md), [gym-first register](r17-gym-direction.md) and [release gates](release-evidence.md). Later founder directions supersede this roadmap where they differ.

Owner: Codex. Reviewed 23 September 2026 against backend `7ae6691`, frontend `ff1f4ce`, current source and recorded R6 rendered evidence. R7, R7A1 API transition and R7A2 membership/context foundation have local checkpoints; R8 organization-owned programming/history has a local checkpoint; R9 organization services/analytics has a local checkpoint; R10 has a local checkpoint; R11 has a local checkpoint; R12 local refinement has passed final serial acceptance; real environment/device/human gates remain. The original review was documentation-only; subsequent R7 checks are recorded in the ledger and verification record.

This is the execution plan for subsequent work, with dependencies and acceptance gates. It supersedes the next-action ordering in historical phase notes. The [ledger](ledger.md) records implementation status; [architecture](architecture.md) describes what exists; [verification](verification.md) records actual evidence. The initial revival audit remains historical rationale, not a ceiling on the broader scope the user subsequently requested.

## Organizational scope correction — read first

The [original-role audit](role-scope-audit.md) found that R4 teams do not implement organizations with their own admins, trainers and trainees. [ADR 0005](../decisions/0005-organization-and-independent-scopes.md) inserts **R7A organization/identity ownership and the Prisma API transition before R8**. This order supersedes the earlier plan to delay the backend transition to R11. Preserve R7 daily-flow improvements, but do not treat its universal coaching/training selector as the final role model.

## Explicit analytics and program-discovery requests

The founder requested informative charts tailored separately to coaches and organization admins. R9 must include those distinct analytics, with transparent metric definitions, permission-safe aggregation, date filters and accessible table equivalents. Program imagery is a suggestion to evaluate, not a mandate for an image-heavy redesign: R8 should support program recognition and comparison through useful metadata and an optional cover with safe ownership/access and a no-image fallback. See the [coach workflow backlog](coach-workflow-backlog.md).

## Updated founder direction during R7

The web application primarily serves coaches and organizational staff. Preserve trainee web behavior; prioritize the subsequent work on coach programming, client oversight, calendar and organizational operations. Trainee-native design remains last. R9 is revised to emphasize the coach client workspace, structured service delivery and organization workflows, with the existing client web journey maintained as its counterpart.

The deployment target is now **Prisma + PostgreSQL behind one server API**, replacing Supabase. Its Auth/RPC/Storage dependencies must be replaced and locally verified before hosting; the transition now belongs to R7A before further organizational expansion. See [ADR 0004](../decisions/0004-coach-web-and-prisma-target.md) and the sequencing correction in ADR 0005. R7A1 now runs the standalone Prisma/PostgreSQL API locally; organization ownership is R7A2.

## Recorded assessment at the R6 planning checkpoint

The following assessment motivated R7–R12; it is historical, not the current capability register. Use [current coverage](revamp-coverage.md) and [release evidence](release-evidence.md) for completed work and remaining gates.

At this checkpoint, Rafik had a substantial local implementation: programming, scheduling, durable workout recording, review, progress, assessments/check-ins, messages, nutrition, appointments, private files, teams, handoff and support. These are backed by real local database commands and Storage. Commercial state is implemented, but collection/payment is simulated. Notifications and production delivery are missing. This is a working foundation, not a finished commercial product.

The strongest work is the data lifecycle: immutable published/started prescriptions, explicit ownership, transactional commands, recoverable drafts and idempotent retries. Preserve it. The runtime is one Vue application and one Prisma/PostgreSQL API. Neither a framework replacement nor a return to the old worker architecture is needed.

The weakest part is product cohesion. Features have mostly been delivered as separate pages with repeated headings, filters and forms. They can be individually correct while the combined task still requires too much attention, navigation and explanation. Passing layout/accessibility assertions establishes specific constraints, not ease of use or visual excellence.

### Findings and source evidence

| Finding | Evidence inspected | Implication / planned response |
|---|---|---|
| The shell exposes two role destinations plus six/seven workspace links. Phone wrapping consumes space and does not express a strong priority. | Web `src/App.vue`; R6 phone renders | R7: explicit, remembered workspace choice; a compact phone navigation with a few stable daily destinations and a clearly discoverable full menu. R7A must replace the universal selector with authorized contexts; an available destination is not a role grant. |
| Coach Today splits attention between aggregate statistics, check-ins/messages, appointments, workout review and a recurring starter-plan panel. | `src/features/coaching/CoachHome.vue`, `src/features/ongoing/CoachingActivity.vue` | R7: actionable overview with client identity, reason, recency and direct next action; first-use guidance becomes contextual. Retain separate specialist screens. |
| Client Today renders the full two-week cycle beneath the plan header; a resume banner is prioritized, but upcoming dates and today's decision still share the same list. | `src/features/training/TodayPage.vue` | R7: distinguish resume / today's available training / rest or future date, with schedule expansion. Flexible plans must retain genuine client choice. Never invent a prescribed next session. |
| A check-in review item shows its title and status without the client's name; many identically named weekly reflections are hard to distinguish. | `CoachingActivity.vue` request rows | R7: every coach task includes who, what and why; preserve the association when reviewing or replying. |
| Plan editing already supports advanced disclosure, preview and drafts, but exposes cycle mechanics, bilingual naming and session settings early. Publishing leads back to the roster, separating preparation from delivery. | `PlanEditor.vue`, `PrescriptionFields.vue` | R8: compact session-first editing, optional schedule/translation details, usable search, reuse and a direct reviewed assignment handoff. Preserve advanced programming. |
| Optional service and team pages spend substantial phone space on repeated headings and explanatory copy before the task. | R6 client service/team viewport renders; `MorePage.vue`, `TeamPage.vue` | R7/R9: compact working headers and contextual guidance. Keep richer brand presentation for public/first-use surfaces. |
| Many screens read every authorized row before filtering/slicing. The roster's 12 visible rows do not bound network/database work. | `src/lib/backend.ts` `rows()`; Today/CoachHome | R7/R8: task-specific reads, stable server pagination, selected columns, bounded aggregates; preserve complete history through pagination rather than silent caps. |
| Styling is concentrated in a 3,812-line global file; major pages also combine large state and template bodies. | `src/style.css`; `PlanEditor.vue` 566 lines; `ClientPage.vue` 507; `TeamPage.vue` 844 | Refactor touched areas into owned feature styles/components and small named operations. Size alone is not a defect; conflicting layout ownership and coupled changes are. Do not introduce a universal form/page engine. |
| Authored shared content is fourteen bilingual exercises and two starter sessions. That is a small starting catalog. | [Content reference](content.md) | R8: content coverage driven by supported programs/equipment, useful instruction and reviewed media provenance, not a large nominal exercise count. |
| Test-generated names and timestamps contaminate older sample-account content. Later suites clean their own accounts; not all earlier suites do. | User screenshots; R6 product renders and fixture history | R7: isolate automated identities from curated preview data, repair old test cleanup and provide an explicit targeted demo restoration command. Do not reset all local work to tidy a screenshot. |
| Notifications, actual billing, physical-device behavior and hosted operations remain unverified or absent. | [Release checklist](release-checklist.md), ledger | R10–R12: finish local contracts first, then validate the real release environment and user tasks. Never label local simulation as a delivered service. |

The inbox failure also exposed a process problem: stale horizontal-list CSS survived a vertical-layout change; a short single-contact fixture missed spacing and intrinsic-width problems; document-level overflow tests missed clipped internal content. R6 fixes and [quality rules](product-quality-review.md) address that specific miss. Future work must also evaluate task comprehension and effort. No finite test matrix establishes that every possible issue is absent.

## Product direction and intended experience

Keep the working positioning hypothesis: help coaches deliver a high-quality service to people they already coach, with immediate standalone sample value for a new client. Support independent practices and organizations as distinct scopes with their own role-appropriate tools. This is not proof that the segment will pay; it avoids promising leads that Rafik does not supply. No new market study or current competitor comparison was conducted in this review.

The product promise should become concrete in five moments:

1. **Arrival:** a client understands what is ready and why signing in is needed for private coaching. No profile questionnaire blocks the sample; private prescriptions remain private.
2. **Preparation:** a coach gets a client-ready plan from a starter or reusable plan, can inspect the exact client experience, and knows who will receive an update.
3. **Training:** one clear current exercise, readily available instruction and previous actuals, fast truthful recording, interruption recovery and visible progress through the session.
4. **Follow-up:** the coach sees the person and reason for attention, reviews the actual context and responds; the client finds that response attached to the relevant work.
5. **Return:** the next useful action and meaningful past progress are evident without completing an administrative routine.

Retain the accepted Rafik colors, type and bilingual character. Use restrained motion for feedback, consistent density and hierarchy, readable Arabic, and calm save/recovery states. Daily tools need compact working layouts; public and first-use pages can carry more expressive brand design. Cosmetic animation, card proliferation and mandatory tracking do not supply the missing reward.

## Sequenced implementation phases

### R7 — A coherent daily workspace (local checkpoint)

**Outcome:** clients immediately find training; coaches immediately find the next person/task needing attention. Navigating between related tools preserves context.

Deliver:

- A responsive application shell with remembered active workspace, accessible role switching, compact phone navigation and a discoverable secondary menu. Decide the exact phone arrangement using actual short-height and Arabic renders before applying it across routes. Hide no capability solely to make a screenshot cleaner.
- A client Today state model for new/unassigned, active/resumable, scheduled today, flexible choice, rest/future and completed states. Put the relevant action first; expand the full schedule on demand. Handle multiple coaching relationships explicitly.
- A coach attention view combining actionable reviews/check-ins/conversations, with client name, reason and age. Keep imminent appointments visible without burying reviews. Use explicit sort/filter rules, not opaque AI priority. Read-only browsing must not resolve tasks.
- A consistent client workspace with clear overview/training/follow-up destinations and contextual links into nutrition, appointments and files. Returning from a detail restores list filter, position and keyboard focus where applicable.
- Shared page-header, task-row, search/empty/error and back-navigation patterns where behavior is truly shared. Remove obsolete CSS while moving touched feature rules under clear ownership; preserve specific inbox scrolling behavior.
- Bounded dashboard/roster reads with accurate aggregates and stable paging. Isolated automated accounts plus curated realistic preview fixtures, including long names and large rosters.

**Architecture:** retain existing write commands. Use explicit read projections/functions as needed rather than a persisted generic task system that duplicates message/review state. Permission-filter each source before aggregating. Paginate deterministically with a tie-breaker; retain refresh behavior for concurrent changes. Do not solve read growth by truncating history.

**Completion:** demonstrate coach review → contextual reply → next task and client open → start/resume across empty/sparse/populated states. Primary actions remain reachable at 320×568, phone landscape, tablet and desktop, including enlarged text, RTL and both themes. Preserve old URLs/deep links or redirect them intentionally. Record before/after navigation and task steps; verify query bounds on a test-owned large roster. All current capabilities remain reachable.

### R7A — Correct organizational ownership and the Prisma API boundary (foundation implemented; records continue in R8/R9)

**Outcome:** independent users and each organization's admins/trainers/trainees have distinct data scopes, coherent daily views and a maintainable shared implementation.

- Implement the fixed identity/workspace/membership/role model in ADR 0005. Preserve multi-role users without duplicate accounts or a generic permission engine. Organization admins can manage the organization's staff, trainees, assignments and training operations; they are not platform administrators.
- Establish one Prisma/PostgreSQL server API with explicit authentication, transactional commands, bounded reads and private-file delivery. Port the existing meaningful command/failure scenarios in bounded domain slices. Replace Supabase Auth/RPC/Storage coupling locally; no production migration or hosting is required.
- Deliver organization invitations, membership/role lifecycle, internal trainer assignment/reassignment and staff departure. Retain organization-owned records and authorship; remove obsolete personal-handoff assumptions. Platform grants are separate.
- Replace the universal role switch with server-authorized contexts and role-specific navigation/defaults. Scope drafts, pending commands, files, search, analytics and notification links as well as database queries.
- Use two organizations plus an independent practice and combined-role identities in fixtures. Verify allowed and denied read/write/bulk operations, stale tabs, revoked roles, last-admin protection and preserved started history.

**Completion:** one active local backend at the completed transition, fresh-install and HTTP/browser acceptance, independent coaching regression coverage, and rendered organization-admin/trainer journeys. The full acceptance matrix is in the role audit. R7A establishes the foundation; organizational assessment/calendar and analytics features remain explicit R9 work.

### R8 — Fast, confident programming and usable content

**Outcome:** a coach can prepare and deliver a useful plan without learning database versioning or retyping repeated prescriptions.

Deliver:

- Independent and organizational catalogs with workspace ownership, distinct authorship/editor rights and explicit internal/public visibility. Optional cover imagery accompanies goal, level, duration, frequency and equipment; no-image states remain complete.
- Session/week outline with clear selection and compact editing; move optional translation, cycle details and advanced set targets out of the basic authoring path while keeping them discoverable.
- Exercise search with equipment/type cues and useful instruction previews; duplicate a session or week, apply a repeated target deliberately, and reorder with keyboard/touch controls as well as any pointer interaction. Preview bulk effects before committing them.
- A continuous draft → client preview → publish/assign flow. Show selected clients, effective schedule and consequences for future sessions. Never silently update everyone using an older version or rewrite a started workout.
- A client-specific adaptation path with clear ownership: a change for Amir must not alter another client's plan. Preserve shared-template copies as independent records.
- Starter coverage for the chosen beginner/returning-client workflows and supported equipment, including reviewed Arabic instructions, recording conventions and sensible approved alternatives. Maintain an exercise/content coverage inventory; media must be licensed/owned, useful and have text fallback. Decorative generated imagery is not exercise instruction.

**Architecture:** reuse immutable versions and assignments. Add bounded commands only for genuinely new atomic operations. Keep reusable plan transformations pure and tested separately from UI; retain stable field/exercise IDs and draft recovery. Use one canonical content source. A generic workflow engine or AI import dependency is unnecessary; a bounded structured import can be assessed separately if actual plan preparation warrants it.

**Completion:** author a representative three-day plan, duplicate/adapt a week, assign to selected clients, then update one client's future training. Verify unaffected clients and started sessions are unchanged, interrupted editing recovers, and mobile/keyboard operation does not require drag-and-drop. Use the speed target below as a design target, not an observed result.

### R9 — Coach services, organizational operations and meaningful analytics

**Outcome:** coaches can deliver a complete service and organization admins can run their own training operation, with distinct useful analytics. Existing trainee web journeys remain reliable; primary trainee expansion stays with the later native phase.

Deliver:

- Organization week/agenda calendar for staff, trainees and groups, including assignment, participant conflicts, attendance, recurrence/cancellation and linked assessments.
- Scheduled assessor-led assessments with explicit assessors/participants, per-trainee drill results, correction history and valid comparisons. Preserve client-response check-ins as a separate workflow.
- Independent-coach and organization-trainer analytics for their respective assigned clients; organization-admin analytics for enrollment, assignment gaps, trainer workload, participation, attendance and assessment trends. Define source, time window, timezone, denominators and exclusions; provide table equivalents and drill-through.
- Coach-centered client/service workspace, program adaptation and structured nutrition guidance/reuse. Admin catalog/roster oversight uses organization-owned records, not independent-client consent handoffs.
- Review the complete invited-client and guest-save paths: plan context, email mismatch/resend/expiry, return destination, first session and preserved guest work. Request additional information only when the task needs it.
- Refine workout instruction, current exercise/set focus, numeric entry, rest timing, approved alternatives and completion/correction. Previous performance is a reference or explicit copy action; never silently mark a target or old value as a completed actual.
- A useful completion summary and next-step state: what was recorded, what remains unsynced and any coach feedback. Progress explains units, sparse data and corrections; no fabricated improvement score or punitive streak.
- Short contextual follow-up paths: answer a check-in, reply about a session, open a shared file, book/change an appointment, and optionally repeat a saved meal. Preserve filters and the selected client when crossing tools. Avoid repeated coach/client selection when the context is already known.
- Consistent compact service/team headers, booking timezone explanations at the relevant decision, clear sharing audience, upload recovery and approachable no-data states. Organizational administration stays out of independent coaching navigation.

**Architecture:** keep workout persistence and sync invariants intact. Separate display-only summaries from stored actuals. Refactor repeated context selection/draft handling only where identical behavior has been demonstrated. No universal offline queue for every domain.

**Completion:** complete the distinct coach/admin analytics scenarios and an organization assessment/calendar lifecycle with multiple participants and different results, then perform a full session, interruption/reconnect, correction and coach-response loop; exercise each service lifecycle from the user's contextual entry point through confirmation and history. Keyboard opening must not obscure the edited field or primary action. Emulated checks are required locally; physical-browser keyboard/suspension acceptance is recorded separately in R11.

### R10 — Useful reminders and dependable communication

**Outcome:** people receive a small number of relevant prompts and can act directly, with understandable control over delivery.

Deliver:

- In-app delivery preferences with clear event categories, channel controls and timezone/quiet-hour behavior. Authentication messages are distinct from optional coaching reminders.
- Bounded events for new coach/client messages, relevant feedback, due check-ins and appointment changes/reminders; direct links land on the correct authorized context after sign-in.
- A local intercepted delivery path with explicit provider contract, deduplication, retry/backoff, suppression for obsolete/cancelled events and bounded retention. Coalesce repeated reminders appropriately; do not recreate the old form/message multiplication.
- Separate sent/failed/accepted-for-delivery state from read state. Avoid sensitive session/message detail in external notification previews by default.

**Architecture:** authoritative writes and their intended event records commit together. A small outbox plus a guarded local dispatcher provides the contract; message/workout persistence never depends on delivery success. Select one minimal hosted dispatch mechanism only when deploying, record its ADR and failure ownership, and add provider-specific acceptance. Avoid rebuilding a general worker platform. Mobile push is a later channel, not a prerequisite for the web contract.

**Completion:** with the local sink, prove duplicates/retries do not resend or multiply domain rows; opt-out, quiet hours/timezones, cancelled appointments, revoked relationships and stale due requests are respected. Verify correct return context after login. No actual external messages are sent during local implementation.

### R11 — Release readiness, performance and real service integration

**Outcome:** the product is maintainable, responsive with realistic history, and ready for controlled real use on a fresh environment.

Deliver locally first:

- Final role/capability audit across individual, coach and team tasks, including support, sharing, account export/deletion and ownership transfer. Resolve remaining rough or misleading states; remove test-only presentation from the release build.
- Test-owned scale fixtures and measurements of payload size, query count, load/interaction latency and long-list rendering. Replace remaining unbounded hot-path reads, add justified indexes and inspect query plans. Do not add caching or virtualization without measured need.
- Finish fixture isolation and clear current documentation: architecture, source map, command contracts, content workflow, support/recovery and reproducible acceptance. Rehearse one ordinary UI change and one domain change using only the maintainer guide.
- Provider interfaces and locally testable readiness for Auth email, delivery and billing. Commercial scope is the Rafik coach/team subscription already modeled; collecting a coach's client payments, marketplace payouts or invoicing is a separate product decision.

Release gates requiring actual environment/device access:

- Real iOS/Android browser touch, keyboard, suspension, offline/reconnect and screen-reader checks; zoom/reduced motion/Arabic review. Record device/OS/browser and failures, not just an emulation label.
- New PostgreSQL/API hosting and release asset configuration, production-owned starter content, actual identity/email delivery and rate limits, private object storage, backup/restore rehearsal, diagnostics and an old-open-client-compatible deploy/recovery procedure. Hosting remains deferred until authorized.
- Remote CI and hosted smoke checks. Real notification/billing adapters require separate end-to-end acceptance, including webhook ordering/retry, failure recovery, cancellation and entitlement clarity. Simulators do not qualify.

**Architecture:** retain one web application and the Prisma/PostgreSQL API completed in R7A. Verify the separate platform-operator surface for organization/user/support lifecycle with audited access. Add only the explicitly needed provider boundaries and minimal diagnostics. No retired project, legacy migration or native compatibility layer. Shared migrations must support the previous still-open web version under the R6 update policy.

**Completion:** a complete release evidence record with each gate passed or specifically outstanding, no hidden local-simulator dependency, and a rehearsed recovery path. The current instruction remains local-only: preparation does not authorize hosting, outbound delivery, charging or deployment. Physical-device gates cannot be satisfied by automated desktop WebKit.

### R12 — Observed usability, final refinement and sustainable operation

**Outcome:** refine the finished workflows against how representative people actually use them and establish whether the value is sufficient to retain and pay for.

- Use the [observation protocol](pilot.md) with goals, not narrated button instructions. Observe client, coach and optional team workflows, including Arabic-first users and people with low tolerance for setup. Fix and recheck discovered confusion before wider rollout.
- Record task completion, first useful action, unnecessary steps, assistance, wrong turns and recovered/lost work. Separate these from long-term use and payment evidence.
- Measure whether clients return for another real session and whether coaches save setup/review time. Examine onboarding/support minutes and provider costs alongside paid continuation. Keep synthetic/test activity out of every business metric.
- Refine the landing page, in-product explanation and eventual pricing against the delivered experience. Do not advertise client acquisition, real-time human support, external reminders or outcomes that are not supplied.
- Native planning begins only after web/backend readiness and a concrete benefit requiring it; share domain contracts and content, not the old runtime complexity. External calendar sync, automated food lookup, broad AI automation and marketplace functionality require distinct justification and contracts.

**Completion:** transparent observed results, outstanding issues with severity and owner, and a deliberate next investment decision. Recruiting participants is not a prerequisite for fixing known design problems or completing R7–R10. It is necessary evidence for claiming usability in human use or commercial success. Current authorization does not include sending outreach.

The phase descriptions above preserve the intended outcomes. Current implemented/local/deferred dispositions are in the coverage register and release evidence; real service or human evidence is not implied by a local checkpoint.

## Quality and simplicity gates for every phase

Use the existing [feature verification map](feature-verification-map.md) and [contribution rules](../../CONTRIBUTING.md). Add these concrete evaluation dimensions to each phase contract:

| Dimension | Acceptance method |
|---|---|
| Understandable | State the user goal and primary action before implementation. Inspect whether the populated screen communicates it without a tutorial. Record uncertainty rather than claiming a developer walkthrough proves intuitiveness. |
| Efficient | Record a fixed scenario's actions, page transitions and repeated entry before/after. Remove unnecessary actions while preserving meaningful choice and consent. |
| Visually resolved | Directly inspect viewport and full-page renders across meaningful states, widths, height, scripts and themes. Review density, hierarchy, truncation, row spacing, focus and action reachability; screenshots must be read, not merely generated. |
| Reliable | Test consequential lifecycle transitions, failure/retry, interruption and correction; preserve transaction/ownership invariants. Never equate a spinner disappearing with confirmed persistence. |
| Accessible | Semantic controls, focus/back behavior, keyboard alternatives, enlarged text, contrast, reduced motion and automated checks; real assistive-technology checks remain separate evidence. |
| Maintainable | A change has an obvious owner, bounded data access, explicit command semantics and synchronized docs. Extract components for shared behavior; do not introduce configuration frameworks to avoid small straightforward code. |
| Honest | Label proposed/implemented/observed/hosted separately. Keep actual limitations visible in help and release records. Test totals are not a UX score or guarantee. |

Proposed task targets for the observation script, **not measured results or industry benchmarks**:

- Returning client reaches today's available workout or resume action within two deliberate navigation actions after opening Rafik.
- A coach identifies and opens a specific client's pending review from Today in one action, with the relevant session/check-in already selected.
- A coach adapts an existing three-day starter and reaches a verified client-ready assignment in under five minutes, excluding email delivery and time spent deciding the training prescription. Record prior familiarity and assistance.
- A simple three-question check-in can be completed and confidently submitted in about a minute, excluding time needed to formulate a substantive answer.
- No lost entered work in the specified interruption/retry scenarios; no duplicate completion/send/assignment under the tested retry cases. This does not claim universal immunity to data loss.

If a target is missed, diagnose the cause and improve the flow; do not remove meaningful choices, consent or content simply to reduce clicks. Establish actual performance budgets from named device/network/fixture measurements during R7, then carry them forward. Do not invent a speed score from an unthrottled local machine.

## Delivery order and immediate work packet

Sequence: **R7 checkpoint → R7A roles/organization ownership + Prisma API → R8 → R9 → R10 → R11 → R12**. Device/accessibility observations can feed earlier phases when available. Each phase includes its own maintenance and full regression work; reliability is not postponed until R11. Human observations can improve any phase but do not block known local UX improvements.

The completed R7 checkpoint packet was bounded: (1) record baseline five-task flows and curated fixtures, (2) design/implement compact shell plus client Today, (3) implement the coach attention flow and contextual return navigation, (4) bounded reads and touched CSS cleanup, (5) render/interaction/regression evidence and synchronized docs. Use small reviewable commits on `codex/revamp`; do not push main, reset user work or change native/retired services. Prefer dependency-based milestones to unsupported calendar estimates.

The next packet is R7A from the source-grounded role audit. Do not resume the unshipped personal-only R8 delivery migration/component as if it implemented organization delivery.
