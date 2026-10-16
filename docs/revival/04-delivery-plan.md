# Delivery backlog for Codex

**Execution owner: Codex.** The [execution runbook](/Users/sami/Developer/GitHub/rafik-api/docs/revival/07-agent-execution-plan.md) is authoritative. This coverage checklist retains the original R01–R23 IDs while replacing the former patch/migration approach with the founder's clean-rebuild direction. Work stays local on `codex/revamp`; never push to `main`. Mobile comes after the web/backend is ready.

## 1. Dependency stages

| Stage | Units | Outcome and exit gate |
|---|---|---|
| New foundations and domain | E01–E02 | Clean local application/schema, synthetic fixtures, one identity model and explicit commands; no old-system restoration |
| Complete design | E03 | Full task prototype and visual/state specification after analysis; phone-browser, desktop and Arabic core |
| Working product | E04–E08 | Contextual entry, durable training, explicit revisions, coach editing/review and useful curated content |
| Local readiness | E09–E10 | Minimal operations, meaningful outcome events, verified usability/reliability/access and maintainability |
| Hosted release later | E11 | Distinct new Supabase project and deployable web product, with new-system backup/rollback; no old-data migration |
| Business iteration | E12 | Actual use/payment/support evidence guides refinement and expansion |

These are dependencies, not a two-engineer staffing plan. Real-use observation needs elapsed time and participants; it does not postpone core UI/UX work. Mobile is a separate later phase, not parallel work hidden inside the device checks.

## 2. Work-package coverage

| ID | Revamp work | Unit | Done when |
|---|---|---|---|
| R01 | Clean configuration and secret handling | E01/E11 | New environment has independent configuration; no copied old credentials; source scanning enabled |
| R02 | Authorized new commands and file access | E02/E10 | Intended actions pass; wrong-user/unauthenticated operations fail; no arbitrary submitted-user deletion |
| R03 | New reproducible database foundation | E01/E02 | New migrations/seed reset locally; captured old SQL is reference only |
| R04 | Toolchains and CI | E01 | Clean install, type/build and meaningful schema checks are repeatable |
| R05 | Complete public entry/routes | E03/E04 | Phone/desktop entry, policy routes and 404 work; no fake metrics, width gate or dead purchase form |
| R06 | Clear offer and failure hypotheses | E03/E12 | One primary proposition; lead-generation expectations excluded; testable assumptions separated from facts |
| R07 | Interaction redesign | E03 | Full journeys and information timing; core errors/empty/recovery states specified |
| R08 | Visual system and prototype | E03 | Requested design skill used within scope; clear hierarchy/components; complete realistic tasks |
| R09 | Usability verification and revision | E10/E12 | Failures/assistance logged; blocking design issues fixed and retested |
| R10 | Responsive-web device reliability | E05/E10 | Actual phone-browser keyboard, storage, interruption and reconnect pass; no Flutter work yet |
| R11 | Identity/invitation/assignment | E02/E04 | Auth UUID identity, verified acceptance, atomic state and retry behavior |
| R12 | Preview and contextual authentication | E04/E05 | Public sample without setup; private assignment protected; task context preserved |
| R13 | Durable workout loop | E05/E06 | Correct occurrence, save/resume/finish, visible conflicts and coach-visible synced result |
| R14 | Outcome events and support | E09 | Deduplicated meaningful events; no sensitive payloads; actionable failure visibility |
| R15 | Real-use/payment test | E12 | Concrete offer, actual return/payment response and support labor recorded |
| R16 | New plan editor and revisions | E06/E07 | Starter/duplicate/edit, recoverable draft, client preview and deliberate future publication |
| R17 | Coach review and history | E07 | Real planned/actual results, clear units and contextual action |
| R18 | Check-ins only if justified | E09 or later | At most one useful due item per period; no generic builder or inherited backlog |
| R19 | Minimal delivery/scheduling only if needed | E09 | One dispatcher, deduplication, due/overdue handling; no old worker carried over automatically |
| R20 | Account recovery/help/lifecycle | E04/E09/E10 | Wrong account, expiry, unsynced work and account actions have truthful recovery |
| R21 | Arabic/accessibility/performance | E03/E10 | Readable critical path, focus/contrast/reflow and measured ordinary-phone behavior |
| R22 | Selective content reuse; legacy migration removed | E08 | Small useful content seed, rights/units/media checked; no user/history/credit import |
| R23 | New-system release and maintenance rehearsal | E10/E11 | Documented setup/deploy/rollback; actual small update verifies predictable edit surfaces |

R16 and R17 are required core work, not gated on acquiring customers. R03 and R22 no longer mean restoring/migrating the dead product. Known legacy security issues stay recorded; repairing every old endpoint is not a prerequisite for building an isolated new system. Address old service shutdown and credential retirement together when retiring those resources.

## 3. Complexity budget

Use one core proposition, one web application, one new Supabase backend, one identity, one primary invitation flow, one logger and one coach review workflow. The initial product supports a deliberate strength-plan format and useful starter content. EN/AR core support includes layout and copy, not a translation toggle with English fallback everywhere.

Do not build marketplace matching, AI coaching/import, nutrition tracking, credit packs, organization hierarchies, custom forms, booking, a full chat platform or new native screens during the core revamp. Do not keep them alive in the new architecture merely because the old source contains them.

For each abstraction or service ask: which current task needs it, where does the rule live, what does a change touch, and can a smaller implementation meet the same need? Direct authorized reads are acceptable. Versioned prescription JSON is acceptable. A separate service or universal framework requires a demonstrated reason.

## 4. Decisions and external inputs

I own design, implementation choices, tests, documentation and evidence reconciliation. The user controls commercial commitments and actual spending. I will prepare concrete options/configuration before requesting a necessary external input. No routine choice about schema, folder layout or UI is handed back as homework.

Existing user data is not an unresolved gate: the founder has explicitly removed it from scope. New-project creation is authorized for when hosting is needed; current work remains local. Old projects are references, not deployment targets. No remote branch push should ever implicitly target `main`.

## 5. Readiness and business gates

A rebuilt interface must pass real task checks, including recovery, not merely look better in a screenshot. New-system data loss, false success, blocking navigation and critical access failures block release. Fix those without requiring users to learn workarounds.

If people can complete the task but do not return or value it, revise the offer or target segment using the business tests. Do not respond by rebuilding all the old breadth. Observed demand guides expansion beyond the complete core, rather than becoming an excuse to leave the current UX defects unresolved.

Start mobile only after the web/backend product is complete and verified. Any later native plan uses the established commands and design; it must not create a second implementation of training rules.
