# ADR 0015: Keep session experience and workplace satisfaction separate

Status: accepted, 28 September 2026.

The founder requires both client satisfaction with trainers and trainers’ workplace satisfaction, and identifies existing session feedback as a useful input. Original native enjoyment, exhaustion and difficulty are distinct fields; activity or effort cannot stand in for satisfaction.

Collect an optional explicit score for eligible completed sessions, identifying workout versus scheduled-session source. Do not default to a neutral value or append another generic client questionnaire. Report source, eligible count, response count and distribution; no overall trainer score is inferred. Store one logical response per source/subject, revisable with optimistic concurrency and durable retry.

Workplace feedback is one account-linked trainer response for the current UTC month. Display its visibility before submission. Admin aggregates use the current active trainer denominator; trainers see their own responses, never coworkers’ responses. It is deliberately separate from client filters and selected session dates. Later native clients reuse the same HTTP contract.

Use explicit linked package renewals as an operational count only. Do not name it paid retention or revenue. No survey vendor, identity layer, data warehouse or new worker is needed.
