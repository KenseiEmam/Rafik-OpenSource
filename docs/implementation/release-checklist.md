# Release acceptance checklist

This checklist is a gate, not evidence that a release has happened. Record links/results in verification and the ledger.

## Local implementation gate

- Fresh install and upgrade from the current preview both pass; generated types/content match.
- Run the guarded `npm run verify:release -- --full` command locally and inspect its per-step report; a prerequisites-only check is insufficient.
- Existing regression suites pass alongside meaningful new lifecycle/failure tests.
- New client accepts a plan, trains, resumes after interruption, completes/corrects and sees coach feedback; coach can author, assign, review and follow up.
- Check the [feature verification map](feature-verification-map.md), including inbox/list/detail/back/no-match/error states, internal clipping, short phone heights and both browser engines.
- Long conversations, roster/history, plans and optional tools work at phone and desktop sizes in English/Arabic, light/dark; inspect screenshots and actual interactions, keyboard and focus.
- Team consent, departure/handoff and resource revocation preserve correct access and history.
- Platform grants are separate, operational state changes are audited and revoked authority cannot replay a command. Large-roster selection/history remain bounded and complete through continuation.
- Disposable browser fixtures leave the preview untouched; private-byte cleanup and database-plus-byte restore have recorded local results.
- Maintained docs describe current architecture/workflow with no contradictory scope claims.

## Before hosting or real pilot release

- Create a new hosted project and follow the runbook; no retired credentials or synthetic identity/data/simulator fixture.
- Verify real email code delivery, redirect configuration, rate limits, secrets, backup/restore, private object-storage policy/lifecycle and failure observability on hosting.
- Verify physical iOS/Android browser keyboard, touch, suspension/resume, offline/reconnect and accessible assistive-technology behavior. Emulation is insufficient.
- Verify deployed CI/build and rollback/forward recovery procedure.
- Any enabled payment/notification/calendar adapter needs its own real end-to-end acceptance; do not present a local simulator as a commercial service.
- Observe representative people completing tasks without coaching. Record task completion, friction and repeat use; do not infer usefulness or retention from automated tests.

Native work remains deferred until the broader web/backend is ready. Business outcomes remain separate from engineering completion.
