# R7A2: Organization membership and authorized views

This checkpoint establishes identity/membership/responsibility. Organization-owned programming, training history, services and analytics follow in R8/R9; the membership screens are not a substitute for those workflows. See ADR 0005 and the original-role audit.

## Ownership and authorization

One identity may have independent coaching and memberships in several organizations. `workspaces.kind` distinguishes them. Organization membership holds explicit fixed admin/trainer/trainee roles; combinations are supported and no sole owner is required. `platform_grants` is separate and cannot be edited through organization commands. Personal settings and independent domain records remain outside organization access.

`GET /v1/contexts` returns available role views. The shell remembers only a still-available destination. Creating an independent practice explicitly activates coaching; having an organization trainer role does not activate it. Core coach creation commands check that independent capability. Existing pre-transition coaches receive their context in the migration; synthetic fixtures explicitly identify the two sample coaches.

Organization API tables are internal to Prisma and have no browser SQL grants. `/v1/workspaces/:id` verifies current active membership and requested role for every read/command. Admin reads own people, pending invitations and recent organizational events; trainer reads assigned trainees; trainee reads self and responsible trainer name. No generic row route exposes those tables. Organization names and roles in a verified invitation preview do not expose its intended email or membership list.

## Commands and lifecycle

- Workspace creation uses a caller UUID with exact replay. An organization creator becomes an administrator, not a global operator. Independent practice creation is limited to one active practice per identity.
- Invitation creation records intended normalized email, a hash of a random token, fixed roles and seven-day expiry. Acceptance requires the same verified email. Replays do not duplicate membership or silently edit active roles. Admin can revoke a pending invitation; the UI never claims it sent email.
- Role/active-state and trainer changes use the acknowledged membership revision. Trainer selection requires another active trainer membership in the same organization; a composite foreign key prevents cross-organization references. Membership identity stays stable on reassignment.
- Removing a trainer or trainer role clears their trainee responsibility links atomically, leaving the trainees visibly unassigned. It does not delete members or move them into independent coaching. Revoked staff fail new requests and old receipt replays.
- At least one active admin must remain in an open organization. Membership commands and account deletion acquire the same organization locks; concurrent departures cannot evade the check. Closing is an explicit name-confirmed action that preserves records and ends all member access. Exact closure retry can confirm its receipt without restoring access.
- Account deletion deactivates memberships, releases trainer duties and nulls the identity reference while preserving the organization's membership record with a neutral former-member name. Independent collaboration ownership/handoff guards remain in force. Training-record retention/export is completed alongside those records in later phases.

Each organization mutation carries an operation UUID. Receipt lookup occurs after current authorization, and the canonical payload must match. An unknown result persists under account + organization + role; confirmed rejection permits correction. No automatic background mutation queue is added.

## UX and source ownership

`src/features/organizations/` owns workspace setup, organization views, invitation acceptance, transport types and styles. Admin overview leads to People, with search/role filters, a focused member editor and separate activity/settings. Trainer and trainee views do not show admin controls. Selected-member editing moves keyboard focus into the editor; closing returns it to the originating action. Invitation drafts survive reload and newly created links replace previous links immediately.

`src/app/auth.ts` owns context loading with identity-race protection. Shared `useCommand` now accepts an explicit dispatcher, retaining the existing independent-team behavior; it is a single pending request, not a universal workflow engine. Local sample accounts expose two organizations and a trainer/trainee combination.

## Acceptance and limits

Actual HTTP tests cover two organizations, combined roles, forged IDs, wrong-email acceptance, exact retry, last-admin and deletion guards, departure/reassignment, revoked access and closure recovery. Browser tests cover admin creation/invitations, draft reload, combined-role acceptance, assignment with lost acknowledgement, trainee/trainer views, stale revoked tabs and actionable last-admin rejection.

The current membership projection reads the authorized roster and renders a bounded visible list; server paging/large-organization performance is an R11 maintenance item, not a scalability claim. No organization program/history, assessor calendar, role-specific analytics, external email, hosting or native acceptance is claimed by this membership checkpoint alone.
