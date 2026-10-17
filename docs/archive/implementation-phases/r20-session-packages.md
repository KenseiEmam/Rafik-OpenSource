# R20 — Organization session packages

Status: historical; retired 16 October 2026. The founder's university-first direction removes this gym accounting feature. Migration `202610161400_remove_legacy_session_packages` deletes package data, its balance view and event funding/deduction columns. The workflow and acceptance below describe prior behavior only.

## User workflow

An administrator assigns a named package with a fixed session allowance and validity dates to an organizational trainee. Staff can see available, reserved and used sessions before booking. Trainers book only for their authorized roster and themselves; administrators can assign organization trainers. A booking identifies each participant's package or explicitly stands alone. Independent sessions have a reason (trial, makeup, prize or other) and never reserve or deduct subscription allowances. Repeated bookings reserve one allowance per occurrence and participant atomically.

The existing month calendar remains the appointment source. A session detail contains staff, trainees, appointment information, attendance/check-in and session notes. Completion consumes present participants' reserved allowances. Absent participants require an explicit charge/release decision; excused participants and cancelled bookings release their allowance. Corrections remain possible with current authorization, revisions and an auditable explanation; they cannot overspend a package.

A replacement action uses the same calendar composer and explicitly identifies whether it is another package-funded booking or an independent makeup session. The founder clarified that independent trial, makeup and prize sessions must not affect subscription allowances. Do not infer funding from the session label or introduce an independent makeup credit balance. Independent sessions never invent a payment.

## Architecture and boundaries

Reuse `organization_events`, `organization_event_people`, workspace locks, operation receipts and activity history. Add organization-owned packages and scoped participant funding references. Derive reserved/consumed amounts from the authoritative event/attendance state instead of maintaining an independently mutable balance. Check capacity and validity in the same transaction as booking or attendance correction. Current membership and roster/event responsibility must be checked before receipt replay.

Package dates describe entitlement validity, not proof of money collected. Renewal/retention views must use explicit package records and disclose their definition. Actual revenue, external subscriptions and trainer satisfaction cannot be inferred from bookings or package allowance. The founder confirmed two separate explicit feedback measures: client satisfaction with their trainer and trainer satisfaction with working at the organization. Inspect and reuse existing session satisfaction as an input to client satisfaction; keep its source and response count explicit and avoid duplicate questionnaires.

## Acceptance before completion

Verify same-tenant/member package references; staff/trainee and reassignment boundaries; concurrent final-slot bookings; exact retry after a lost acknowledgement; multi-occurrence rollback; cancelled reservation release; completion/no-show choices; attendance corrections; date changes and expiry; standalone bookings; task/calendar navigation; scoped drafts and recovery. Inspect real desktop, tablet and 320px Arabic layouts, both themes/engines. Preserve preview records and published training history; commit the accepted phase on `codex/revamp`. No native app, provider payments or hosting.

## Implementation and evidence

Organization packages now track explicit trainee entitlements, derived available/reserved/used balances, validity dates, auditable allowance corrections and linked renewals. Calendar booking reserves only an explicitly selected package; completion consumes present/charged absent sessions, cancellation/excused/released no-shows release, and independent trial/makeup/prize/other sessions never affect allowances. Staff session details include check-in timestamps and durable notes; the overview surfaces missed sessions without a replacement. Reuses workspace transactions/receipts and existing calendar events; no parallel scheduler or payment processor.

`organization-packages.ts` owns entitlement reads/commands; `organization-calendar.ts` validates participant funding in the same workspace transaction. The SQL balance view has no independent write path. OrganizationPackages, PackageFunding and SessionNote own the web workflows. Applied migrations are append-only: the follow-up renewal-key migration aligns Prisma’s composite relation with its defining unique key. Generated Prisma/web types are synchronized. See [R20 receipt](../../../verification/receipts/r20-verification.txt).
