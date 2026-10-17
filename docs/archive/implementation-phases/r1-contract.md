# R1 daily coaching contract

Implementation phase, 22 September 2026. Extends the existing foundation and visual system. No remote backend or native changes.

## Ownership and client workspace

`coach_clients` remains the relationship identity. A separate `client_context` record stores goals, constraints and private coach notes, readable/writable only by that coach. A client with two coaches does not expose either coach's notes to the other. Context updates use an expected revision and replay identical content safely. Archiving a relationship prevents new assigned session starts; existing sessions and history remain available. Reactivation preserves assignments and historical records. Archive/reactivate and session start serialize on the relationship row.

The client workspace combines Overview, Plan and History without requiring new setup fields from the client. The roster supports search and active/archived views. Assignment changes describe effects on future starts; started prescriptions remain unchanged.

## Catalog and prescriptions

Shared exercises remain source-controlled. Coach exercises have `owner_id`, revision and active state, with explicit save/archive commands. Anonymous users see only the shared active catalog. Coaches see shared content and their own private exercises. Publish captures exercise names, instructions and optional HTTPS media links in the prescription; later edits, retirement or owner deletion cannot erase training history. Media is a link, not a new upload/storage subsystem in R1.

Schema 1 remains readable. Schema 2 adds a cycle of 1–12 weeks, day week/offset and optional rest days; exercise kind (`strength`, `timed`, `distance`), optional group label, duration/distance/effort targets and optional per-set targets. Existing defaults remain for simple strength programming. Every published plan has at least one training day. Bounds remain explicit: at most 84 day slots, 12 exercises per training day, 10 sets per exercise. A schedule slot cannot be duplicated in the same cycle. Units: seconds, metres, kg/lb; RPE target 1–10 when supplied. Values are validated on the server, not trusted from the editor.

The editor progressively exposes advanced fields. Library search and custom creation are available in the web UI. Clients see names/instructions from their immutable prescription. Group labels explain circuit/superset order without changing completion semantics.

## Schedule and recording

An assignment supports flexible day selection or a repeating cycle, start date and optional end date. Cycle day offsets are relative to the assignment start date, not the coach's timezone. The client profile timezone determines today. Changing the assignment affects future starts only. Schedule changes and session starts lock the same assignment.

R1 schedule preview derives a bounded date window from the plan; no background creation of future sessions. A planned occurrence has assignment ID, original scheduled date and day ID. Reschedule/skip exceptions have an explicit command and cannot alter started occurrences. Moving one occurrence does not shift the rest of the cycle. Flexible sessions retain the existing one-day-slot-per-date identity.

`set_entries` gains optional duration, distance and effort actuals. Completion requires a positive actual appropriate to the exercise kind; strength requires reps, timed requires seconds, distance requires metres. Receipts include the full payload. Corrections preserve completion time. Old schema-1 requests remain accepted. Previous performance finds the latest completed actual for each requested exercise, not merely the last session.

## Verification

Database scenarios cover cross-coach context/catalog access, concurrent revisions, archive/start eligibility, immutable catalog snapshots, rich target validation, cycle/date boundaries, exceptions, recording and completion retry. Browser tasks cover client context and archive, custom exercise → multiweek mixed plan → assignment → client recording → coach review. Inspect actual English/Arabic desktop/phone renders. Existing core/fault tests remain regression requirements.

This is an implementation contract, not evidence that every item has shipped. Record concrete implemented scope and outstanding items in the ledger after testing.
