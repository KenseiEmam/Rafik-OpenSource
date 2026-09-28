# R21 — Separate satisfaction signals

Status: planned, not implemented. The founder confirmed two separately reported measures: clients' satisfaction with their trainer and trainers' satisfaction with working at the organization. They specifically identified existing session satisfaction as a useful source for client satisfaction.

## Existing evidence

The original native workout completion page asks “Did you enjoy this workout?” and records `feel.enjoyment`, separately from exhaustion, difficulty, pump and comments (`rafik-mobile/lib/pages/my_program/workout_log/workout_complete/workout_complete_widget.dart`; `lib/flutter_flow/custom_functions.dart`, `feelsJson`). The retired mobile UI initializes enjoyment to 3. Do not carry a preselected neutral response into the revamp: missing feedback is unknown, not a rating. The current organization session implementation must be inspected before connecting a new collector. No legacy data migration or native changes are required.

## Intended experience

Use one optional feedback action after an eligible completed session, tied to the participant and the actual training/session context. Surface session satisfaction as a client-experience signal with an explicit source label, response count and distribution; do not equate enjoyment, effort, exhaustion, attendance or subscription renewal with an overall trainer rating. Avoid asking a duplicate generic client survey merely to populate another chart.

Trainer workplace satisfaction is a different, explicit staff response. It must use a separate question, period, denominator and chart. Explain who can read feedback before submission; do not claim anonymity while storing named responses. Organization admins see authorized aggregate results, trainers see only their permitted client scope and their own workplace submission. No public ranking, cross-tenant sharing, fabricated testimonials or automatic external outreach.

## Acceptance

Check self-submission, eligible session ownership, one logical response with explicit corrections, reassignment/revocation, combined roles, independent-versus-organization scope, exports, empty/partial coverage, meaningful chart labels/table equivalents and EN/AR/phone/theme renders. Report response counts and missing coverage rather than treating nonresponse as neutral. Keep questions optional and avoid duplicating the future mobile completion flow.
