# Testing

Use the smallest check that covers the changed behavior. Run commands from the repository root unless a step says otherwise. These checks establish local behavior only; they do not prove production readiness, legal compliance, physical-device behavior or human usability.

## Test layers and commands

Field API/queue changes use `npm run mobile:acceptance` on Node 24 with the local Docker database running. It migrates a disposable database, starts its own API, checks native auth/receipts/history/conflicts/revocation and removes its resources. It does not prove native SQLCipher, app process death, sharing or rendered usability. Use `-- --device` only for an intentional device pass and finish it with `done`/Enter. See [Android acceptance](../development/android.md#focused-checks) and [actual evidence](../verification/README.md).

Swagger-only changes use `npm run test:api-docs --workspace @rafik/backend`: two isolated checks cover HTTP routes/assets/headers and viewer configuration, both URL prefixes, native request headers, cookie omission, same-origin enforcement and production reference-only behavior. This does not verify authentication against a database or native-device workflows.

| Layer                     | Command                                                                                             | Coverage                                                                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend unit tests       | `npm test`                                                                                          | Vue/TypeScript unit and component behavior.                                                                                                                                                             |
| Frontend typecheck/build  | `npm run typecheck` and `npm run build`                                                             | Type correctness and production web bundle.                                                                                                                                                             |
| Frontend browser journeys | `npm run test:e2e`                                                                                  | Serial Playwright journeys through the isolation wrapper; disposable fixtures/services are cleaned up by the runner.                                                                                    |
| Backend typecheck         | `npm run backend:typecheck`                                                                         | TypeScript API and domain modules.                                                                                                                                                                      |
| Android typecheck         | `npm run typecheck --workspace @rafik/mobile`                                                       | Native source and queue-test TypeScript; not a native build.                                                                                                                                            |
| Android field queue       | `npm run test:queue --workspace @rafik/mobile`                                                      | Real Node SQLite transactions, score drafts/dependencies/corrections, completion/eviction, disk restart, exact retries, owner isolation and failure recovery; not Android SQLCipher or API integration. |
| Backend API               | `npm run test:api`                                                                                  | HTTP, identity, authorization, API and data lifecycle contracts against local services.                                                                                                                 |
| Focused backend workflow  | `npm run test:organization-injuries`, `npm run test:organizations`, or the relevant `test:*` script | The selected domain workflow and failure/security cases. Use only the script relevant to the change.                                                                                                    |
| Fresh database            | `npm run test:fresh`                                                                                | Installs migrations, runs a rollback-isolated legacy multi-role normalization scenario, then runs the SQL suites against a disposable database; does not reset the preserved local preview.             |
| Content                   | `npm run content:check`, `npm run test:catalog`                                                     | Canonical content and catalog/media contracts.                                                                                                                                                          |
| Documentation links       | `npm run docs:check`                                                                                | Local Markdown links across maintained monorepo docs.                                                                                                                                                   |
| Release guard             | `npm run test:release`                                                                              | Release configuration guard tests; not a deployment rehearsal.                                                                                                                                          |

Use `npm run format:check` only when formatting/source files changed or when the task requires the repository-wide formatting gate. Do not run unrelated checks to pad evidence.

## Browser and service prerequisites

The isolated browser wrapper owns disposable services, fixtures and cleanup. Do not reset or reseed the shared local preview for browser tests. Keep full browser suites serial. Inspect final screenshots when a layout or visual claim is part of acceptance; generated screenshots alone are not visual review.

Backend API and workflow tests use disposable local identities/records; the fresh-database harness creates its own database, applies migrations and drops only that database. Browser runs use an isolated database, files directory, API and web ports. They must not rely on sample-account pollution or remove unrelated preview data.

For direct `test:e2e:running` diagnostics, first start the local API and web dev server on 5173 plus a production preview on 5174. Use backend/API-focused scripts when the change is server-only. Never allow a test fixture to depend on prior sample-account pollution.

## Coverage boundaries

- Browser emulation does not prove physical phone behavior, native app behavior or assistive technology behavior on hardware.
- Automated checks do not establish that a coach or athlete can complete a task without help. Use the [local coach walkthrough](coach-walkthrough.md) for a personal first pass; it is not a substitute for university review or external user observation.
- Local Compose results do not establish remote CI, production alert delivery, or safe hosted upgrades/rollback.
- The [feature verification map](feature-verification-map.md) describes workflow coverage and open evidence limits. Actual recent results are in [verification](../verification/README.md); machine-readable outputs are under [`../verification/receipts/`](../verification/receipts/).
- Still needed outside automated local tests: physical phone and assistive-technology checks, university coach/athlete task observation, alert delivery, and a disposable production-profile upgrade/rollback rehearsal. See [known issues](../known-issues/README.md).
