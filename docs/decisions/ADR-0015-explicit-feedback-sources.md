# ADR 0015: Keep session experience and workplace satisfaction separate

Status: accepted and implemented locally, 28 September 2026.

## Context

The founder requires both athlete experience with coaches and trainer workplace satisfaction, and identifies explicit session feedback as a useful input. Workout completion, scheduled-session completion, attendance and effort are different signals; none can stand in for satisfaction.

## Decision

Collect an optional explicit score for eligible completed sessions, identifying workout versus scheduled-session source. Do not default to a neutral value or append another generic client questionnaire. Report source, eligible count, response count and distribution; no overall trainer score is inferred. Store one logical response per source/subject, revisable with optimistic concurrency and durable retry.

Workplace feedback is one account-linked trainer response for the current UTC month. Display its visibility before submission. Admin aggregates use the current active trainer denominator; trainers see their own responses, never coworkers’ responses. It is deliberately separate from client filters and selected session dates. Later native clients reuse the same HTTP contract.

## Options and trade-offs

- **Combine client and workplace ratings into one trainer score:** rejected because the two audiences and questions measure different experiences.
- **Infer satisfaction from attendance, completion or effort:** rejected because those signals do not represent a person's expressed experience.
- **Collect optional explicit feedback and report each source separately:** selected; response rates can be low, so eligible and respondent counts must remain visible and missing responses stay unknown.

No survey vendor, identity layer, data warehouse or new worker is needed.
