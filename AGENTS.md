# Rafik web revamp working context

- Work on `codex/university-revamp-plan` for the approved university-first migration; never push main. Complete one stage at a time and wait for approval before starting another. The existing app is a local web/backend foundation; Compose self-hosting comes before the later Android app stage.
- Read `docs/implementation/ledger.md`, `architecture.md`, `runbook.md` and `verification.md` before expanding product workflows. The business and UX audit is preserved under `docs/revival`.
- Use the requested design-taste-frontend skill, with redesign-existing-projects when useful. The user authorized a clean rebuild; do not restore the old feature/route structure merely to preserve it.
- Keep Vue 3/TypeScript and the small feature/module structure. No generic builder, new global-store hierarchy or duplicate server business rules without a concrete need.
- Node 22.16.0. `npm test`, `npm run format:check`, `npm run build`; full Playwright checks require local backend + dev server 5173 + production preview 5174.
- `apps/frontend/src/content/sample.json` is generated from canonical sources in `apps/backend/`. Shared API contracts and generated database types live in `packages/shared/`; regenerate database types from the backend schema.
- Install from the root lockfile with one `npm ci`; never create app-local lockfiles. Use root scripts or `--workspace @rafik/backend` / `--workspace @rafik/frontend` for workspace-specific commands.
- Typed input, durable device storage and acknowledged server state are separate. Never let a delayed read overwrite newer local work, adopt another account's pending records, or report cloud success before acknowledgment.
- Use real rendered browser checks for English/Arabic, light/dark and phone layouts. Distinguish browser emulation from physical hardware and human usability observation.
- No old hosted credentials or project configuration may enter this runtime. Local sample identities and privacy copy are not deployable production configuration.

- Every further change must update root `CHANGELOG.md` and `docs/implementation/ledger.md`. Update READMEs and `docs/implementation/maintainer-guide.md` when files/workflows change, `architecture.md` for data/API/lifecycle changes, `runbook.md` for operations and `verification.md` for actual checks/limits. Keep one root `AGENTS.md`, one `docs/` tree and one Compose definition under `infrastructure/`. Do not leave stale phase status.

## Engineering and product completion rules

- Follow root `CONTRIBUTING.md` and `docs/README.md`. The frontend and backend are npm workspaces under `apps/`; shared types/contracts are a workspace under `packages/shared`. Keep current architecture/reference docs accurate; phase logs are history, not the onboarding manual. Record durable architectural tradeoffs as ADRs.
- Audit rendered user tasks before redesigning. Preserve the accepted visual identity while fixing hierarchy, navigation, interaction and recovery. Inspect realistic long/populated and empty/error states, phone/desktop, keyboard, Arabic/RTL and both themes.
- A route, screenshot, test count or accessibility scan alone does not prove a good UX. Primary actions must stay reachable; optional controls should not overwhelm the task. Test what a person can actually accomplish, including interruption and correction.
- Implement complete vertical features: authorization/data lifecycle, durable state/retry, discoverable UI, failure recovery, review/history/export and downstream analytics where relevant. Do not mark a partial demo as the revamp.
- Fix observed regressions before extending scope. Add regression coverage for consequential failures, inspect the real rendered result, update matching docs, and state remaining release/product evidence limits honestly.

## Responsive verification lessons (R6)

- When changing layout direction, remove obsolete breakpoint rules and inspect computed flex basis, intrinsic minimum sizes and nested scroll containers. Do not stack another override over a conflicting old layout.
- Page-level overflow checks are insufficient: inspect clipped descendants, control containment, row spacing and the reachability of every action. Intentional text ellipsis is distinct from hidden container overflow.
- Verify list, selected/detail, back, search/no-match and error states with multiple realistic records and long names/labels. Include short phone heights, landscape and live resizing, Chromium and WebKit, English/Arabic and both themes. Wait for the actual data surface, not just the page heading.
- Capture both viewport and full-page evidence; inspect the rendered states, including entry/list screens. A generated screenshot that nobody inspected is not visual acceptance. Document the feature/state coverage and gaps; never claim absence of every possible issue.
- Keep full browser suites serial; final evidence must use the final source/build. New fixtures must clean up only their own records and must not depend on test pollution in sample accounts.

## Founder direction during R7

- Prioritize university coach, organization, and field workflows. Preserve useful athlete web functionality while the Android field app remains a later stage. Do not equate a simplified client logger with the complete university product.
- Hosting target is **Prisma + PostgreSQL with an explicit server API**, replacing Supabase. R7A1 uses the local Prisma/PostgreSQL API; Supabase is retired. Before hosting, configure real identity/mail/file adapters and verify transactions, authorization, durable retries and file lifecycle against the new stack. Follow backend ADR 0004; do not deploy the Supabase prototype as the final architecture.

## Role and organization scope correction (R7A)

- Read `docs/implementation/role-scope-audit.md` and ADR 0005 before expanding features. R4 teams are not the required organization model. Organizations have their own admins, trainers and trainees; independent coaches/trainees remain separate. Platform administrator is a separate grant.
- Preserve authorized combined roles without mixing business scopes. Define actor, context, resource and lifecycle permissions before coding; derive navigation from server capabilities. Test two organizations, independent users, combined roles, stale tabs and revoked staff access.
- Organization-owned training history survives internal trainer reassignment; do not model it as a new independent coaching relationship or transfer unrelated personal data. Check-ins do not replace scheduled assessor-led assessments with per-trainee results.
- Historical R7A sequencing brought the Prisma/PostgreSQL API and scoped organization foundation before later features. The approved current sequence is the university migration in `docs/requirements/README.md`: monorepo, secure Compose, university workflows/security, optional cloud templates, then Android.
- For every phase, trace legacy capabilities to retained/replaced/deferred/defective with evidence. Test against the role/workflow requirements, not merely the current reduced implementation; record missing product scope even when all existing tests pass.

- Recovery UI must distinguish actively persisting/sending from an uncertain result. Offer retry only after the request is durably stored and dispatch has settled; reload/fault tests must exercise that real user-visible state. Await completed route navigation and loaded records before measuring layout.

- Verify every step of a multistep flow, especially initial selection and empty states, not only the final review/confirmation. Include native date/select controls at 320px. Optional Vue boolean props need explicit defaults when absence should mean true; shared feedback changes require regression of existing consumers.

- Responsive charts need readable labels at actual rendered size, not just SVG source font size. Keep textual axes/units legible on narrow screens and provide table equivalents. Keep datalist suggestions outside labels so the input's accessible name stays concise. Verify participant filters and permission changes against the original role contract.

- Check vertical collisions as well as horizontal overflow, especially viewport-sized conversation layouts with headers and footers. Scrollable histories must be keyboard focusable in Safari. Device-save feedback must wait for storage acknowledgment; edits during an active sync must schedule another pass instead of being dropped by a busy flag.

- Run full browser acceptance with the web isolation wrapper; never reset or reseed the preview for tests. Keep sources stable during final evidence. Use fail-fast dependent shell checks. New selectors must search the full authorized roster and retain selected IDs across pages/reload; summary totals must not count only loaded rows. Operational authority is a separate platform grant, checked before retry receipts.

- Preserve product cohesion across entry, role/context selection, task steps and Help. Optional setup should not dominate the default flow. Never drop a selected record when replacing search results; ensure review resolves every selected identity. Inspect natural page scrolling for creation forms separately from fixed-height conversation threads. Treat developer walkthroughs and synthetic metrics separately from human outcomes.

- Pagination acceptance must choose records from later loaded pages, then verify list position, selected chips, search and reload. Do not merely check that a load-more button appends rows. Direct Node-run TypeScript helpers require explicit local `.ts` imports and matching no-emit compiler settings; run the actual script entry point, not only the Playwright-transformed equivalent.

- Prefer scoped semantic test locators over page-wide first-element assumptions. Shared navigation additions can change DOM order without changing the intended task control; verify the actual named control in the user flow.

- Dashboard quality gate: distinguish public pages from operational workspaces. Keep staff navigation visible, use semantic section titles and shared real selection controls, and disclose optional detail progressively. Review first-use scanability as well as overflow. Charts require meaningful axes/units, truthful empty/count behavior and accessible keyboard/table equivalents.
- Shared UI changes require open-popup, focus/keyboard, 320px/desktop-breakpoint, RTL/theme and populated/empty/error-state checks in both engines. Test document vertical overflow and local scroll ownership, including hidden accessibility elements; do not hide overflow globally to mask defects. Run token-definition checks. Preserve prior results during refresh and guard stale responses. Update Help and engineering navigation instructions with shell changes.

- Reference-content changes must verify dataset and asset rights separately, pin sources/digests and map exact movements; a repository software license does not imply media rights. Keep published reference keys immutable and credits available. Nutrition must distinguish source kcal from macro arithmetic, unknown from zero and suggestions from consumption. Test scoped drafts, exact uncertain-response retries and abandoned helper inputs alongside the complete coach-to-client flow.

- Imported numeric precision must remain valid in real forms. Test source-backed values through actual submission (including controls inside collapsed details); a calculated preview alone does not prove the record can be saved.

- Async navigation guards apply to initialization and successful write callbacks as well as read responses. Persist/acknowledge the original command, but never rewrite route/query state after its screen unmounts. Add an in-flight SPA navigation test that waits for durable acknowledgement before checking the destination; sequential save-then-navigate journeys miss this race.

- Content integration acceptance must measure the requested corpus and the usable media coverage separately. Do not quietly reduce a broad-library request to fixture matches. Verify discovery with compound categories and later-page selections, plus the real authoring/consumption workflow. Still positions must not be represented as continuous movement; previews should not require manual frame-stepping. Native and offline media claims require their own evidence.

- Exercise discovery acceptance must inspect the initial phone list before opening details: at least one result should be visible without expanding filters. Test compound equipment membership (for example barbell plus bench), combined filters, a later-page selection and query entry after Escape. Use the control’s accessible role/name in browser checks; label-container text can include option text.
- For scoped Vue RTL rules, keep the full target selector scoped (for example `.arrow:dir(rtl)`); never put a global ancestor in a selector that can compile to the ancestor alone. Inspect emitted CSS and an actual Arabic screenshot. Geometry/Axe scans cannot prove correct orientation.
- Picker acceptance must verify that an option is visibly inside the popup and viewport, not merely mounted or selectable by keyboard. Prefer one scroll owner; avoid fixed height subtraction when filter controls can wrap. Capture viewport images with browser-specific names so phone runs cannot overwrite desktop evidence.

- Portaled Reka popups need their own locale direction (or a verified global ConfigProvider); Root direction does not establish Popper Content direction. Assert the open popup’s computed direction and inspect mixed Arabic/English labels; use auto direction for untranslated names.

- When reusing a UI component, inspect its rendered contents before wrapping it; avoid duplicate fields/headings. Scope acceptance to the actual nutrient controls, not unrelated inputs. Capture console component-resolution warnings as well as runtime errors.
- Device-save feedback must acknowledge the latest queued draft write, and remain visible when an editor closes. Test close → saved feedback → reload → continue, plus switching subjects/dates. Keep sharing decisions and nutrition actuals separate from published suggestions; reassignment and revocation must be checked before replay.

## Historical gym-first direction (28 September 2026; superseded 16 October 2026)

> The approved university-first direction is now recorded in [the staged requirements](docs/requirements/README.md) and [ADR 0001](docs/decisions/ADR-0001-university-owned-deployments.md). Treat the following gym-first product statements as historical. Existing security, data-integrity, and verification guidance remains applicable when it does not conflict with the approved university scope.

- Public web serves gyms and training organizations; trainers operate inside organizations. Retain legacy/personal APIs for compatibility and explicit local examination, not acquisition or primary web navigation. Trainee and trainer tablet apps remain later work.
- No generated marketing photography. Default new visitors to dark; preserve an explicit theme choice and the original logo colors.
- Tailwind is additive, prefixed `tw:`, with no Preflight. Reuse semantic theme tokens; do not mass-convert or override existing Reka/Unovis controls.
- Conversation lists must remain mounted when selecting a thread; retain search and scroll, isolate thread drafts/requests by conversation, and test actual DOM continuity. Separate direct conversation privacy from organization group visibility.
- Per-set values and program descriptions must be visible during authoring. Weekly cycles need an explicit day-count/rest-day explanation; do not silently migrate historical prescriptions.
- Organization exercises shared with trainers mean within the same organization, not a cross-tenant public catalog. Recheck media permission on every byte read and preserve authorized immutable snapshot references.
- Founder-confirmed session policy: only explicitly package-linked bookings reserve an allowance; completion consumes, cancellation releases, and each no-show needs an explicit staff charge/release decision. Independent trial/makeup/prize/other sessions never reserve or deduct subscription sessions. Do not ask for this policy again unless the user changes it.
- Satisfaction has two separately reported scopes: client experience with trainers (including explicit session feedback as a labelled source) and trainer workplace satisfaction. Never combine them or infer ratings from activity, effort, attendance, renewal or missing feedback.

- When adding multi-select metadata beside compatibility fields, test removing every selection on an existing record as well as adding values. Keep singular fields synchronized and immutable snapshots unchanged.
- File acceptance must cover uncertain upload retries, unsent attachment privacy, wrong-channel reuse, owner revocation, resource archive/restore and a real-media rendered view. Keep group-channel and private-pair authority explicit; an administrator role must not silently bypass pair privacy.

- Canonical SQL assertions must run in a disposable migrated/seeded database; never repair or reset preview users to match fixtures. Repeated media inside exercise lists should use local groups, not duplicate page landmarks. Include complete multi-exercise authoring and preview views in shared-media accessibility checks.

- Media-aware UI audits must wait for application data and rendered controls, not global network idleness: looping video can keep media requests active indefinitely. Track domain fetch completion separately and retain layout/accessibility assertions; do not disable playback to make a test pass.

- For source-derived metrics, name the counted record precisely: workout completion differs from scheduled appointment completion. Keep session/workplace feedback source, time window and denominator visible; missing ratings remain unknown. Test every tab after switching, since nested grid/tab intrinsic widths can overflow only in secondary states. Prisma defining-side unique keys must include exactly the composite tenant/subject relation fields; validate introspected schema before treating migration work as complete.

- After a recovered write, adopt the acknowledged server revision in local editor state even if a refreshed parent has the same revision/key. Do not rely on remounting to remove a restored stale draft version. Test lost acknowledgement → reload → retry → a second edit/save, not just the first successful recovery.
