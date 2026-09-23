# Rafik revamp working context

- The current work is a clean local rebuild on `codex/revamp`. Never push main. Follow any later user instruction that explicitly changes the phase.
- Start with `docs/implementation/ledger.md`, then `architecture.md`, `runbook.md` and `verification.md`. `docs/revival` contains the completed audit and business/design rationale; old source links refer to the recorded baseline commits.
- The companion web checkout is `../RAFIK-FRONTEND`. Native app and worker source are deferred. Do not resurrect old runtime services or require legacy data migration.
- Local project: `rafik-revamp-local`. The retired hosted project must not be used by the new runtime. Local scripts reject linked remote metadata.
- Node 22.16.0; `npm ci`, `npm start`, `npm run reset`, `npm test`. Reset is destructive only to the new local fixtures. Never apply synthetic seeds to hosting.
- Edit content in `content/starter.json`, then `npm run content`. Generate web types with `npm run types` after a schema reset.
- Keep writes as explicit bounded commands. Published versions and started prescriptions are immutable. Completion retries and note/set corrections must not create another completion or progression.
- Do not mark physical-device use, real retention/payment, remote CI or hosting verified from local automated tests. Record concrete results and limits in the implementation ledger.

- Documentation is part of every change: update `CHANGELOG.md` and `docs/implementation/ledger.md`; update `architecture.md` for schema/API/lifecycle changes, `maintainer-guide.md` and README for file/workflow changes, `runbook.md` for operations, and `verification.md` with actual checks and limits. Commit matching code and docs together. Do not leave stale phase status or treat an old test result as verification of new code.

## Engineering and product completion rules

- Follow the backend `CONTRIBUTING.md` definition of done and `docs/README.md` documentation structure. Keep current architecture/reference docs accurate; phase logs are history, not the onboarding manual. Record durable architectural tradeoffs as ADRs.
- Audit rendered user tasks before redesigning. Preserve the accepted visual identity while fixing hierarchy, navigation, interaction and recovery. Inspect realistic long/populated and empty/error states, phone/desktop, keyboard, Arabic/RTL and both themes.
- A route, screenshot, test count or accessibility scan alone does not prove a good UX. Primary actions must stay reachable; optional controls should not overwhelm the task. Test what a person can actually accomplish, including interruption and correction.
- Implement complete vertical features: authorization/data lifecycle, durable state/retry, discoverable UI, failure recovery, review/history/export and downstream analytics where relevant. Do not mark a partial demo as the revamp.
- Fix observed regressions before extending scope. Add regression coverage for consequential failures, inspect the real rendered result, update matching docs, and state remaining release/product evidence limits honestly.
