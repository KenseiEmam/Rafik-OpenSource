# R19 — Staff tasks and daily follow-up

Purpose: replace generic overview actions with actual next work, before the package accounting implementation. The founder has now confirmed reservation/deduction/cancellation and individual no-show decisions.

Organization admins assign explicit tasks to active organization trainers, with title, optional instructions, priority and optional due date. Admins can edit/reassign/cancel; assigned trainers complete or reopen their tasks. Both roles see bounded, immediate results, counts and completed/cancelled history. Every change has an operation receipt and optimistic revision; reassignment/revocation is checked before receipt replay. No trainee or cross-organization task access.

Daily overview combines assigned/open tasks, completed training awaiting review and past scheduled events that still need an outcome. Reasons and direct actions are explicit. Do not automatically label past bookings as no-shows or trainees as clinically at risk. Upcoming events remain in the existing calendar-backed component. Admin analytics already exposes actual trainer workload; paid retention, makeup balances and satisfaction need their own truthful source and the session-package phase.

Architecture: one organization_tasks table and thin service using existing scoped/mutation/event primitives. No background job or generalized workflow engine. Forward migration only, no fixture reset. The same task read contract serves the overview and dedicated Tasks route; MemberPicker supplies active trainer selection. Existing calendar remains appointment source.

Focused acceptance: six browser cases, two API lifecycle groups and a 36-migration/eight-suite fresh installation pass. Integrated acceptance adds 118 browser journeys, 1,120 broad states and 27 units; the final dashboard audit was corrected and rerun separately on unchanged application sources. See the ledger and evidence/r19-verification.txt for the original failures and combined result.
