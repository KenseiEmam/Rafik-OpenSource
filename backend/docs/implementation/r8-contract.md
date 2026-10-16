# R8: Scoped programming and delivery

Status: local implementation; final acceptance evidence is maintained in the verification record. This completes organization program/training ownership after R7A2 and improves the existing independent editor. Acceptance is recorded only after execution in the ledger/verification record.

## User tasks

Prepare a multiweek plan with reusable sessions, inspect instructions and the trainee preview, publish an immutable version, review selected recipients, and deliver. Adapt one trainee's future program explicitly; other recipients and already started workouts retain their snapshots. Organization trainers work with assigned trainees; admins oversee their organization. A trainee opens their own program and records through the existing durable logger.

## Ownership and contracts

Organization catalogs/programs/versions/assignments/sessions belong to the workspace. Authorship and responsible trainer are separate membership references. Internal reassignment changes responsibility without copying records into independent coaching. An active trainer may edit their authored programs; admins may maintain all organization programs. Explicit internal publication makes a fixed version available for organizational reuse/browsing; it never makes a private program public on the internet. Personal exercise libraries are not implicitly imported.

Use one structural prescription/actual validator and existing editor/logger components. API adapters supply explicit context; do not introduce a second workout persistence queue. Organization mutations use current role and resource authorization before idempotency receipt replay, compare revisions, and serialize with membership changes. Current responsibility governs trainer access to delivery/history. The recipient review is revalidated atomically; a stale or forged member rejects the whole batch.

Published definitions and started sessions are immutable. Completion correction preserves first completion time. Member shells and their organizational records survive staff departure/account deletion; scoped export is included. Local drafts and pending operations include account and workspace. Cached previously authorized trainee work may remain on that trainee's device; server access is checked on synchronization.

## Verification contract

Two organizations, combined roles, independent users, cross-scope IDs, revoked roles, trainer reassignment before retry, immutable publication/start, batch rejection, correction/retry, interrupted editing and exact draft recovery. Verify complete author → publish → deliver → train → review → adapt journey in both browser engines and inspect phone/desktop/RTL states. Record remaining release gates separately.

## Maintainer details

- `server/programming.ts` owns organization catalog, publication, reviewed delivery, history and session commands. Shared SQL catalog/actual validators are reused by both scopes. `server/program-media.ts` owns cover authorization, signature/size checks and immutable upload replay; `private-bytes.ts` is the local storage adapter shared with resources.
- `organization_versions` and started session documents are immutable snapshots. Draft and listing revisions are separate. History is paged by a verified session cursor; catalog search returns 24 rows. Recipient selection remains a bounded command (1–50), with server paging of large rosters included in R11.
- `program-context.ts` supplies the explicit scope to the shared editor/library. `DeliverPlan.vue` owns recipient selection → review → confirmation. `OrganizationTraining.vue` owns training/history entry; the existing workout queue remains the sole durable actuals implementation.
- Optional cover images are private PNG/JPEG/WebP, at most 2 MiB. Historical publications retain cover references. Removing a current cover does not remove a historical image. Local orphan-byte maintenance and operator retention are completed in R11; no hosted file provider is configured.
- Personal account exports include the caller's own organization membership, assignment and session records, including former membership. They do not export other trainees or the organization catalog wholesale.

## Legacy scope mapping

Retained and replaced: organization-authored programs, internal catalog, trainer/admin assignment, trainee recording and review. Fixed: internal reassignment retains organization history; bulk recipient validation is atomic; publication is a real immutable version rather than decorative approval buttons. Program cover is optional recognition support, not a public marketplace/gallery. Groups, calendar, assessor-led results and distinct staff/admin analytics belong to R9 and remain required.
