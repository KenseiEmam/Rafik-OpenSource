# Revamp execution ledger

Updated 22 September 2026. **A working local web/backend foundation is implemented on `codex/revamp`; the full Rafik revamp is incomplete.** The user correctly rejected the narrow core as a complete replacement. Read [revamp coverage and corrected execution scope](revamp-coverage.md) before continuing. The E01–E12 statuses below describe only the initial slice, not whole-product completion.

| Unit | Status | Evidence / boundary |
|---|---|---|
| E01 Foundations | Implemented locally | Node/CLI/dependency pins, fresh Vite/Supabase configuration, synthetic reset, remote-link guard, generated types, CI definitions |
| E02 Minimal domain | Implemented and database-tested | Ten tables, explicit transactional commands, stable occurrences, immutable prescriptions, bounded values, unit/timezone rules, no orchestration triggers |
| E03 UI/UX | Initial slice implemented and visually inspected | Sample, basic client logging and basic coach tasks; Manrope/Noto Arabic; responsive light/dark/RTL; broader product surfaces remain missing |
| E04 Entry/Auth | Implemented and browser-tested | Useful public sample; email code in local test inbox; private verified invitation; guest work preserved and adopted after sign-in |
| E05 Durable recording | Implemented and fault-tested | IndexedDB writes, stable operation receipts, serial/cross-tab sync, offline recording, production shell cache, retry and explicit conflict recovery |
| E06 Plan/results correctness | Implemented and tested | Fixed publication revisions; started snapshots survive updates; actual set/note correction preserves completion; contextual feedback refreshes |
| E07 Coach work surface | Implemented core | Starter, duplicate/adapt, recoverable drafts, preview, publication, link invitation, explicit reassignment and actual-result review |
| E08 Content | Implemented | Eight bilingual exercises and two starter sessions, one canonical content source, generated seed/web outputs, documented asset provenance |
| E09 Necessary operations | Implemented locally | Truthful save states, bounded local diagnostics, help, data export/deletion, account settings; local mail only; no added worker/provider chain |
| E10 Verification | Local checks passed; physical-device/participant gates remain | See `verification.md` for exact browser/database/build coverage and WebKit offline-test method |
| E11 Hosting | Prepared, deferred | New-project release steps in `runbook.md`; no hosted project, deployment or old-backend change |
| E12 Usefulness/business observations | Materials prepared; not claimed as completed research | Demo, observation scripts, outcome ledger and iteration rules in `pilot.md`; no outreach/payments sent |
| Native app | Deferred as instructed | No application source changes |

## What changed

`RAFIK-FRONTEND` now contains the fresh Vue application, domain/persistence modules, generated API types, authored content, visual system, browser checks and production shell caching. Old source remains in Git at baseline `a0c723e`.

`rafik-api` now contains the fresh Supabase configuration, one local baseline migration, explicit commands, fixtures, regression scenarios and implementation documentation. The audit and historical live-backend evidence remain under `docs/revival`; its old-source links refer to baseline `652e9ee`.

`rafik-mobile` remains at its original application content. `rafik-worker` is unchanged apart from its pre-existing `.DS_Store` modification. All four branches are still `codex/revamp`. No commits or pushes have been made.

## Current architecture, not a final feature ceiling

One responsive web application and one Supabase backend. No migration of old users, restored legacy database, custom role/workspace hierarchy, automatic progression, AI/nutrition integrations, credit system, notification pipeline or native compatibility adapter. The local product provides an immediate useful sample and a complete coach-delivered training loop.

The earlier decision to treat the broad product inventory as merely optional was too restrictive. The corrected coverage register restores a broader execution backlog for clients, programming, progress, communication, nutrition, scheduling and teams. Simplify each useful job and its implementation; do not make its existence contingent on finding customers first. The initial manual plan-conversion pilot remains a service experiment; no automatic import is implemented.

## Next action for Codex

1. Execute the corrected R1–R5 backlog in `revamp-coverage.md`. First specify client/resource ownership and the expanded prescription/schedule contract, then complete the client workspace, exercise library and realistic programming flows.
2. Keep the visual direction the user likes. Extend real backend-backed tasks and recovery states, not just navigation or seeded screenshots. Record each capability as absent, partial, implemented or verified.
3. Complete integrated product and physical-device checks before declaring release readiness. Business observations remain separate evidence, not a substitute for missing features.
4. When moving beyond local-only work, follow the new-project hosted release gate. Never deploy synthetic Auth fixtures, reuse old credentials, or push main. Native stays deferred until the broader web/backend work is ready.

Detailed source/operation contracts are in `architecture.md`, local/deployment instructions in `runbook.md`, content provenance in `content.md`, and business observation materials in `pilot.md`.
