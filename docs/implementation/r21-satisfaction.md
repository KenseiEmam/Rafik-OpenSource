# R21 — Separate satisfaction signals

Status: implemented and accepted locally. The founder confirmed two separately reported measures: clients' satisfaction with their trainer and trainers' satisfaction with working at the organization. They specifically identified existing session satisfaction as a useful source for client satisfaction.

## Existing evidence

The original native workout completion page asks “Did you enjoy this workout?” and records `feel.enjoyment`, separately from exhaustion, difficulty, pump and comments (`rafik-mobile/lib/pages/my_program/workout_log/workout_complete/workout_complete_widget.dart`; `lib/flutter_flow/custom_functions.dart`, `feelsJson`). The retired mobile UI initializes enjoyment to 3. Do not carry a preselected neutral response into the revamp: missing feedback is unknown, not a rating. The current organization implementation was inspected: it stored effort and notes, but no explicit satisfaction response. No legacy data migration or native changes are required.

## Intended experience

Use one optional feedback action after an eligible completed session, tied to the participant and the actual training/session context. Surface session satisfaction as a client-experience signal with an explicit source label, response count and distribution; do not equate enjoyment, effort, exhaustion, attendance or subscription renewal with an overall trainer rating. Avoid asking a duplicate generic client survey merely to populate another chart.

Trainer workplace satisfaction is a different, explicit staff response. It must use a separate question, period, denominator and chart. Explain who can read feedback before submission; do not claim anonymity while storing named responses. Organization admins see authorized aggregate results, trainers see only their permitted client scope and their own workplace submission. No public ranking, cross-tenant sharing, fabricated testimonials or automatic external outreach.

## Acceptance

Check self-submission, eligible session ownership, one logical response with explicit corrections, reassignment/revocation, combined roles, independent-versus-organization scope, exports, empty/partial coverage, meaningful chart labels/table equivalents and EN/AR/phone/theme renders. Report response counts and missing coverage rather than treating nonresponse as neutral. Keep questions optional and avoid duplicating the future mobile completion flow.

## Implemented contract

The original enjoyment field informed the decision to collect an optional response at completion; no old values or preselected neutral ratings were imported. The current rebuild previously stored workout effort/notes but no explicit organization satisfaction response. A single feedback service now supports `calendar` (completed, present training participant), `workout` (own completed training log) and `workplace` (one own current UTC-month trainer response). The two session sources use the same satisfaction question but are reported separately. There is no duplicate generic client survey or claim that a session score measures overall trainer quality.

`organization_session_feedback` references exactly one same-tenant/member workout or calendar participant; `organization_workplace_feedback` has a member/month unique key. Explicit 1–5 scores have no default. Current authorization and source eligibility precede receipt replay; corrections use revisions. Attendance corrections exclude newly ineligible session ratings from reports without inventing replacement responses. Own feedback is included in account export. Workplace responses are account-linked, disclosed before submission, not claimed anonymous; only administrators receive the current-active-trainer aggregate.

`organization-feedback.ts` owns collection and subject reads. `experience-report.ts` aggregates source-specific coverage/distributions and explicitly linked package renewals. `AnalyticsPage` keeps delivery charts separate from the Experience & renewals view; ExperienceReport offers client/workplace/renewal sections. TrainerDelivery charts actual completed appointments plus an attendance table, credited to event staff, with co-led counting explained. Personal feedback is available from My feedback and optional completion links; the same explicit HTTP contract supports the later mobile client. Native changes remain deferred.

Session charts use the selected session dates and current roster. Workplace charts explicitly use the current UTC month/current active trainer denominator, independent of the trainee/date filters. Renewal reporting counts non-archived expired packages in the chosen window with a linked successor recorded by report end. It is neither proof of payment nor a customer-retention rate. Historical reports use current corrected records; they are not frozen historical snapshots.

## Verified result

**Local acceptance passed:** all 35 full-release gates, 122 browser journeys, 1,120 broad layout states, 27 web units, backend/domain/content/build/cache checks and a fresh 40-migration/eight-SQL-suite installation. A subsequent four-case Chromium/WebKit run expanded feedback/report coverage to 96 width/language/theme/engine states and repeated package/session-note recovery, with unchanged application sources. Actual desktop and Arabic 320px renders were inspected. [Receipt](evidence/r21-verification.txt) and [full report](evidence/r21-release-report.json) preserve commands, failures corrected and limits. Native apps, hosting/providers, physical devices and human/business outcomes remain unverified.
