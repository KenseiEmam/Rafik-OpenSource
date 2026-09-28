# Gym-first corrections — 28 September 2026

Status: in progress. This founder direction supersedes independent-coach acquisition in the earlier revival plan. Preserve working APIs/history and later trainee-app contracts; no native implementation or hosting in this change.

## Ordered delivery and acceptance

1. Product entry and shell: organization-first homepage without generated photography/workout CTA; dark default with explicit preference preserved; unchanged logo asset; role switcher only for multiple staff contexts; support has a way back; settings affordance must match its behavior. Add Tailwind utilities without Preflight or class collisions. Verify actual EN/AR, desktop/tablet/phone and light/dark renders.
2. Authoring and navigation repairs: separate nutrition example-plan view, visible program description/presentation and set table, clearer weekly repeat/rest-day semantics, visible superset grouping; conversation selection retains inbox search/position and stable list while loading only thread. Verify interrupted drafts and navigation.
3. Exercise ownership and uploads: multiple body/muscle areas and equipment, controlled movement vocabulary, trainer-private versus organization-wide catalog; immutable directly uploaded media with authorized reads and resource management. Preserve published snapshots and existing catalog/filter compatibility; test cross-org and other-trainer rejection.
4. Sessions/packages: organizational package entitlements and reservations, standalone sessions, staff/trainer booking, completion/cancellation/no-show/makeup policies, in-session check-ins/appointment details. Reuse calendar events rather than build a parallel scheduler. Role checks, conflict/receipt safety and balance audit are required.
5. Calendar and actionable dashboards: month grid with visible bookings/day summary, immediate results, upcoming/makeup sessions, explainable attention queue, admin-assigned trainer tasks, workload/completion/renewal views. Satisfaction must come from explicit feedback, never inferred from activity. No invented metrics.
6. Integrated verification/documentation: domain/permission and real browser workflows, both engines, long/empty/error states, RTL/themes, source/build/cache checks. Commit accepted phases on codex/revamp; preserve preview records, no push/main changes.

## Decisions

- Keep existing week-based prescriptions and clarify repetition with the equivalent day count. Changing the interval schema across published plans, assignments and offline started sessions is disproportionate for this request; the founder explicitly permits clear weeks. Empty slots are rest days, explicit rest days remain supported.
- Gym staff are the public web audience. Personal/trainee routes stay for developer examination and the later mobile contract. Organization memberships do not get collapsed into independent coaching.
- Founder confirmed organization exercise sharing is within its own organization. Do not expose organization-owned assets across tenants.
- Package proposal: reserve at booking, consume at completion, release on cancellation; staff must explicitly choose whether a no-show consumes a session. Package totals and reservations cannot be overspent by concurrent bookings. Founder requested being asked again when implementation reaches this part; do not decide that policy yet.
- Tailwind Vite integration uses a prefix, no Preflight, semantic existing tokens and theme attribute. Existing Reka/Unovis/Vue and semantic CSS remain in place. Official references: https://tailwindcss.com/docs/installation/using-vite and https://tailwindcss.com/docs/preflight.

## Scope boundaries

No deletion of independent history, generalized access-control framework, rewritten sync infrastructure, invented satisfaction/retention claims, native tablet/client app work, real provider billing or remote deployment. Track implementation and concrete evidence below as work lands; unchecked items are not completed.

## Accepted checkpoint R17

Items 1–2 and the month-calendar portion of item 5 are implemented locally. Both-engine focused acceptance passed 32 cases, plus 27 units and build/cache/format checks. See the ledger and R17 receipt. The exercise/media, package, operational dashboard and integrated-release items are still open.
