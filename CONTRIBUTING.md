# Contributing to Rafik web

Follow the shared [engineering workflow and definition of done](../rafik-api/CONTRIBUTING.md). The [documentation index](../rafik-api/docs/README.md) links the current architecture, ADRs, API contracts, maintainer guide and operations.

The adjacent backend checkout is required for local integration tests, generated content and API types. Use `src/features/` for product behavior, `src/lib/` for small shared domain/storage adapters and `src/components/` for genuinely shared presentation. Preserve Vue/TypeScript and the established bilingual visual system. Do not add a store/framework layer merely for one feature.

Run `npm test`, `npm run format:check`, `npm run build` and relevant Playwright tests. Shared shell/storage/domain changes require the complete browser suite. Review actual UI and task behavior; Axe and overflow checks supplement that review. Update both repositories’ changelogs and the implementation ledger with every checkpoint.
