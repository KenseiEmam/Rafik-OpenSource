# Rafik revamp working context

- The current work is a clean local rebuild on `codex/revamp`. Never push main. Follow any later user instruction that explicitly changes the phase.
- Start with `docs/implementation/ledger.md`, then `architecture.md`, `runbook.md` and `verification.md`. `docs/revival` contains the completed audit and business/design rationale; old source links refer to the recorded baseline commits.
- The companion web checkout is `../RAFIK-FRONTEND`. Native app and worker source are deferred. Do not resurrect old runtime services or require legacy data migration.
- Local project: `rafik-prisma-local`. The retired hosted project must not be used by the new runtime. Local scripts verify the isolated Compose project.
- Node 22.16.0; `npm ci`, `npm start`, `npm run seed:local` (empty database only), `npm run start:api`, `npm test`. Never reset a preview to apply a migration. Never apply synthetic seeds to hosting.
- Edit content in `content/starter.json`, then `npm run content`. Generate web types with `npm run types` after schema changes.
- Keep writes as explicit bounded commands. Published versions and started prescriptions are immutable. Completion retries and note/set corrections must not create another completion or progression.
- Do not mark physical-device use, real retention/payment, remote CI or hosting verified from local automated tests. Record concrete results and limits in the implementation ledger.

- Documentation is part of every change: update `CHANGELOG.md` and `docs/implementation/ledger.md`; update `architecture.md` for schema/API/lifecycle changes, `maintainer-guide.md` and README for file/workflow changes, `runbook.md` for operations, and `verification.md` with actual checks and limits. Commit matching code and docs together. Do not leave stale phase status or treat an old test result as verification of new code.

## Engineering and product completion rules

- Follow the backend `CONTRIBUTING.md` definition of done and `docs/README.md` documentation structure. Keep current architecture/reference docs accurate; phase logs are history, not the onboarding manual. Record durable architectural tradeoffs as ADRs.
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

- Prioritize coach and organization workflows in RAFIK-FRONTEND; preserve trainee web functionality, with the primary trainee experience reserved for the later native revamp. Do not equate a simplified client logger with the complete coach product.
- Hosting target is **Prisma + PostgreSQL with an explicit server API**, replacing Supabase. R7A1 uses the local Prisma/PostgreSQL API; Supabase is retired. Before hosting, configure real identity/mail/file adapters and verify transactions, authorization, durable retries and file lifecycle against the new stack. Follow backend ADR 0004; do not deploy the Supabase prototype as the final architecture.

## Role and organization scope correction (R7A)

- Read the backend `docs/implementation/role-scope-audit.md` and ADR 0005 before expanding features. R4 teams are not the required organization model. Organizations have their own admins, trainers and trainees; independent coaches/trainees remain separate. Platform administrator is a separate grant.
- Preserve authorized combined roles without mixing business scopes. Define actor, context, resource and lifecycle permissions before coding; derive navigation from server capabilities. Test two organizations, independent users, combined roles, stale tabs and revoked staff access.
- Organization-owned training history survives internal trainer reassignment; do not model it as a new independent coaching relationship or transfer unrelated personal data. Check-ins do not replace scheduled assessor-led assessments with per-trainee results.
- R7A brings the Prisma/PostgreSQL API transition and scoped organization foundation before R8 feature expansion (supersedes the earlier R11 timing). No permanent dual backend, generic permission builder or legacy data migration. Native and hosting stay deferred.
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
