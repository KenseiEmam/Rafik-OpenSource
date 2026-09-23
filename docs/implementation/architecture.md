# Implemented architecture

Local revamp, 23 September 2026. This record describes the new implementation; `docs/revival` preserves the audit and rationale. It is not a compatibility plan for the retired backend.

**Scope correction:** this describes the implemented foundation, not the final product architecture or feature ceiling. [Revamp coverage](revamp-coverage.md) governs the broader remaining work and identifies contracts to resolve before extending the schema. The original ten-table count is not a design constraint; R1 adds `client_context` and `schedule_exceptions`. R2 adds five ongoing-coaching tables, bringing the public domain to seventeen. R3 adds seven nutrition/appointment/resource tables, for 24 total. R4 adds thirteen team/commercial/support domain tables plus one internal runtime-setting table: 37 domain tables, 38 public tables overall. See `r1-contract.md`, `r2-contract.md` `r3-contract.md` and `r4-contract.md` for the phase invariants, and [maintainer guide](maintainer-guide.md) for the file map and change recipes.

## System boundary

One Vue application communicates with one Supabase project: Auth, Postgres, PostgREST and private Storage. Static assets and self-hosted fonts belong to the web build. IndexedDB stores resumable workout records, pending commands, recoverable editor drafts and a bounded local diagnostic log. A small production service worker caches application code and public assets for reloads during a workout; it never caches API responses or access tokens.

There is no Edge Function, worker, Firebase dependency, external analytics service, AI service, billing service, or scheduled notification system in the new runtime. Mail is intercepted locally by Mailpit. Coaches share invitation links using their existing channel. Contextual feedback appears with the session and on Today; the UI does not claim it sent a notification.

## Data model and ownership

| Record | Owner and meaning |
|---|---|
| `profiles` | Auth UUID, optional display name and locale/units/timezone preferences; one identity for either role |
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

All ordinary writes go through explicit Postgres functions; no trigger orchestrates another feature. Read policies provide only owned/related data or the public sample. Frontend command/table names are checked against generated database types; runtime JSON is validated by the database. Read helpers fetch stable pages so the server response cap does not silently omit older history.

| Command | Inputs / outcome | Retry and failure behavior |
|---|---|---|
| `ensure_profile` | Current Auth identity, optional name/locale/timezone; returns profile | Creates once; no setup wizard |
| `update_profile` | Name, locale, units, IANA timezone | Validates timezone and bounded fields |
| `save_plan` | Stable plan UUID, draft, title, expected revision | Compare-and-swap; same acknowledged content can be replayed without another revision |
| `publish_plan` | Plan UUID, expected revision | One immutable version per draft revision; duplicate publication returns it |
| `create_invitation` | Intended email, owned version, random token, stable request UUID | Token hash only on server; request replay returns same record; payload mismatch rejected |
| `get_invitation` | Token | Public response contains coach context/status, no email or private prescription |
| `accept_invitation` | Token and verified current Auth identity | Intended email checked; relationship, assignment and acceptance commit together; retry returns the same assignment |
| `revoke_invitation` | Owned pending invitation UUID | Stops future acceptance; does not send anything |
| `assign_plan` | Owned relationship and published version | Changes future starts; clears schedule exceptions; existing sessions keep snapshots |
| `save_client_context` / `set_client_state` | Owned relationship, bounded private text + expected revision / active or archived | Context replay/CAS; relationship lock serializes archive versus start |
| `save_exercise` / `set_exercise_active` | Stable ID, owned bounded content + revision / active flag | CAS and stable-create replay; retire without mutating snapshots |
| `configure_assignment` | Owned assignment, version, start/end, flexible/cycle, revision | CAS; clears exceptions on a changed schedule; no history regeneration |
| `assignment_schedule` / `change_scheduled_day` | Bounded date range / original day/date and target/state | At most 42 queried days and 41-day move; started occurrences cannot move |
| `previous_performance` | At most twelve exercise IDs and session start cutoff | Most recent completed actual per exercise; caller-owned results only |
| `start_session` | Persistent attempt UUID, version, day, optional assignment | Server verifies access and selects the prescription; same assigned occurrence returns its canonical UUID |
| `save_session` | Session, expected version, stable operation UUID, full bounded entries, note, completion flag | Transactional validation, compare-and-swap, receipt replay; conflict keeps the device draft |
| `review_session` | Owned coached completed session, feedback | Stores feedback and reviewed time; does not alter client results or completion |
| `delete_my_account` | Current Auth identity and literal confirmation | Deletes that identity and owned records; other clients retain their session snapshots with nullable coach/version references |

`session_document` reads one authorized session with its actual set entries. Tables are not an alternative write interface. Failures such as `conflict`, `wrong_email`, `plan_changed`, `invalid_entry` and `invitation_unavailable` map to contextual recovery copy.

## R2 commands and lifecycle

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

Frontend `features/ongoing` uses the shared API/Auth/storage adapters. Form editor/response drafts are account-scoped. Assignment and message commands persist their stable payload before send; ambiguous acknowledgements can be retried after reload. Conversation reads fetch latest 50 with earlier-page loading, poll while visible every 20 seconds and refresh on focus. Today derives actionable items from persisted requests and unread counts. No message is emailed or pushed.

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

There is currently no automatic spreadsheet import, external reminder delivery, nutrition, appointment booking, file attachments, billing subscription, organization administration, or native application. Direct text conversations, progress and check-ins/assessments are implemented locally in R2. The starter and duplicate/edit workflow cover initial plan preparation only. Manual conversion of a coach's current plan is a pilot service to measure, not a hidden import feature. These describe current gaps; the corrected coverage register governs remaining web/backend scope. Native work remains deferred by user instruction.

## R3 service delivery boundaries

Nutrition guidance is a prescription, and meal entries are actual records. They never share a mutable JSON document. Each meal copies explicit nutrient values, amount, basis, unit and source; changing a saved food leaves historical meals intact. Known totals sum `value × amount / basis` and retain a missing-value count. An empty day is not zero intake. Guidance versions are append-only, selected by effective date and revision. No medical or energy-needs calculation is implemented.

Availability is a concrete UTC interval with its originating IANA timezone and local timestamp. Recurrences are expanded transactionally for at most eight occurrences; no background scheduler or unbounded recurring rule. A nonexistent DST local time is rejected; repeated hours use standard time and are previewed. Booking and rescheduling lock the relationship plus both participant profiles in UUID order; a partial unique slot index is an additional guard. Conflict queries account for both roles. Cancellation reopens the slot. Attendance requires the coach and an ended appointment; it never creates a session or modifies training progress. See the R3 contract for command names/payloads.

Private Storage is the one new service. Resource registration must precede upload. Its path is `owner UUID/resource UUID`; MIME and size are bounded. Upload authorization takes a share lock on the pending resource row for the Storage metadata transaction, preventing retirement from racing an already-authorized insertion. Finalization verifies size/type metadata before the resource becomes shareable. Updates/overwrites are not granted. Sharing is a separate idempotent relationship command, and attachments require a ready resource shared to that conversation.

Downloads use authenticated Storage requests with browser cache disabled, not signed URLs that remain usable after revocation. A revoked recipient loses future authorized downloads; previously downloaded bytes cannot be recalled. Removal marks the resource retired, calls the Storage API to remove bytes, then removes metadata only after the object record is absent. A partially completed removal stays visible for retry. Registration and account deletion lock the same profile; account deletion refuses while any owned resource remains. The Settings UI cleans resources before deleting the account. It also releases future booked slots when deleting a client. Do not bypass this lifecycle by deleting `storage.objects` with SQL.

R3 has no upload worker, image transformation service, external food provider, calendar integration or delivery outbox. File bytes are not stored in IndexedDB; an interrupted upload may require the user to reselect the original file. Nutrition editors keep device drafts; calendar mutations keep the exact pending command. Only the workout flow promises offline recording. All new feature writes still require server acknowledgement.

## R4 — Optional teams, business state and support

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
