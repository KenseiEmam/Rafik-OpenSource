# Implemented architecture

Local revamp, 22 September 2026. This record describes the new implementation; `docs/revival` preserves the audit and rationale. It is not a compatibility plan for the retired backend.

**Scope correction:** this describes the implemented foundation, not the final product architecture or feature ceiling. [Revamp coverage](revamp-coverage.md) governs the broader remaining work and identifies contracts to resolve before extending the schema. The ten-table count is not a design constraint.

## System boundary

One Vue application communicates with one Supabase project: Auth, Postgres, and PostgREST. Static assets and self-hosted fonts belong to the web build. IndexedDB stores resumable workout records, pending commands, recoverable editor drafts and a bounded local diagnostic log. A small production service worker caches application code and public assets for reloads during a workout; it never caches API responses or access tokens.

There is no Edge Function, worker, Firebase dependency, external analytics service, AI service, billing service, or scheduled notification system in the new runtime. Mail is intercepted locally by Mailpit. Coaches share invitation links using their existing channel. Contextual feedback appears with the session and on Today; the UI does not claim it sent a notification.

## Data model and ownership

| Record | Owner and meaning |
|---|---|
| `profiles` | Auth UUID, optional display name and locale/units/timezone preferences; one identity for either role |
| `exercises` | Small shared bilingual catalog, source-controlled |
| `plans` | Coach-owned editable draft and monotonic draft revision |
| `plan_versions` | Immutable published prescription; public flag reserved for the starter fixture |
| `coach_clients` | Explicit relationship between two people; no organization hierarchy |
| `assignments` | One active plan assignment per relationship, pointing to a published version |
| `invitations` | Intended verified email, hashed random token, seven-day expiry, acceptance state and request identity |
| `sessions` | Client-owned occurrence and immutable day prescription snapshot, actual state, note and coach feedback |
| `set_entries` | Actual values and units, completed flag, bounded by the session's prescribed set identities |
| `session_operations` | Receipt for a stable save operation ID; same request replays the acknowledgment |

An assignment occurrence is `(client, assignment, client-local date, prescribed day ID)`. Starting that same slot twice returns one session. Two different day slots can be performed on one day. Repeating the identical assigned slot twice on one date is not a separate supported occurrence. Public sample attempts use their own persistent start ID. Dates use the saved client timezone, detected from the browser on initial profile creation; the UI allows changing it in Settings. A missing display name defaults to the verified email local part and can be edited later, keeping new clients identifiable without adding a signup form.

Exercise instructions are catalog content; prescribed sets, reps, loads and notes are captured in the session snapshot. Published versions and started prescriptions are immutable. Actual entries may be corrected after completion. A correction preserves the original completion time and does not trigger automatic progression.

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
| `assign_plan` | Owned relationship and published version | Changes future starts; existing sessions keep snapshots |
| `start_session` | Persistent attempt UUID, version, day, optional assignment | Server verifies access and selects the prescription; same assigned occurrence returns its canonical UUID |
| `save_session` | Session, expected version, stable operation UUID, full bounded entries, note, completion flag | Transactional validation, compare-and-swap, receipt replay; conflict keeps the device draft |
| `review_session` | Owned coached completed session, feedback | Stores feedback and reviewed time; does not alter client results or completion |
| `delete_my_account` | Current Auth identity and literal confirmation | Deletes that identity and owned records; other clients retain their session snapshots with nullable coach/version references |

`session_document` reads one authorized session with its actual set entries. Tables are not an alternative write interface. Failures such as `conflict`, `wrong_email`, `plan_changed`, `invalid_entry` and `invitation_unavailable` map to contextual recovery copy.

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
- Feature folders match user tasks: public, account, training, coaching. Shared code handles Auth, persistence, synchronization, translation, types and API access.
- One bilingual `content/starter.json` in the backend generates seed and public sample. Do not edit generated copies. The eight-exercise scope is intentional; extend the catalog only for observed needs.
- CSS uses semantic light/dark tokens, logical properties for RTL, and named feature sections. Shared components stay few; `PageState` supplies common loading/error behavior.
- Stable prescription JSON is bounded to seven days, twelve exercises per day and ten sets per exercise. New prescription fields require a documented schema/validation change and regression scenario.
- Runtime errors preserve work. Avoid swallowing failures that imply successful data persistence. Diagnostic events are bounded and local, without email or workout-note payloads.

## What is deliberately outside this build

There is currently no automatic spreadsheet import, independent chat inbox, reminder delivery, billing subscription, organization administration, or native application. The starter and duplicate/edit workflow cover initial plan preparation only. Manual conversion of a coach's current plan is a pilot service to measure, not a hidden import feature. These describe current gaps; the corrected coverage register governs remaining web/backend scope. Native work remains deferred by user instruction.
