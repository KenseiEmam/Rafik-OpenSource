# Revamp coverage correction

22 September 2026. Execution owner: Codex. This document supersedes the earlier assumption that delivering the small training loop completes the Rafik revamp. The user likes the visual direction but correctly identifies that the implementation lacks much of the original product's capability.

**Implementation update:** R1 daily-coaching, R2 ongoing-coaching, R3 service-delivery and R4 team/business expansions are now implemented locally; see `ledger.md` for its exact scope and `verification.md` for evidence. The comparison below is the historical gap inventory that prompted this correction. R5 now implements the remaining exercise choices and integrated UX/documentation work; see its latest verification and release limits in the ledger.

## Status and mistake

The current application is a functioning, tested **foundation**, not the complete revamped product. Its server operations are real, but the small content set, narrow prescription model and missing coaching tools make the demonstration much narrower than Rafik. Local test success establishes correctness for implemented paths, not product completeness.

The earlier plan made a small first delivery the final product boundary. In particular, it incorrectly treated no legacy-data migration as a reason to omit useful capabilities, and made broad functional coverage conditional on customer acquisition. The user authorized simplifying architecture and interactions, not silently redefining the whole product as a basic workout logger.

Keep the new visual direction, Auth, explicit commands, versioned prescriptions and durable recording. Extend them deliberately. Do not restore legacy implementation, historical data, credits or trigger chains. Do not require the founder to recruit customers before completing missing product work.

## Evidence and limits

This comparison uses the frontend at baseline `a0c723e`, the existing four-repository audit and live-backend evidence, and the current router/domain/implementation records. Old components establish a feature surface, not proof that each old feature worked correctly or was commercially useful. The original audit records broken and incomplete paths. Before implementing each area, inspect its source and audit findings in detail and specify the useful job it replaces.

Relevant baseline evidence, accessible with `git show a0c723e:<path>` in the frontend:

- `src/router/index.ts`: client details, diet, programs, exercises, forms, calendar, assessments, groups, organizations, support and entitlements.
- `src/components/ProgramTabs/WorkoutPlanner.vue`: cycle/rest days, cardio/isometric handling, RPE and supersets/circuits. The current domain has only ordinary sets/reps/load/rest per exercise.
- `src/components/ClientTabs/`: client context, workouts, diet, meal plan, weight and trophies.
- `src/components/ExerciseTabs/`: custom exercise, equipment, alternatives, technique and program usage.
- `src/components/Calendar/`, `Chats/`, `Groups/` and `Template Modal/`; `src/stores/assessmentstores.ts`: booking, communication, groups and assessment surfaces.

## Coverage and replacement decisions

“Planned” below is work remaining, not implemented functionality. Scope is grouped by user jobs rather than old screen count. Optional means hidden until relevant to a coach/client, not necessarily excluded from the product.

| Capability | Current replacement | Corrected disposition and useful scope |
|---|---|---|
| Authentication and first value | Implemented locally; test email only | Keep low-friction entry and guest preservation; complete hosted delivery separately |
| Coach dashboard | Basic counters and session review queue | Expand into actionable work: due reviews/check-ins, upcoming work, missing assignments and unanswered communication, each backed by actual data |
| Client management | List, invitations, assignment changes | Planned client workspace: overview, goals/context, current plan, history/progress, notes, search/filter and relationship archive/reactivation |
| Exercise library | Eight source-controlled exercises | Planned usable searchable library, equipment/movement filters, coach-created exercises, instructions/media, alternatives and safe retirement; preserve historical snapshots |
| Program builder | Basic reusable days, duplicate/edit/publish | Planned cycles/weeks/rest days, exercise ordering, per-set targets, timed/distance work, supersets/circuits, relevant effort controls, client-specific adaptation and preview of affected future sessions |
| Assignment and scheduling | Published version assigned; day choice | Planned start/end/cycle rules, scheduled versus flexible days, rescheduling/skipping and explicit future revision effects; avoid pre-generating thousands of records |
| Workout recording | Durable ordinary strength sets | Extend existing durability to every supported prescription type, substitutions and previous performance; retain deliberate correction and immutable history |
| Progress | Session list and individual results | Planned explainable exercise trends, planned/completed adherence, optional weight/measurements, date filters and coach/client views; no invented global performance score |
| Check-ins and forms | Session note only | Planned short configurable check-ins and intake when relevant, drafts, due/submitted/reviewed states, bounded recurrence and immutable submitted-question snapshots |
| Assessments | Absent | Planned reusable assessment definitions, typed results/units, scheduled assessment, review and comparable historical results; no automatic ranking across incompatible tests |
| Direct communication | One note/reply per workout | Planned persistent coach-client conversation with contextual links, unread state, send/retry and appropriate attachments; contextual feedback remains useful alongside it |
| Nutrition | Absent | Planned optional coach-set targets, meal guidance, manual food/meal recording, reusable entries and client/coach summaries; basic use must not depend on food AI or a provider chain |
| Calendar and booking | Absent | Planned availability, booking, cancellation/reschedule and timezone handling; distinguish appointment attendance from workout completion |
| Teams/organizations/groups | Absent | Planned optional team layer: memberships, fixed roles, coach assignment, groups and shared resources. A solo coach gets no organization setup wizard |
| Files and resources | Absent | Planned private resource/media attachments in the task that uses them; clear ownership, access, size and lifecycle rules |
| Notifications | In-app session feedback only | Planned in-app activity and preferences; local test delivery for event notifications. External delivery belongs behind a replaceable provider adapter |
| Commercial/account administration | Account settings/export/deletion; no billing | Design simple subscription/access states and operational support; build local provider simulations before any paid integration. Retire transferable entitlement packs |
| Marketplace/public reviews | Absent | Unresolved business-model decision, explicitly outside the first complete coaching workflow; do not promise coach leads. Must be revisited explicitly, not mistaken for shipped functionality |
| AI chat/food estimation | Absent | Deferred integrations, not prerequisites for nutrition or coach communication; justify a specific task, quality checks and costs before implementation |
| Trophies/rankings | Absent | Replace default emphasis with personal progress; social competition remains an explicit product decision, not a backend side effect |
| Support | Help, local diagnostics, export/deletion | Expand needed operator recovery/support paths without building a separate ticketing platform by default |
| Native app/health integrations | Untouched | Still deferred by explicit user instruction until the broader web/backend is ready |

## Architecture before broader implementation

The foundation's original ten-table schema is not a constraint on the final product. Fewer tables do not necessarily mean easier maintenance. Add domain records where they make ownership and lifecycle explicit; do not squeeze nutrition, chat and assessments into session JSON or one generic event/entity table.

Keep one web application and one Supabase backend. Organize code around coaching/clients, training/programming, progress/check-ins, communication, nutrition, scheduling and optional team administration. These are modules, not microservices. Add server-side provider code only when a concrete feature requires privileged integration.

Resolve these cross-feature contracts before adding screens:

1. **Identity and access:** one person identity; direct coach-client relationships remain valid. Optional teams have fixed owner/admin/coach permissions, explicit client access and resource ownership. Team membership must not automatically expose all private client data. No generic permission builder.
2. **Prescriptions:** define a versioned discriminated model for strength, timed and distance work, set targets, groups and schedule rules. Preserve the current snapshot/retry guarantees. Old locally created sessions remain readable through a small version parser; legacy production migration remains unnecessary.
3. **Scheduling:** local calendar dates, timezone, recurrence and exceptions have explicit meanings. Booking, planned training and completed work are distinct records. Compute future occurrences within a requested date window; do not regenerate future history on edits.
4. **Progress:** derive from acknowledged records with documented units and denominators. Missing, skipped, rest and completed are different. Corrections recompute affected summaries without emitting a second completion.
5. **Check-ins/assessments:** definitions are versioned; submissions snapshot questions and units. Completion/review is explicit. Start with a small field vocabulary, not nested conditional form programming.
6. **Communication and delivery:** message persistence is independent of notification delivery. Provider retries cannot duplicate messages or roll back a workout. Add a bounded outbox when delivery is implemented; keep local effects intercepted.
7. **Files:** introduce private storage with domain-linked metadata and scoped authenticated access (R3 uses authenticated downloads to enforce revocation), not public user uploads. A media outage must not prevent text instructions or recording.
8. **Nutrition:** explicit portions and units, provenance for nutrition values, manual correction and separate plan/actual data. External lookup is an adapter rather than the owner of the meal log.
9. **Billing:** commercial subscription state stays separate from training history; payment callbacks are idempotent and cannot rewrite assignments or session outcomes. Model/test locally; no real charge or outbound action during this phase.

Write exact schema, command payloads, errors, invariants and interaction states for each implementation wave before coding it. Generate types and update the architecture record after implementation. Avoid adding speculative tables for every future capability in one giant migration.

## Execution sequence for Codex

| Wave | Deliverable | Completion evidence |
|---|---|---|
| R0 — Correct scope | This coverage register and truthful project status | Every original feature family has a disposition; deferred features cannot disappear from the ledger |
| R1 — Complete daily coaching | Client detail workspace, roster lifecycle, exercise library/custom content, richer programming, assignment schedule and prior performance | Coach creates a realistic multiweek plan with custom/timed/grouped exercises, assigns two different clients, adapts future work and reviews results; client can train without the coach editing SQL/content files |
| R2 — Ongoing coaching (implemented locally) | Progress, check-ins, assessments, direct communication and contextual activity | Client submits/revises relevant data, coach reviews/responds, both can find history and understand next steps; retry/correction/access tests cover each lifecycle |
| R3 — Broader service delivery (implemented locally) | Optional nutrition, calendar/booking and resources | Real local data flows for planning, logging, booking/rescheduling and resource access; optional features do not add required signup fields or overwhelm Today |
| R4 — Team and business operations (implemented locally) | Team roles/groups, shared plans/client assignment, simple commercial/support states | Solo flow remains simple; team role changes and reassignment preserve ownership/history; provider behavior verified through local simulations |
| R5 — Integrated product readiness | Whole-product navigation, content, accessibility, lifecycle/permission/failure coverage, release runbook | Complete recurring coach/client/team tasks using fresh accounts, not only seeded happy paths; no advertised destination is an empty placeholder |
| Later release/native | New hosted backend, controlled real delivery/device checks, then native decision | Existing local-only/mobile constraints remain; no remote readiness claims from local tests |

Each wave includes backend, UI, real local persistence, recovery, English/Arabic, phone/desktop and maintainable update instructions. A set of attractive destination screens does not complete a wave. Retain the approved visual direction and apply the requested design skills when designing the expanded product; do not restart branding to avoid functional work.

## Definition of completion

The revamp is complete only when the documented retained product capabilities work together across recurring use: prepare and adapt coaching, manage clients, deliver and review training, communicate, track progress, use optional service tools and administer access. Every exclusion has a recorded rationale and visible status. A marketplace or AI recommendation must not silently become an implementation requirement or silently disappear.

Commercial success still requires evidence from real use, and not all original ideas deserve restoration. That uncertainty does not justify calling a basic slice the entire revamp. Tests for the current foundation stay valid within their recorded scope; broader product completeness remains open.

**Current implementation action:** accept the R5 local regression/quality checkpoint recorded in the ledger, then address the release checklist's device/hosted operational gates and any findings from observed tasks. Exercise alternatives/client substitutions are implemented through immutable approved options, durable actual choices, review/progress and shared-plan/handoff copying. R1–R5 contracts and concrete verification remain authoritative for implemented behavior. External delivery/payment/calendar adapters and native work remain separate later gates. Preserve the accepted visual identity and local-only constraints; no old-data restoration or production mutation is required.
