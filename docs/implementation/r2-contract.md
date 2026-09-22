# R2 ongoing coaching contract

Implementation owner: Codex. Local web/backend only; preserve R1 data and visual direction.

## Workflows and boundaries

- Progress uses acknowledged completed sessions and completed actual sets, never targets. Range is at most one year. Strength load converts lb to kg explicitly; timed/distance values stay seconds/metres. No composite fitness score. Current cycle adherence is a separate 42-day projection of the current assignment configuration, with completed, in progress, skipped, rest and outstanding counts; it is not a historical adherence promise after a schedule edit.
- Optional weight/waist records have explicit units, dates, revision-checked correction and removal. A record is personal or explicitly shared with one coaching relationship. Coaches cannot insert body measurements on a client's behalf.
- Reusable check-in/assessment definitions contain 1–10 ordered text, number or yes/no fields. Number fields declare a unit (possibly blank) and optional bounds. Each save increments a definition revision. Assignment copies title, kind, revision and fields; editing a template never rewrites an assigned question.
- A coach assigns one occurrence or 2–12 weekly/fortnightly occurrences in one bounded transaction. No scheduler or unbounded recurring jobs. Each occurrence has its own due date in the client's calendar, server draft, original submitted timestamp and revision. The client can save drafts, submit, then correct. Corrections retain submitted_at and clear the previous review; the coach reviews a specific revision with optional written feedback. Cancel only unsubmitted requests. Archived relationships retain history but block new assignment, response writes and messages; coach review of existing submissions remains available.
- Direct conversation belongs to one relationship. Text (1–4,000 characters), optional session/request context and stable caller message UUID. Retrying the same payload returns the same message; reusing the UUID with different content fails. Context must belong to that relationship. Cursor uses server sequence, moves forward only through observed messages, and cannot mark future messages read. Latest 50 and older-page loading keep the UI bounded. Foreground refresh replaces a realtime infrastructure requirement; failures retain drafts and offer retry.
- In-app work links derive from unreviewed responses, due requests and unread messages. No email, push, fabricated counts or provider side effects.

## Ownership, storage and maintenance

Add coaching_forms, coaching_requests, measurements, messages and conversation_reads. RLS provides participant reads; explicit commands provide all writes. Foreign keys cascade on account/relationship deletion, session context is nullable after deletion. Local drafts are namespaced to account and record. Export includes the new records. No generic event store, form-rule engine, chart dependency or worker.

Test ownership (including unrelated coach/client), invalid answers/units, snapshot immutability, bounded recurrence/retry, stale edits/review, correction timestamps, message deduplication/context/cursor, archive behavior, fresh install and browser journeys in both engines. Inspect desktop/phone, Arabic/English, light/dark renders. Physical device, hosting and real retention remain unverified.
