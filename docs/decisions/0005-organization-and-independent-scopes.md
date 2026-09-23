# ADR 0005: Separate organizational and independent coaching scopes

Status: Accepted direction; not yet implemented. Date: 23 September 2026.

## Context

The founder explicitly requires organizations to have their own trainers, trainees and administrators, separate from ordinary coaches/trainees. The [original-role audit](../implementation/role-scope-audit.md) confirms these distinct roles and operations. R4's teams are a collaboration overlay on independent coach/client relationships and do not satisfy the requirement. ADR 0004 selects Prisma/PostgreSQL but originally delayed the transition until R11.

## Decision

Use one authentication identity and explicit business contexts. A person may have more than one authorized role/context, but membership in one context never grants another. Do not require duplicate accounts to preserve business separation, and do not grant coach authority merely because an account exists.

Use a small fixed role model, not a configurable permission-builder:

- Independent practice: coach and enrolled trainee access, with existing explicit coaching relationships.
- Organization: organization admin, organization trainer and organization trainee; multiple admins and legitimate combined roles supported. An admin need not be a trainer. Joining as trainer does not automatically require trainee participation, but the combined role is supported explicitly.
- Platform administrator: separate operator grant. Organization admins cannot grant it or act on other organizations. Platform support access is an explicit, audited operational capability, not ambient access to every private message.

Represent a workspace as the isolation/ownership boundary with a fixed kind (`independent` or `organization`), not as a generic hierarchy. The term workspace is an implementation detail; the UI names the actual practice/organization. An independent practice has a responsible coach; an organization has active administrator memberships. No mandatory sole-owner organizational role is introduced.

The target relational model comprises identity, workspace, membership, membership-role grants, invitations and scoped trainer assignments. Use workspace-plus-ID foreign keys/unique constraints for membership, assignments and owned content where needed to make cross-workspace references invalid. Role grants are validated against workspace kind. Do not store a global roles array plus one nullable organization and infer every resource's scope from it. Personal account settings and deliberately private self-tracking remain person-owned; sharing them is explicit.

Programs, organization-delivered trainee records, groups, assessments and calendar events retain their owning workspace through staff changes. Authorship (`createdBy`/`reviewedBy`) is separate from ownership. Shared UI/domain logic can support both kinds, but authorization and recipient queries explicitly use the current context. An organization's trainer assignment links memberships in that organization. Start with one responsible trainer per trainee; do not add arbitrary supervisory hierarchies or configurable workflow engines.

Organization admins administer their organization's memberships, assignments, catalog, scheduling and organizational training/assessment oversight. Organization trainers act on assigned trainees, authored/authorized programs and assigned assessor duties. Organization trainees see their own delivery/results and the authorized internal catalog. Organization-admin authority does not expose a person's independent coaching, personal self-tracking or unrelated private conversations. Files and messages have explicit audiences within the scope; membership alone is not a blanket read grant.

An internal trainer reassignment changes responsibility while preserving organization-owned history; it does not copy the trainee into a new independent coaching relationship. Preserve started immutable prescriptions and authorship; remove the previous trainer's access as appropriate and make open duties visible. Organizational enrollment acceptance and notice of staff changes are distinct from a repeated consent ceremony for every internal staff reassignment. Removing the final active admin is rejected unless using an explicit audited organization-closure/recovery operation.

The API returns available contexts and capabilities. The UI remembers only a still-valid context, offers only valid views and handles revoked membership/deep links. Draft keys, caches, analytics, search, notifications, idempotency receipts and bulk-recipient selection include the business context. Authorization is checked on every command/read/download, including receipt replay after a role change.

Keep client-response check-ins distinct from scheduled assessor-led assessments. Organizational assessments need explicit participants, assessors, attendance and per-trainee drill results, immutable definitions for comparisons and correction history. A generic form must not be labelled as this complete feature.

## Sequencing and consequences

**R7A now precedes R8:** implement the tenant/role foundation and Prisma/PostgreSQL server transition locally before adding more organizational feature dependencies. This supersedes ADR 0004's R11 transition timing, not its technology decision. Transfer tested transactional command invariants in bounded slices; the completed transition has one active API/runtime, not permanent dual writes or two parallel permission systems. Existing local Supabase remains transitional until that acceptance passes.

This adds a necessary ownership boundary and role-specific views, while avoiding separate apps/authentication stacks per audience. It requires revisiting current teams, personal-only plan delivery drafts, account lifecycle, resource access and test fixtures. There is no legacy production migration requirement. Preserve useful tested behavior without treating the current schema as a constraint on a clean rebuild.

Separate coach, organization trainer and organization admin analytics follow the corrected model. Platform operations receive their own capability/surface. Public marketplace publication, trainer self-allocation and optional org approval policies remain distinct product decisions; do not infer them from ineffective legacy switches.

Acceptance is specified in the [role audit](../implementation/role-scope-audit.md): two organizations, independent users, combined roles, staff departure, cross-scope denied operations, immutable history, scoped analytics and rendered user journeys. Local passing tests do not establish hosting readiness or human usability.
