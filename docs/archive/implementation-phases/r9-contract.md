# R9: Organization services and role-specific analytics

Implemented locally, 23 September 2026. Acceptance evidence is in verification.md. Local web/API only.

## People and jobs

An administrator coordinates staff, groups and trainees through a week agenda. A trainer sees their assigned events and can create events for their assigned trainees. A designated assessor can record only the assessment they have been assigned, including participants whose ordinary trainer is someone else. A trainee sees only their own attendance/results. Independent coaching retains its separate appointments/check-ins/nutrition and gains a coaching analytics view.

## Model and boundaries

Organization groups contain fixed membership IDs; changing a group does not rewrite an already reviewed event roster. Templates define up to twelve numeric or text drills with stable keys, units and bounds; scheduled assessments take immutable snapshots. Per-trainee results have independent revisions and append-only correction history. An event has explicit staff and participants, timestamps, timezone, location, a fixed snapshot and optional recurrence-series identity. Events and results belong to their organization through staff departure.

Create one or up to eight weekly/fortnightly occurrences from an explicit timezone preview. Reject non-existent local times and show offsets for repeated-hour choices (the existing PostgreSQL timezone resolver uses the standard-time interpretation). Review the actual dates and participants before dispatch. Participant collision checks include organization events and independent booked appointments without exposing another context's details. Membership changes and writes share organization locks; sorted person/profile locks coordinate cross-context scheduling. Attendance starts only when the event begins. Cancellation never erases results; completed assessments must be corrected rather than cancelled. Single-event rescheduling preserves its identity and revisions; bulk future cancellation rechecks every affected event atomically.

## Analytics

Date filters are calendar dates in the viewer's profile timezone, inclusive from and exclusive next-day boundary. Completion plots count each session once at its first completion; corrections change actual values, not counts. Organization trainer scope uses current responsibility; admin scope covers the organization. Current roster workload/assignment gaps are explicitly current rather than retroactively attributed. Attendance excludes cancelled events and distinguishes unrecorded from absent/excused. Assessment comparisons require the identical definition snapshot and unit; each trainee retains their own series. Supply visible chart labels, table equivalents and links to source work. No invented revenue, retention score or staff quality ranking.

## Acceptance

Two organizations, combined staff/trainee identity, independent counterpart, a trainer reassignment, revoked assessor, conflicting simultaneous events, recurrence and cancellation, two trainees with different results, correction audit, sparse and no-data analytics, date/timezone boundaries, inaccessible foreign IDs, lost acknowledgement/reload, private subject export and maintained original workflows. Inspect phone/desktop, English/Arabic and light/dark, with operational primary actions reachable.
