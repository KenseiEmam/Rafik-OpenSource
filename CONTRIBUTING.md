# Contributing to Rafik

## Development environment

Use Node 22.16.0, Docker and adjacent `rafik-api` / `RAFIK-FRONTEND` checkouts. Follow each README; never copy credentials from the retired backend. Local commands verify the isolated Compose project. Use `codex/revamp` for the current rebuild; never push main. Do not reset an existing preview merely to apply a migration.

## Make a change

1. Identify the user's task, expected outcome, access rules and failure/recovery behavior. Consult the coverage register and current architecture. For a UX change, inspect the existing rendered page with realistic content first.
2. Keep the change inside its feature module. Business transactions and ownership checks belong in explicit SQL commands; Vue owns presentation and device draft state. Add an ADR when a lasting architectural tradeoff changes; routine field additions do not need an ADR.
3. Add a numbered forward migration for schema/command changes. Test it against both the existing local stack and a disposable fresh database. Regenerate API types with `npm run types`; edit canonical content only in `content/starter.json`.
4. Implement the complete journey, including empty/loading/error, denied access, validation, recovery after a lost acknowledgement and history/correction when relevant. Visible save success requires server acknowledgement. Keep existing drafts and in-progress work safe.
5. Run the appropriate checks below and inspect the rendered result. Review the diff for accidental unrelated changes, credentials, obsolete copy and inaccessible controls.
6. Update matching docs and changelogs with code. Commit a coherent checkpoint on the revamp branch. Do not claim remote CI, hosting, physical devices or human usability observation from local browser tests.

## Definition of done

A feature is complete only when an intended user can discover it, understand it, finish their task and recover from a realistic failure without knowing the implementation. A route that renders, a populated screenshot, a passing Axe scan or a large test count is insufficient.

- Primary action is reachable on phone and desktop, including long lists/history and open optional controls.
- Navigation, back behavior, keyboard focus, labels, RTL, themes and realistic content have been inspected. Check list/detail/back/no-match/error states with multiple records and long labels at short/tall phone heights and landscape in both Chromium and WebKit. Inspect internal clipping and control containment, not only document overflow. Remove obsolete breakpoint rules when changing layout direction. Record which rendered states were actually inspected.
- Required work is minimal; optional fields/tools are progressively disclosed. Public-facing copy describes the user's action rather than database or implementation terminology.
- The server owns permissions, limits and concurrency. Immutable prescriptions and published definitions stay immutable; retries/corrections do not double-apply outcomes.
- Regression tests verify observable behavior and important boundaries. Fix discovered failures; do not weaken tests to make the change green.
- Documentation describes the current system, file ownership and how to extend/test/operate it. Remove stale statements, not just append a new phase section.
- Record unresolved limits honestly. Local implementation readiness is distinct from release and business validation.

## Check selection

Frontend changes: `npm test`, `npm run format:check`, `npm run build`, relevant Playwright scenarios and direct screenshot/interaction inspection. Shared navigation, persistence or domain changes require the full browser suite across Chromium and phone-sized WebKit.

Backend changes: `npm test` (fresh database and eight SQL suites; `test:fresh` is equivalent), API type checking, generated types; run `test:services` / `test:teams` when Storage, authorization, appointments, teams, handoffs or commercial/support contracts may be affected. Full verification commands and prerequisites are in [verification](docs/implementation/verification.md).

## Documentation ownership

- README: quick start and links, not a duplicate technical manual.
- `docs/implementation/architecture.md`: current structure, data ownership and command/lifecycle contracts.
- `docs/decisions/`: accepted architectural tradeoffs and consequences.
- `docs/reference/api.md`: common calling, error, retry and pagination conventions; generated types and SQL are authoritative signatures.
- Maintainer guide: file map and change recipes. Runbook: operations/recovery. Verification: evidence. Ledger/changelog: status/history.

Update both repositories when a contract crosses the boundary. Documentation links are relative where portable; do not embed workstation-specific paths in maintained onboarding instructions.
