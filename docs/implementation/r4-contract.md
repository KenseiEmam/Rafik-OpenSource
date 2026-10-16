# R4 team and business operations contract

23 September 2026. Local implementation only, on `codex/revamp`. Existing solo coaching remains the default; there is no mandatory organization setup or new runtime service.

## Team ownership and access

A team has one owner and fixed admin/coach memberships. The owner can transfer ownership or close an empty team. Admins manage invitations, roster and groups; coaches work with their assigned clients and contribute shared material. Staff invitation links bind to the intended verified email, expire after seven days and are explicitly accepted. Removing a member with assigned/pending clients is blocked until reassignment or enrollment closure. Account deletion is blocked by owned active teams or assigned team clients before file cleanup begins.

Joining a team does not grant access to another coach's conversations, private notes, meals, measurements or session results. Workspace reads expose staff display names and a minimal roster only: owners/admins see the team's roster, coaches their assigned clients. The existing participant policies remain the authority for coaching detail. A proposed coach gains no client roster access until approval (unless already authorized as a team admin). Client inclusion in a team requires their approval, with a visible team name and explanation of roster visibility.

Coach changes are requested by a team admin and approved by the client. Acceptance creates/reactivates a separate direct relationship with the new coach, transfers a copy of the current published training plan and schedule, archives the previous relationship and cancels its future appointments/unsubmitted forms. Stable-ID retry of an already-started session remains valid after handoff/archive. Started session snapshots, completions and old conversation history remain with their original participants. Old private notes and messages are never copied. Existing new-coach future assignment is explicitly replaced; started work remains intact. Groups follow the team enrollment, not the old relationship. Client decline/cancellation leaves the current coach untouched. Closing team enrollment does not erase or terminate the direct relationship.

## Shared material and group assignment

A shared plan is an immutable snapshot of an owned published version, including exercise instructions. Import makes an independently owned editable copy and clones exercise definitions so private/retired source catalog edits or contributor departure cannot break it. Sharing/removing a template does not rewrite imported plans or existing assignments. Shared files stay person-owned and are explicitly published to the team; active members can download, admins can remove the team link, and the file owner can revoke/delete their bytes through R3. Team publication never implicitly shares the file with clients or their conversations.

Groups are simple named roster subsets with create/rename/archive. Archiving removes grouping links while retaining assigned plans and bulk receipts. Group assignment takes an explicit bounded list (up to 50) of the acting coach's current clients and an owned published version. It records a stable command receipt, validates all targets and applies atomically. No organization-wide auto-assignment, generic permissions builder or implicit progression.

## Commercial and support states

Commercial accounts are either personal or team-scoped. They track trial/active/past-due/cancelled states, access expiry and staff/client admission limits, separate from training records. Teams start with a clearly labelled local trial. Restricted commercial access blocks new team admissions, publication and bulk assignment; it never blocks recording existing workouts, history, export, team closure, membership removal or client handoff. Personal business setup is optional and its provider state is observational in this local phase; enforcement on solo acquisition is a later release decision.

Provider events have stable IDs and a monotonic per-account sequence. Identical retries are no-ops; stale events remain recorded but cannot roll state backward; reusing an ID with different content is rejected. A service-role command is the provider boundary. A separately gated local simulator exercises it with no card fields, charges or external requests. Its server flag defaults off and is enabled only by synthetic local fixtures, in addition to the frontend local-preview gate.

Support cases contain only explicitly submitted subject/detail, optional team context, status and an acknowledged response. Reporters can see/resolve/reopen their cases; team admins can respond only to cases explicitly addressed to their team. Platform replies use a local CLI/service-role command. No impersonation, invisible access to workout notes, ticketing microservice or real outbound delivery.

## Verification and maintained records

Run baseline regressions before/after. Add rollback assertions for invitation email/expiry/replay, role boundaries, member departure, client consent/handoff, snapshot/group assignment retries, team file revocation, provider ordering and support visibility. Exercise complete UI flows through actual local Auth/REST/Storage, including dropped acknowledgements and fresh identities. Verify both browser engines, both languages, both themes and phone/desktop layouts. Preserve current preview data and validate fresh migrations in a disposable database. Update README/changelog/architecture/maintainer/runbook/ledger/verification with exact results and limits. Notifications, external delivery/payment adapters and native-device work remain later release/integrated work, not implied by local provider simulations.
