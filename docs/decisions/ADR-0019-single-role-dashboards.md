# ADR 0019 — One institutional role per dashboard

- **Date:** 17 October 2026
- **Status:** Accepted

## Context

New institutional users must immediately see the work for their role. The previous shell exposed legacy athlete navigation to administrators, retained a confusing context selector, and left an institution tab bar above the administrator workspace. Allowing one membership to combine administrator, trainer and athlete capabilities also made the intended first dashboard unclear.

## Options considered

1. Keep combined roles and add a role selector at sign-in.
2. Keep combined roles but choose a preferred role in settings.
3. Require one role for each institution membership and present a distinct dashboard for that role.

## Decision

Use option 3. An institutional membership has exactly one role: administrator, trainer or athlete. Invitations and membership updates accept exactly one role. Server authorization remains authoritative. Each role enters its matching dashboard without a role-switching dropdown:

- Administrators get People & access, Analytics, Programs and institution operations.
- Trainers get roster, training, programs and their assigned coaching work.
- Athletes get their own programs, training, schedule, nutrition, injury status, feedback and messages.

The role navigation uses collapsible groups. The dashboard sidebar replaces the old horizontal institution navigation for all three institutional roles. The separate platform-administrator grant remains distinct and receives a direct link only when authorized.

Existing multi-role memberships and pending invitations are normalized by a forward migration. The deterministic priority is administrator, then trainer, then athlete. If a membership loses its athlete role, its current trainer assignment is cleared to satisfy the membership constraints. The migration does not remove membership, history or account data. An account that needs another institution role must receive a separate identity/account rather than silently combining privileges.

## Consequences and trade-offs

- First-run and invitation journeys have a clear destination, and role-specific navigation is simpler to understand.
- A person who performs multiple jobs must use separate accounts. This is an intentional product constraint that avoids mixed authority and dashboard ambiguity.
- Existing combined-role records lose secondary roles during migration. Operators should communicate the new role rule; administrators may re-invite a person under a new account if another role is needed.
- UI changes do not replace API authorization. Tests must cover invitations, role updates, route redirects, rendered role dashboards, revoked access and legacy-row migration.
