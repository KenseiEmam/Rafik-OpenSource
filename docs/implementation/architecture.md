# Current system architecture

R7A1 replaces the transitional backend with **one Node/TypeScript API, Prisma and PostgreSQL**. The Vue application retains its accepted interaction design and durable IndexedDB queue. [ADR 0006](../decisions/0006-prisma-api-transition.md) records the transition; [API conventions](../reference/api.md) and the [maintainer guide](maintainer-guide.md) specify its boundaries.

**Organizational correction:** [ADR 0005](../decisions/0005-organization-and-independent-scopes.md) defines the separate independent/organization scopes partly implemented in R7A2 membership/context/responsibility; organization-owned programming/history is implemented in R8; services/calendar/assessor-led results and analytics are implemented in R9. The R4 team overlay remains an independent-coach collaboration feature, not the required organization model. Read the [role audit](role-scope-audit.md) before changing ownership.

## Dashboard presentation

[ADR 0009](../decisions/0009-dashboard-components.md) describes owned Unovis chart and Reka UI control wrappers. `App.vue` selects a staff dashboard shell from authorized context; `DashboardNav.vue` owns grouped links, `dashboard.css` owns viewport/section scrolling, and the router restores main-workspace scroll on back navigation. `TimezonePicker.vue` supplies the complete browser IANA catalog everywhere a timezone is editable. `MetricChart.vue` owns interactive plots, keyboard readouts, bounded category pages and table equivalents; analytics transport and authority remain in the API. Public/trainee pages and focused workout behavior remain distinct. The [R13 audit](dashboard-quality-audit.md) records the earlier acceptance blind spots.

## System boundary

Vue calls the explicit HTTP API for identity, bounded commands/reads and private files. Prisma owns model generation/migration execution and database access. Existing domain transactions remain PostgreSQL functions, preserving tested snapshots, locking, RLS and replay semantics. Authentication uses Rafik-owned identity tables, hashed opaque sessions and HttpOnly cookies. Local code delivery uses an intercepted database inbox; no mail provider is connected.

The API database login cannot inherit broad domain permissions. Each domain transaction sets its fixed guest/user role and actor/claims locally; pooled connections cannot retain actor context. Function/table names come from a server-owned registry of explicitly granted contracts. Parameters are bound, reads are capped and operator-only functions are not registered. The browser never receives database or operator credentials.

Private bytes are behind the same API, with explicit metadata and permissions in PostgreSQL and a local filesystem adapter. Immutable upload, retirement, byte cleanup and metadata cleanup preserve recovery semantics. There is no Supabase Auth, REST/RPC gateway or Storage service in the runtime. Hosting requires different mail/file/configuration adapters and is deliberately blocked with local defaults.

Static assets/fonts belong to the web build. IndexedDB stores resumable workouts, exact pending commands, editor drafts and bounded diagnostics. The production worker caches static shell files only. There is no restored legacy worker, Firebase, AI service, payment provider or scheduled external notification system. Invitation links are shared by the person; saving a message does not claim delivery outside Rafik.

## Data model and ownership

| Record | Owner and meaning |
|---|---|
| `profiles` | Identity UUID, optional display name and locale/units/timezone preferences; one identity for either role |
| `exercises` | Shared source-controlled catalog plus coach-owned, revisioned private content; publication snapshots instructions/media links |
| `plans` | Coach-owned editable draft and monotonic draft revision |
| `plan_versions` | Immutable published prescription; public flag reserved for the starter fixture |
| `coach_clients` | Explicit relationship between two people; no organization hierarchy |
| `assignments` | One active plan assignment per relationship, pointing to a published version |
| `invitations` | Intended verified email, hashed random token, seven-day expiry, acceptance state and request identity |
| `sessions` | Client-owned occurrence and immutable day prescription snapshot, actual state, note and coach feedback |
| `set_entries` | Actual values and units, completed flag, bounded by the session's prescribed set identities |
| `session_operations` | Receipt for a stable save operation ID; same request replays the acknowledgment |
| `client_context` | Relationship-scoped goals/constraints/notes; only the owning coach can read/write; revision checked |
| `schedule_exceptions` | Move/skip overrides for an original assignment/day/date occurrence; no generated future sessions |
| `coaching_forms` | Coach-owned reusable title/purpose and 1–10 typed questions, revisioned on edit |
| `coaching_requests` | Assigned title/question/unit/revision snapshot, due date, answers, original submission/review timestamps; participant access |
| `measurements` | Client-owned weight/waist values, explicit units/date, optional sharing with one relationship, CAS revision |
| `messages` | Immutable participant text and optional verified workout/request/resource context; stable caller UUID and server sequence |
| `nutrition_guidance` | Immutable coach-authored effective-date targets/text per relationship and revision |
| `saved_foods` | Person-owned reusable portion/nutrient/source definitions; editable/retirable |
| `meal_entries` | Client-owned date/meal/quantity with nutrient/source snapshot and optional relationship visibility |
| `appointment_slots` | Coach-owned concrete UTC intervals, original local time/timezone, bounded series and availability state |
| `appointments` | Participant booking snapshots with revision, cancellation/rescheduling and attendance state |
| `resources` | Person-owned immutable file registration/path/type/size and pending/ready/retired lifecycle |
| `resource_shares` | Explicit permission from resource owner to a coaching relationship |
| `conversation_reads` | Current user's monotonic observed sequence per relationship; no public read receipts |

A flexible assignment occurrence is `(client, assignment, client-local date, prescribed day ID)`. A scheduled occurrence uses its original scheduled date, even when moved. The bounded schedule projection applies cycle offsets, assignment dates and explicit exceptions; the start command verifies that the occurrence is available on the client-local current date. Starting that same slot twice returns one session. Two different day slots can be performed on one day. Repeating the identical assigned slot twice on one date is not a separate supported occurrence. Public sample attempts use their own persistent start ID. Dates use the saved client timezone, detected from the browser on initial profile creation; the UI allows changing it in Settings. A missing display name defaults to the verified email local part and can be edited later, keeping new clients identifiable without adding a signup form.

Exercise instructions are catalog content; prescribed sets, reps, loads and notes are captured in the session snapshot. Published versions and started prescriptions are immutable. Actual entries include strength reps/load, seconds or metres, and optional reported effort. Target effort is not prefilled as an actual. Actual entries may be corrected after completion. A correction preserves the original completion time and does not trigger automatic progression.

## Command contract

Independent domain writes use explicit PostgreSQL functions; organization commands use explicit Prisma transactions. No trigger orchestrates another domain. R10 permits only transactional notification-intent capture, as specified in ADR 0007. Read policies provide only owned/related data or the public sample. Frontend command/table names are checked against generated database types; runtime JSON is validated by the database. Read helpers fetch stable pages so the server response cap does not silently omit older history.

| Command | Inputs / outcome | Retry and failure behavior |
|---|---|---|
| `ensure_profile` | Current verified identity, optional name/locale/timezone; returns profile | Creates once; no setup wizard |
| `update_profile` | Name, locale, units, IANA timezone | Validates timezone and bounded fields |
| `save_plan` | Stable plan UUID, draft, title, expected revision | Compare-and-swap; same acknowledged content can be replayed without another revision |
| `publish_plan` | Plan UUID, expected revision | One immutable version per draft revision; duplicate publication returns it |
| `create_invitation` | Intended email, owned version, random token, stable request UUID | Token hash only on server; request replay returns same record; payload mismatch rejected |
| `get_invitation` | Token | Public response contains coach context/status, no email or private prescription |
| `accept_invitation` | Token and verified current verified identity | Intended email checked; relationship, assignment and acceptance commit together; retry returns the same assignment |
| `revoke_invitation` | Owned pending invitation UUID | Stops future acceptance; does not send anything |
| `assign_plan` | Owned relationship and published version | Changes future starts; clears schedule exceptions; existing sessions keep snapshots |
| `save_client_context` / `set_client_state` | Owned relationship, bounded private text + expected revision / active or archived | Context replay/CAS; relationship lock serializes archive versus start |
| `save_exercise` / `set_exercise_active` | Stable ID, owned bounded content + revision / active flag | CAS and stable-create replay; retire without mutating snapshots |
| `configure_assignment` | Owned assignment, version, start/end, flexible/cycle, revision | CAS; clears exceptions on a changed schedule; no history regeneration |
| `assignment_schedule` / `change_scheduled_day` | Bounded date range / original day/date and target/state | At most 42 queried days and 41-day move; started occurrences cannot move |
| `previous_performance` | At most 48 exercise IDs (12 prescribed exercises plus three alternatives each) and session start cutoff | Most recent completed actual per exercise; caller-owned results only |
| `start_session` | Persistent attempt UUID, version, day, optional assignment | Server verifies access and selects the prescription; same assigned occurrence returns its canonical UUID |
| `save_session` | Session, expected version, stable operation UUID, full bounded entries, note, completion flag | Transactional validation, compare-and-swap, receipt replay; conflict keeps the device draft |
| `review_session` | Owned coached completed session, feedback | Stores feedback and reviewed time; does not alter client results or completion |
| `delete_my_account` | Current verified identity and literal confirmation | Deletes that identity and owned records; other clients retain their session snapshots with nullable coach/version references |

`session_document` reads one authorized session with its actual set entries. Tables are not an alternative write interface. Failures such as `conflict`, `wrong_email`, `plan_changed`, `invalid_entry` and `invitation_unavailable` map to contextual recovery copy.

## Ongoing coaching commands and lifecycle

| Command | Contract |
|---|---|
| `save_coaching_form` | Stable UUID + expected revision, title, purpose and bounded fields. Identical content retry returns the same record. Coach ownership is explicit. |
| `assign_coaching_form` | Stable series UUID, relationship, form/revision, first local due date, 1–12 occurrences and 7/14-day interval. Copies immutable questions/units into each request; same series/payload retries without duplication. |
| `save_coaching_response` | Client only, request UUID, complete answer object, expected revision and submit flag. Validates typed values and required fields at submission. Incomplete drafts are allowed. Corrections retain `submitted_at`, clear old review and increment revision. |
| `review_coaching_response` | Coach only, specific response revision and optional feedback. Stale review cannot silently approve a newer answer. |
| `cancel_coaching_request` | Coach, expected revision; only unsubmitted occurrences can be cancelled. Other occurrences remain independent. |
| `save_measurement` / `remove_measurement` | Client-only write, explicit weight/waist unit/date, expected revision. Personal by default or shared to one active relationship. A coach cannot author measurements as the client. |
| `send_message` | Caller UUID, participant relationship, 1–4,000 characters, optional session/request context belonging to that relationship. Identical payload replays; conflicting UUID reuse fails. |
| `mark_conversation_read` / `conversation_inbox` | Cursor can advance only to an existing sequence in the conversation; summaries count persisted incoming messages after that cursor. |
| `training_progress` | Self or authorized relationship, inclusive range of at most 366 calendar days. Completed sessions and completed actual sets only; no projection or target values. |

Question vocabulary is text (up to 2,000 characters), number (optional bounds and explicit unit) or boolean. One-off assignments use count 1; repeated assignments are explicitly bounded rows, not an automated recurring job. Due dates are calendar dates, displayed against the client's timezone. Requests have separate cancelled, draft, submitted, corrected and reviewed states. Assessments compare numeric results only within the same template ID and revision; labels/units from another revision never silently merge.

Archived relationships retain reads and existing-submission review, but prevent new response writes, assignments and sends. A client's already shared measurement remains readable in that archived relationship; the client can remove it or change sharing to personal. Deleting the relationship or a participant cascades these relationship-scoped records. Personal measurements survive deletion of a different coach. This differs deliberately from client-owned workout snapshots, which can outlive coach deletion.

The progress chart reports heaviest completed strength set in kg (converting lb), longest completed timed set in seconds, or farthest completed distance set in metres, with exact values and set/repetition counts below. Different result kinds are separate. Current schedule counts show six weeks under the **current** cycle configuration; they are not a historical adherence percentage after assignment edits. Flexible plans have no planned-session denominator.

Frontend `features/ongoing` uses the shared API/Auth/storage adapters. Form editor/response drafts are account-scoped. Assignment and message commands persist their stable payload before send; ambiguous acknowledgements can be retried after reload. Conversation reads fetch latest 50 with earlier-page loading, poll while visible every 20 seconds and refresh on focus. Today derives actionable items from persisted requests and unread counts. Optional notifications are captured separately; the local sink intercepts generic previews without sending email or push.

## Device persistence and synchronization

1. Typed values have local input state independent of server refreshes. Valid changes are committed in a serial IndexedDB transaction before “saved” is shown. Invalid fields block set completion.
2. Each record has local and acknowledged revisions. An unsent command stores a stable operation ID, expected server revision, and the exact payload before network transmission.
3. An acknowledged command updates only synchronization metadata, preserving edits made while the request was in flight. Web Locks serialize sync across tabs where supported. Receipt identity is checked before applying an acknowledgment.
4. Lost responses retry the same command. Reconnection and reopening a workout retry pending work. No background service is required to mutate workout data.
5. A stale server revision stops automatic writes. The user can download their draft or deliberately load the current server record; a local recovery copy is retained first.
6. The account ID namespaces local records. Switching accounts never adopts someone else's pending work. Guest adoption is a separate user action after sign-in.
7. Clean local records refresh from the server when reopened, including new coach feedback. A concurrent local edit prevents a delayed read from replacing it.

The browser must have successfully loaded the production shell once for a fully offline reload. Authenticated *new* sessions need the server to verify assignments. Already opened workouts can be recorded offline. Browser storage eviction/private-mode restrictions are not cloud backup; guest copy explains this distinction.

## Maintainability decisions

- Keep two repositories. No monorepo migration, generic form builder, schema-driven UI engine or repository/service abstraction tree.
- Feature folders match user tasks: public, account, training, coaching and ongoing coaching. Shared code handles Auth, persistence, synchronization, translation, types and API access.
- One bilingual `content/starter.json` in the backend generates seed and public sample. Do not edit generated copies. The shared catalog now has fourteen entries; coaches create private exercises through the application. Keep IDs stable and publish new instructions into new versions.
- CSS uses semantic light/dark tokens, logical properties for RTL, and named feature sections. Shared components stay few; `PageState` supplies common loading/error behavior.
- Schema-1 prescriptions remain readable. Schema 2 supports 1–12 cycle weeks and up to 84 unique day slots, twelve exercises per training day and ten sets per exercise. It adds rest days, typed strength/time/distance results, per-set targets, effort and consecutive group labels. New prescription fields require a documented schema/validation change and regression scenario.
- Runtime errors preserve work. Avoid swallowing failures that imply successful data persistence. Diagnostic events are bounded and local, without email or workout-note payloads.

## What is deliberately outside this build

Automatic spreadsheet import, external reminder delivery, real payment collection, external calendar synchronization and native applications remain outside the local runtime. Nutrition, booking, private file sharing, fixed-role teams and local commercial/support workflows are implemented. See the ledger for precise local verification and remaining release gates.

## Service delivery boundaries

Nutrition guidance is a prescription, and meal entries are actual records. They never share a mutable JSON document. Each meal copies explicit nutrient values, amount, basis, unit and source; changing a saved food leaves historical meals intact. Known totals sum `value × amount / basis` and retain a missing-value count. An empty day is not zero intake. Guidance versions are append-only, selected by effective date and revision. No medical or energy-needs calculation is implemented.

Availability is a concrete UTC interval with its originating IANA timezone and local timestamp. Recurrences are expanded transactionally for at most eight occurrences; no background scheduler or unbounded recurring rule. A nonexistent DST local time is rejected; repeated hours use standard time and are previewed. Booking and rescheduling lock the relationship plus both participant profiles in UUID order; a partial unique slot index is an additional guard. Conflict queries account for both roles. Cancellation reopens the slot. Attendance requires the coach and an ended appointment; it never creates a session or modifies training progress. See the R3 contract for command names/payloads.

Private bytes use the API filesystem adapter (the historical R3 Storage service was replaced in R7A1). Resource registration must precede upload. Its path is `owner UUID/resource UUID`; MIME and size are bounded. Upload authorization takes a share lock on the pending resource row for the Storage metadata transaction, preventing retirement from racing an already-authorized insertion. Finalization verifies size/type metadata before the resource becomes shareable. Updates/overwrites are not granted. Sharing is a separate idempotent relationship command, and attachments require a ready resource shared to that conversation.

Downloads use authenticated Storage requests with browser cache disabled, not signed URLs that remain usable after revocation. A revoked recipient loses future authorized downloads; previously downloaded bytes cannot be recalled. Removal marks the resource retired, calls the Storage API to remove bytes, then removes metadata only after the object record is absent. A partially completed removal stays visible for retry. Registration and account deletion lock the same profile; account deletion refuses while any owned resource remains. The Settings UI cleans resources before deleting the account. It also releases future booked slots when deleting a client. Do not bypass this lifecycle by deleting `file_store.objects` with SQL.

R3 has no upload worker, image transformation service, external food provider, calendar integration or delivery outbox. File bytes are not stored in IndexedDB; an interrupted upload may require the user to reselect the original file. Nutrition editors keep device drafts; calendar mutations keep the exact pending command. Only the workout flow promises offline recording. All new feature writes still require server acknowledgement.

## Optional teams, business state and support

The [R4 contract](r4-contract.md) is the ownership/interaction contract. Teams are an optional coordination layer over existing direct coaching relationships. They do not replace Auth identity or participant access. Ten coordination tables each have one purpose:

| Table | Responsibility |
|---|---|
| `teams` | Name, one owner, revision, closed flag; closed teams survive owner deletion with a null owner |
| `team_members` | Fixed admin/coach membership and active/removed state; owner derived from team record |
| `team_invitations` | Intended verified email, token hash, role, expiry and acceptance/revocation |
| `team_clients` | Client-approved roster enrollment, current direct relationship/coach, proposed coach, consent revision/last decision |
| `team_groups`, `team_group_members` | Named optional roster subsets; archiving removes membership links, preserves receipts |
| `team_plans` | Immutable published snapshots; import clones exercises and creates an independently owned draft |
| `team_resource_shares` | Explicit staff grant for person-owned ready files; distinct from client relationship sharing |
| `team_assignments` | Stable bulk-command receipt: actor, group, version and canonical selected enrollment IDs |
| `team_activity` | Small administrative event log; latest 30 entries shown to owners/admins |

`business_accounts` is uniquely personal or team-scoped; `business_events` stores provider receipts; `support_cases` stores submitted case content/state/reply. `runtime_settings` is internal, RLS-enabled and ungranted to browser roles. Its `local_simulation` defaults false in the migration and is enabled by local fixtures only. Initial trial (14 days, 10 staff/50 clients) is a testable local default, **not validated pricing or a production offer**.

### Commands and ownership

- `create_team`, `rename_team`, `close_team`, `invite_team_member`, `accept_team_invitation`, `revoke_team_invitation`, `change_team_member` implement lifecycle. Staff invite acceptance checks confirmed Auth email; replaying an old accepted invite does not restore a removed member. Only the owner appoints admins/transfers ownership. Owners/admins have a minimal administrative roster, not private coaching access.
- `propose_team_client`, `respond_team_client`, `request_team_handoff`, `close_team_client` implement consent. Responses bind to the exact proposed revision and decision; an old approval cannot approve a newer proposal. Handoff copies current plan/schedule, replaces any existing future assignment with the new coach, archives the old relationship and cancels its future booked appointments/unsubmitted requests. No private notes/messages/measurements/nutrition history copy occurs. Client training history remains client-owned. Clients may leave the team while retaining direct coaching.
- `save_team_group`, `archive_team_group`, `set_team_group_client`, `assign_team_group` manage groups. Bulk requests canonicalize/deduplicate 1–50 explicitly selected IDs, validate every target belongs to the group and acting coach, then run existing assignment commands atomically. Membership changes do not auto-assign a plan. Stable receipts prevent replay from resetting schedules a second time. Archived groups cannot accept new membership/assignments.
- `share_team_plan`, `remove_team_plan`, `import_team_plan` handle immutable library publication and independent copies. `plans.team_template_id` identifies an imported copy for retry. Private helper `copy_snapshot_plan` is not callable by browsers. Legacy starter versions receive missing exercise snapshots when shared; existing published snapshots are preserved. Copies own their cloned exercise definitions and remain editable/publishable after contributor departure/template removal.
- `share_team_resource` extends private Storage authorization through `can_read_resource`; client file access still requires R3 relationship sharing. `my_resource_teams` returns only grants for the current person's owned files, including after team departure, so owners can revoke those grants without rejoining. Removing a member ends future downloads; already downloaded bytes cannot be recalled.
- `team_workspace` returns scoped workspace JSON; `my_team_enrollments` returns the signed-in client's consent queue. They do not disclose other participants' health/coaching detail. Ordinary direct writes remain revoked; all new tables have scoped read policies or internal-only access.
- `open_business_account`, service-only `apply_business_event`, owner-only local `simulate_business_event` separate commercial state from training. Provider IDs bind to exact account/sequence/payload; duplicate receipts are harmless, lower sequences are recorded without rolling state back. A later provider adapter must verify its external signature and map events to a monotonic account sequence before calling the service-only command. No adapter/webhook or real checkout exists yet.
- `create_support_case`, `update_support_case`, service-only `operator_support_reply` manage one acknowledged response and case revision. Reporters can resolve/reopen; only explicitly selected team admins can reply through the app. Platform cases stay private to reporter/operator. This is intentionally a simple case record, not a ticket conversation engine.

Team mutations lock the team before enrollment/relationship/account rows; bulk relationships are visited in stable order. Admission counts run under the same team lock. Team account restrictions only gate new invitations/enrollments, shared publication and bulk assignment. Existing training, reading/importing existing team material, handoffs, closure/removal, export and support remain usable. Lower limits never evict existing members. Personal commercial state is observational in R4 and adds no solo paywall.

`account_deletion_ready` checks active ownership and assigned/proposed coaching before the UI deletes any file bytes. `delete_my_account` repeats that guard under team locks before existing profile/file checks. Closed-team ownership can become null; an active team cannot lose its owner. `start_session` now checks an existing authenticated client's stable start ID before current assignment availability, allowing lost-acknowledgement recovery after handoff/archive; changed day/version reuse conflicts. `save_session` and immutable prescription semantics are unchanged.

### Frontend boundary and recovery

`teams/commands.ts` persists one pending command under current account + screen scope; it does not introduce a general queue, background worker or global store. All team/business/support writes await acknowledgement. The pending payload remains available after reload for explicit retry; database-confirmed validation errors release it for correction. Invitation-link recovery occurs before clearing its pending command. Team workspace recovery stays visible even after membership or team access changes. Ordinary text/select edits require explicit save; support request text additionally survives reload. File operations retain R3 lifecycle recovery.

New routes: `/coach/teams`, `/coach/teams/:id`, `/teams`, public `/team-invite/:token`, `/coach/business`, `/coach/support`, `/support`. Team/account context uses `?team=<UUID>` where needed. These remain optional More tools. There is no new required onboarding field, organization-wide permission builder, external service or native dependency.

## Exercise choice and conversation interaction

Migration `202609230009_exercise_choices.sql` adds nullable `set_entries.exercise_id`. Historical rows default to the original exercise. The nullable choice intentionally has no catalog foreign key: the command validates it against the session snapshot, so retiring or deleting catalog content cannot rewrite historical identity. `PrescriptionExercise.alternatives` is an optional list of at most three accessible, active exercises matching the recording kind. Publication snapshots their info; actual choices never modify published/started prescriptions. Same-kind alternatives inherit targets; there is no automatic target conversion or recommendation.

`save_session` validates one approved choice per exercise across all its sets. The existing entries payload and receipt hash cover it, with no new command/queue. `performed_exercise` is a pure projection for previous-performance/progress; the equivalent small web projection drives logger/review labels. Shared-plan import and handoff clone both original and alternative exercise definitions into recipient ownership. Export includes entry choices and existing immutable snapshots. Old JSON/device operations without choices continue to work.

Messages uses a bounded history viewport, desktop inbox/thread and phone inbox/back flow. Foreground refresh merges immutable messages by ID; read cursors advance only at the viewed end. Optional attachments do not occupy the default composer. Check-in lists are filtered/paged in the presentation layer over the existing complete authorized read; this bounds rendered interaction, not database query volume. The client Today prioritizes training before optional coaching updates.

See [R5 contract](r5-contract.md), [quality review](product-quality-review.md), [contribution workflow](../../CONTRIBUTING.md) and [release checklist](release-checklist.md).

## Application release lifecycle

The production shell pins each controlled tab to one complete cached version. Cache identities hash bundle contents, HTML and the brand asset, rather than filenames alone. A new worker installs in the background and waits; it never forces activation or reload. Settings/Help expose update check, ready and failure states. Finish work, close all Rafik tabs and reopen to adopt the waiting release. IndexedDB and Auth storage are untouched. See [ADR 0003](../decisions/0003-application-updates.md).

`build/offline-shell.ts` owns worker generation; `src/app/updates.ts` owns only registration/update status; `AppUpdates.vue` renders that status in existing pages. No backend table/command or new runtime service is added. Keep future backend migrations compatible with older open clients.

Backend `scripts/verify-release.mjs` runs the local acceptance commands sequentially after `release-guard.mjs` checks the pinned runtime, branches, project identity and exact API target. Reports/logs stay in ignored `artifacts/release/`. It checks, but does not deploy/reset/push. Feature-state layout checks supplement domain/lifecycle tests; they do not certify hardware or human usability.

## Daily workspace projections (R7)

Migration 010 adds invoker/RLS-preserving `coach_attention`, `coach_roster` and `client_today` reads and two session indexes. No table or write command was added. Attention remains derived from authoritative message/review records; roster and attention use stable ordered server pages. See [R7 contract](r7-contract.md) for cursor/concurrency limits.

## Organization membership and business contexts (R7A2)

The [R7A2 contract](r7a2-contract.md) defines the implemented identity boundary. `workspaces`, `workspace_members`, `workspace_invitations`, `workspace_events` and `workspace_operations` are API-internal Prisma models. `platform_grants` is a separate capability source. Composite organization/member references prevent foreign trainer assignment. Membership roles are fixed arrays, not a configurable policy engine.

`server/workspaces.ts` centralizes live membership checks, exact receipts and serialized lifecycle commands. Organization reads/writes are explicit API routes, without generic table access or identity impersonation. Independent domain functions retain their participant/owner checks; enabling independent coaching is explicit. Organization program/session records are subsequent work rather than aliases of personal coaching relationships. Record authorship must stay separate from ownership when adding them.

Account deletion retains a deactivated, anonymized organization membership shell while deleting the person's identity. Last-admin and independent team/handoff guards run first, under the same lock order used by membership commands. Scoped membership export and broader organization record lifecycle continue with the subsequent feature phases.

## Organization programming and training (R8)

`server/programming.ts` owns organization catalog, program publication, reviewed delivery, workout persistence and review. `organization_*` records carry a workspace and member authorship/subject reference. They do not create an independent coaching relationship. Trainer reads/commands use current responsibility; operation replay runs resource authorization before returning an old receipt. Organization membership changes and commands serialize on the same workspace lock.

The shared PostgreSQL `validate_prescription_catalog` and `validate_session_actuals` functions hold prescription/actual bounds. Independent wrappers supply the actor's authorized catalog; the API supplies the organization/shared catalog. Organization publications embed instruction snapshots. `organization_sessions.document` uses the existing logger transport shape, while indexed membership/assignment/date/version columns provide ownership and concurrency. Completion corrections preserve first completion time; corrected organizational records require fresh review.

The web's `program-context.ts` supplies explicit adapters to the existing editor/library. `training.ts` keeps one IndexedDB queue and switches only the server transport for sessions with `workspace_id`. It never impersonates another identity. `DeliverPlan.vue` reviews the exact recipients and future schedule before an atomic command. Independent delivery uses `deliver_plan`; organizations use `/v1/workspaces/:id/delivery`. Both reject stale or invalid recipients as one unit.

## Organization calendar and results (R9)

API-only `organization_groups`/members, `assessment_templates`, `organization_events`/people, `assessment_results` and append-only `assessment_result_history` retain organization ownership. Group changes never rewrite scheduled people; template changes never rewrite a scheduled definition. An event grants listed assessors access to that event's participants; this does not grant access to their unrelated training or personal records. Trainees receive only their own results and attendance. Current membership is checked before receipt replay.

Scheduling uses bounded concrete occurrences and sorted profile locks shared with independent bookings; conflict errors disclose no other context. Attendance starts at the event start. Finishing requires every attendance decision and a result for each present assessment participant. Correction preserves separate participant revisions and audit history. A completed event no longer reserves future time; finishing records the staff decision that delivery has ended.

`server/analytics.ts` counts first completion once, uses viewer-local inclusive calendar windows, excludes cancelled attendance and distinguishes active current responsibility from retained history. Drill comparisons require identical snapshots/units. Charts expose tables; absence of data is explicit. Admin workload and program distribution are paged in 25-row continuations (R11). No retention, health or revenue claims are derived from these operational counts.

## Organization communication and notifications (R10)

`organization-communication.ts` owns explicit channels, participants/managers, immutable messages and monotonic observed cursors. Current workspace and channel access are checked before receipts. Admin discovery returns metadata only; reading requires a visible join. Removing a participant revokes access without deleting organization history. Lists use 25-row pages; message history uses 50. Read cursors are monotonic scoped writes without unbounded operation receipts.

`notifications.ts` owns per-person category preferences, authorized inbox links, reminder preparation and local dispatch. Intents commit with source changes via the narrowly defined capture triggers in [ADR 0007](../decisions/0007-notification-intents.md). Groups coalesce by increasing sequence; source cancellation/revision, answered requests, membership and preference changes are checked again before acceptance. Generic preview text excludes message/result content. Quiet hours use the profile timezone; identical start/end disables them. Five failed attempts become a visible terminal failure. Delivery acceptance and in-app read state remain distinct. Account export includes own preferences/intents and authored organization messages.

The dispatcher is a guarded manual local CLI, not a running scheduler or an external provider. Real outbound idempotency remains a deployment contract.

## Local operational boundary and large rosters (R11)

`server/platform.ts` rechecks a separate `platform_grants` entry for every directory read and operation, including retries. Platform identity state controls sign-in and session revocation; it does not change organization roles. Operational reads are audited, and state changes/support replies require an explicit reason, current revision and stable payload receipt. The restricted API cannot insert grants or delete audit entries. Platform support includes only platform-audience cases, not team cases. Operator/self suspension is prohibited. Organization closure uses the same organization lock as domain commands; reopening requires an active administrator. Platform users cannot use these routes to browse private workouts, messages or health records.

`server/people.ts` provides 25-row name search and separately resolves up to 100 selected membership IDs within the same current role scope. Recipients return assignment identifiers/revisions and titles, not whole prescriptions. Independent delivery similarly pages recipients under RLS. New web organization entry uses summary counts; people, pending invitations (25) and activity (30) have continuation. Organization session history returns 50 records and related names; analytics breakdowns return 25 rows at a time, while totals cover the full authorized roster. Event correction history loads 25 revisions per authorized trainee on demand. Legacy read shapes remain for old open clients, so this is not a claim that every old endpoint is a paginated query.

Migrations 300/310 add operational records and the measured `(workspace_id, active, name, id)` roster index. R11 uses a local fixture with 120 trainers and 1,200 trainees; its timings are development evidence, not a production SLA. Browser tests own a separate database/API/private-file directory. Recovery and cleanup scripts are explicit local operator commands. See [ADR 0008](../decisions/0008-local-operations-and-bounded-reads.md).

## Presentation cohesion (R12)

The coach/organization entry and role-specific Help use the existing server contexts and router sign-in continuation. No additional onboarding service or global state layer was added. Conversation creation uses natural page height while the thread retains its bounded scrolling. Scheduling's optional catalog/group controls preserve selected IDs, render resolved review names and focus the active step. New roster/report/operator reads ignore superseded responses; commands continue to validate current authority/revisions on the server.

## Reference content and nutrition lifecycle (R14)

[ADR0010](../decisions/0010-reference-content-and-nutrition.md) records the maintenance-time import boundary. `content/foods.json` and `content/exercise-media.json` are canonical public reference catalogs. `server/public-catalog.ts` serves catalogs and allowlisted, digest-verified SVG bytes; these routes do not query private records. The content generator mirrors the manifest/30 SVGs/credits into the web build. Only this bounded public pack enters the offline shell, never uploaded or person/organization content.

`exercises.media_ref` is an optional immutable reference key captured by publication/session snapshots and retained through plan copying. Replacing an asset requires a new key, with old bytes retained for history. Ten original shared starter IDs have an explicit first-pack fallback for older snapshots; this adds a viewer without mutating their stored prescriptions. External HTTPS demonstration links take precedence when deliberately supplied.

`nutrition_guidance.meals` is a validated bounded JSON array inside an immutable guidance revision. Existing six-argument callers remain compatible with the default empty seventh argument. Foods record nutrient basis, quantity, unit and source; published suggestions and meal entries preserve values independently of subsequent catalog/saved-food updates. The optional calculator allocates a coach-entered budget, never infers personal needs. Unknown nutrients remain unknown; source food calories are not recomputed from macros.

Web nutrition uses the existing persisted command mechanism, one pending exact request per actor/role. Draft keys additionally include relationship/visibility and (for actual meals) date. A pending response locks editing until resolved. Context changes restore only that context's draft. Independent nutrition relationship authorization is unchanged; organization nutrition is implemented separately in R16; those relationships are not repurposed.

Nutrition acknowledgement cleanup can finish after navigation, but its route/query updates are guarded by screen lifetime. Initial loads and draft-context selection use the same disposal boundary. The durable command receipt is still resolved; ignoring a stale screen does not mean abandoning the user’s acknowledged write.


## Exercise catalog, facets and motion (R15)

The shared PostgreSQL `exercises` catalog contains 1,384 source entries before owned additions. It is distinct from the small synthetic starter plan. `category`/`body_part` use ten controlled body-area values; `target_muscle` preserves source detail; `kind` is an explicit Rafik recording choice (including timed stretches and static holds). `source_ref` is immutable provenance, retained by publication and primary/alternative copies. Custom commands may edit facets but cannot assign or erase source attribution.

The requested dataset is MIT data/text with excluded third-party media. Wger text has per-record licenses and translated/editorial provenance; videos have separate CC BY-SA 4.0 attribution. `media_ref` resolves either the existing illustration manifest or the new motion manifest. Forty-five muted 640px H.264 clips and WebP posters are public, hashed assets with byte-range support. One ambiguous assisted-pull-up pairing is excluded. Their compact manifest/credits can be consumed by later mobile clients without a Vue-specific contract.

Library filtering covers the full authorized catalog; only 24 list rows or 40 picker results mount at once. Organization/shared reads preserve existing authorization scopes. The catalog is currently read in full (independent queries follow 500-row pages); this is a bounded ~1,400-entry reference corpus, not a server-side infinite search service. Motion loads on visibility, pauses out of view/background and is not in the precached offline shell. Written snapshots remain the offline fallback. See ADR0011 and the content guide for immutable update rules.

## Organization nutrition lifecycle (R16)

[ADR0012](../decisions/0012-organization-nutrition.md) defines organization ownership and diary consent. `organization_nutrition_plans` stores immutable member-scoped versions; `organization_nutrition_sharing` stores a trainee-controlled, revisioned audience choice; `organization_meals` stores current actual snapshots/tombstones and `organization_meal_history` preserves each correction/removal. Compound membership foreign keys enforce organization identity. Explicit API commands use the existing workspace lock/receipts, rechecking current responsibility before any replay.

Admin-only authorship is supported. Assigned trainers lose access upon reassignment, while membership-owned versions/history remain available to the successor. Only a trainee writes their diary or sharing choice. Staff reads require sharing on; private and withdrawn diary contents/history are omitted entirely, including removed entries. No personal/independent diary import, inferred nutrition requirement or automatic suggestion-to-actual conversion exists.

Plans select the latest effective date and revision as of the viewing date. Optional expiry hides that applicable plan without reviving an older version. Plans/history are bounded to ten versions, removed rows/history to ten, and live daily meals to200; authorized member search uses the existing25-row picker. The server-only `organization_member_today` helper projects the subject date without exposing profile rows. Subject export includes own current and historical nutrition across former memberships.

Web composition reuses food search, nutrient fields, macro allocation and example meals. Its dedicated context adapter never calls independent nutrition RPCs. Drafts bind actor/workspace/view/member/date; latest persisted write controls feedback. The shared durable command mechanism preserves exact pending writes, while page-lifetime guards prevent late callbacks from changing a destination. Three forward migrations extend the existing local database, without reset/reseeding.
