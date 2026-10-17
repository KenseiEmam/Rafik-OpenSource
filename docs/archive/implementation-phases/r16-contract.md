# R16 — Organization nutrition contract

Status: implemented and accepted for local development; see [verification](../../../verification/README.md) and the [R16 receipt](../../../verification/receipts/r16-verification.txt). Next gap from the open-source research priority list and role audit. No hosting or native work.

## Scope and roles

- Organization nutrition is keyed by organization membership, never independent coach-client relationships.
- Admins (including admin-only) oversee/publish for organization trainees. Trainers publish/read only for their currently assigned trainees. Combined roles use the explicit route view.
- Trainees read their own plans and record/correct/remove their own meals. Personal food records are never imported automatically.
- Food diary sharing defaults off. The trainee explicitly enables organization sharing; admin and assigned trainer can then see this diary. Turning it off hides all diary records/history from staff, including old ones. The plan remains visible. This cannot recall an already viewed/exported copy.
- Membership/reassignment/closure authority is checked before operation receipts, under the existing organization lock. Old staff cannot replay writes after losing responsibility.

## Lifecycle and UX

Immutable dated plan versions contain coach-entered targets, optional expiry, notes and up to20 example foods. Suggestions never become recorded meals automatically. Staff must review current revision before publishing; future/effective versions and expiry are visible in history.

Meal records preserve portion/basis/source/nutrients with optimistic revisions and immutable correction/removal history. Own records remain exportable through subject account export, including former membership. Organization identity/history is retained by existing account deletion semantics; personal independent history never crosses scope. Shared food is organization-specific, with visible audience before the first entry.

Reuse nutrient fields, budget arithmetic, food search and example-day editor. One selected trainee, bounded searchable member picker; Plan / Food diary / History views avoid a single long form. Staff read the diary without editing actual consumption. Default staff entry is the plan; trainee entry explains sharing and offers plan/diary actions. Errors preserve device drafts and exact pending commands; stale reads/navigation cannot overwrite another context.

## Acceptance

Real API tests: two organizations, unrelated/independent users, admin-only, assigned/reassigned trainer, trainee, sharing on/off, inactive/revoked membership, retries/mismatched receipt, concurrent revision, immutable history, source portion validation, dates/expiry, scoped export. Browser: publish → own view → explicit sharing → record/correct/remove → staff review; lost acknowledgement/reload, drafts/member switching, empty/error/long content, keyboard,320px/desktop,EN/AR,themes in Chromium/WebKit. Review actual rendered views, not test counts alone. Existing independent nutrition/organization navigation must continue working.
