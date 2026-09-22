# Rafik revamp working context

- The current work is a clean local rebuild on `codex/revamp`. Never push main. Follow any later user instruction that explicitly changes the phase.
- Start with `docs/implementation/ledger.md`, then `architecture.md`, `runbook.md` and `verification.md`. `docs/revival` contains the completed audit and business/design rationale; old source links refer to the recorded baseline commits.
- The companion web checkout is `../RAFIK-FRONTEND`. Native app and worker source are deferred. Do not resurrect old runtime services or require legacy data migration.
- Local project: `rafik-revamp-local`. The retired hosted project must not be used by the new runtime. Local scripts reject linked remote metadata.
- Node 22.16.0; `npm ci`, `npm start`, `npm run reset`, `npm test`. Reset is destructive only to the new local fixtures. Never apply synthetic seeds to hosting.
- Edit content in `content/starter.json`, then `npm run content`. Generate web types with `npm run types` after a schema reset.
- Keep writes as explicit bounded commands. Published versions and started prescriptions are immutable. Completion retries and note/set corrections must not create another completion or progression.
- Do not mark physical-device use, real retention/payment, remote CI or hosting verified from local automated tests. Record concrete results and limits in the implementation ledger.
