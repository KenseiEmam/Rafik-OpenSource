# ADR 0025: Primary and scoped supporting coaches

- **Date:** 19 October 2026
- **Status:** Accepted and implemented in Release 1b
- **Decision owner:** Founder (confirmed 19 October 2026)

## Context

Each athlete membership had one optional responsible coach in `workspace_members.trainer_id`. Almost all coach access ran through that column: plans, sessions, nutrition, participation status, follow-up and analytics. University athletes are often coached by several people, for example a sport coach and a strength-and-conditioning coach. Release 1a added sports and coaching specialties as descriptive labels.

## Options

1. **An equal coaching team:** every linked coach gets today's full assigned-coach access.
2. **A primary coach plus supporting coaches:** supporting coaches are scoped to a sport or specialty and get narrower access.
3. **Keep one coach.**

## Decision

Use option 2.

- **Links:** `organization_coaching_links` records each coach link with a kind (`primary` or `supporting`), created and ended times and actors, and a revision.
  - Each athlete has at most one active primary link.
  - Each coach has at most one active link to the same athlete.
  - A supporting link names the sport or specialty it covers. The coach must cover it; for a sport, the athlete must take part in it.
- **Primary coach:** keeps today's assigned-coach meaning, including for [ADR 0017](ADR-0017-injury-status-minimum.md). That covers plan assignment, workout review, nutrition, participation status, follow-up tasks and analytics.
- **Supporting coach ("training" scope):** can read the athlete's training plans, workout sessions, assessment history and program media, and can include the athlete in their own events, training groups and messages. From Release 1c they can also add, replace and end plans labelled with their linked sport. They get no nutrition, participation status, unlabelled plan changes, workout review, follow-up or analytics.
- **Event staff authority is unchanged:** staff record attendance and results for their own events. The Android field API therefore needs no change.
- **Who manages links:** only administrators create or end links. The primary coach still changes through `assign-trainer`.
- **Server checks:** `recipient()` takes an explicit scope and defaults to `primary`, so any path not deliberately widened keeps the narrower meaning.
- **`trainer_id` mirror:** `trainer_id` stays a mirror of the active primary link. A database trigger keeps links consistent on every write path, including seed data and the SQL account-deletion function. It derives the primary link from `trainer_id` and ends links when a membership is deactivated or loses its role. Removing a sport from either side ends the supporting links that depended on it.

## Trade-offs

- **Narrowed in Release 1c:** plans now carry an optional sport. A supporting coach reads and writes only plans, and the sessions recorded against them, labelled with their linked sport. Events still have no sport, so their assessment history is limited to events they staffed. Unlabelled plans belong to the primary coach.
- **Intentional visibility exception (overlap warnings):** when a coach assigns a plan, the response lists every other active plan for that athlete whose dates overlap, including plans outside a supporting coach's sport. This helps coaches coordinate the athlete's combined load. The exception is limited to each plan's **title, goal, start date and end date**. It includes no plan ID, prescription, sessions or results, and does not make those plans readable through any other endpoint. A focused test asserts the exact fields.
- **Two layers to keep in step:** SQL queries that filter by `trainer_id` mean the primary coach. Training-scope reads add an `EXISTS` on active links. Both must change together.
- **Historical primary links:** links created by the backfill or trigger record the coach as creator, and links the trigger ends have no ending actor. The API records the acting administrator for its own changes.
- **One link per coach and athlete:** a coach who covers two sports for the same athlete holds one supporting link, for the sport chosen first.
