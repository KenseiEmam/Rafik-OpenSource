# API conventions

The browser calls the Node API at `/v1`; `RAFIK-FRONTEND/src/lib/backend.ts` is the sole transport adapter. `database.types.ts` is generated from PostgreSQL signatures/row shapes by `npm run types`; domain JSON interfaces remain in feature modules. The API uses Prisma with the restricted PostgreSQL application role. Database constraints and explicit transaction functions remain authoritative.

## Routes and authentication

- `POST /v1/auth/request-code`, `verify-code`, `logout`; `GET /v1/auth/session`. Codes are single-use, expire after ten minutes and permit five guesses. Sessions are opaque HttpOnly, SameSite cookies backed by hashed tokens. Browser requests include credentials.
- `POST /v1/commands/:name`: named, granted domain function with JSON arguments. The server registry controls identifiers and casts; values are bound. Operator-only commands are unavailable.
- `GET /v1/queries/:table`: authorized row projection through RLS. Optional `column`/`value` equality filter, `offset`, `limit` (maximum 500). Internal operation/settings tables are not exposed. The browser helper fetches pages for complete authorized lists.
- `GET /v1/conversations/:relationship?before=<sequence>`: newest 50 messages, exclusive older cursor. Render chronologically. `GET /v1/appointments/upcoming?coach=true` returns the next three authorized bookings in seven days.
- `PUT`, `GET`, `DELETE /v1/files/:encodedPath`: immutable upload, authorized download, recoverable byte/metadata cleanup. JSON requests are capped at 1 MiB; private files at 10 MiB. Owner registration controls type, path and size.
- Local-only `/v1/auth/local-preview`, `/local/inbox`, `/local/mail`; `/health` checks database connectivity. These adapters cannot start in production configuration.

Mutation requests require `X-Rafik-Client: web` and an allowed origin. SQL actor settings are local to each transaction, never caller-supplied credentials. Direct table writes and operator actions are not browser APIs. The local operator script has a separate guarded database path.

## Response, retry and errors

Commands return JSON scalar/row or an array for a set-returning function. Errors are `{message: <stable code>}` with HTTP status: invalid values 400, unauthenticated 401, forbidden 403, unavailable 404, conflicting write 409, rate limit 429, unexpected service failure 500. Never expose SQL or credentials in responses.

Compare-and-swap writes use the acknowledged revision. Stable-ID commands persist exact ID/payload before sending. Network errors and 5xx outcomes are ambiguous and preserve that command for replay. Confirmed 400/403/409/422 rejection unlocks correction. A different payload with the same receipt ID is rejected. The friendly bilingual mapping is `src/lib/i18n.ts`; do not replace contextual errors with generic success.

Publications and started sessions are immutable server-selected snapshots. Preserve prior device records and history when adding optional JSON fields. Review validator, receipt, queue, editor, review/progress, export and copying together.

## Dates and privacy

Training schedules use client-local calendar dates. Appointments use UTC instants plus original IANA timezone. Analytics compare actual values of the same kind with explicit units/denominators. Messages are participant-scoped; foreground polling is not external notification delivery. API responses/private bytes are `no-store`; the service worker caches only static assets.

## Organization membership API (R7A2)

- `GET /v1/contexts`: current authorized personal/independent/organization role destinations and separate operator grant.
- `POST /v1/workspaces`: explicit creation, fixed kind/name and caller UUID.
- `GET /v1/workspaces/:id?view=admin|trainer|trainee`: current-role projection; no personal profile disclosure.
- `POST /v1/workspaces/:id`: `invite`, `revoke-invite`, `member`, `assign-trainer`, `rename`, `close`; operation UUID, revision where applicable, current admin authority checked before receipt replay.
- `GET /v1/organization-invitations/:token`: minimal organization/role preview, no intended email. `POST` accepts only the verified intended identity.

See [membership contract](../implementation/r7a2-contract.md). These Prisma-internal tables have no generic browser row grants. Closure preserves records while removing access; an exact closure retry confirms the old result. Organizational programming and service contracts are separate subsequent work.

## Scoped programming

`GET /v1/workspaces/:id/programs?view=admin|trainer|trainee` supports `search`, `offset`, `program` or `version`; list pages contain 24 programs. `POST` supports explicit save/publish/archive/listing commands with operation UUID, draft revision and (for visibility/archive) separate record revision. `GET /catalog` is staff-only; exercise writes use the programs command boundary.

`GET /delivery` returns authorized recipients/assignments and 50 sessions (`before` is the verified session UUID cursor; `history=true` includes former trainees with retained history). `POST /delivery` atomically assigns a fixed version to 1–50 reviewed recipients with member and current-assignment revisions. Independent `deliver_plan` provides the equivalent command within independent relationships.

`POST /sessions` starts/saves/reviews organization workouts; `/v1/organization-sessions/:id` and `/previous` supply authorized record/actual references. Publication/started snapshots and first completion time are retained. Current responsibility is checked before receipt replay. `PUT /v1/program-media/:id?workspace=:id` accepts at most 2 MiB PNG/JPEG/WebP; the authenticated GET rechecks publication/assignment/member access. `/v1/account/organizations` exports only the authenticated subject's organization records.

## Organization services and analytics

- `GET /v1/workspaces/:id/services?view=&kind=templates|groups&search=&offset=&archived=`: 25-row catalog. POST explicit `template`/`group` commands, stable operation UUID and revision. Groups contain at most 100 eligible trainee memberships; templates have 1–12 typed drills.
- `POST /calendar-preview`: local timestamp, IANA zone, integer minutes/count/every; returns actual UTC intervals. `POST /calendar` supports create, one-occurrence reschedule, admin staff replacement, cancellation, attendance, result and finish. Creation is atomic for at most eight occurrences; selected recipients are fixed.
- `GET /calendar?view=&from=&to=&zone=&offset=`: at most 31-day window, 50 rows. `id=` returns one authorized detail with latest 100 correction entries, explicitly labelled by the UI. Trainee projections hide other trainees.
- `GET /analytics?view=&from=&to=&member=&search=` and `/v1/coach/analytics?from=&to=&client=&search=`: separate authorized reports, date window at most 366 days, 25 matching filter subjects. Workload remains organization-wide.
- `GET /assessment-history?view=&member=&from=&to=&offset=`: 50 authorized results and subject name. Same-definition comparisons use immutable definition/template revision; absent/excused rows remain historical records but do not enter the performance line.

All mutations validate current role/resource before exact receipt replay; revisions conflict explicitly. Date parameters are calendar dates in the viewer's profile timezone. No external scheduling/reminder provider is connected.

## R10 communication and notification endpoints

- `GET /v1/workspaces/:id/communication?view=…&search=…&offset=…`: 25 channel summaries; admin `manage=true` exposes metadata only. `id` reads an authorized channel, `before` its prior sequence page (50).
- `POST` on that path: explicit `create`, `join`, `members`, `archive`, `rename`, `send` commands with stable operation UUID; `read` is monotonic and needs no receipt. Current role/resource permission precedes replay.
- `GET /v1/notifications`: latest authorized prompt per group, 25 per bounded page; `id` validates a direct link. `POST {id}` observes that group through the selected sequence.
- `GET/POST /v1/notifications/preferences`: own four-category in-app/local-email booleans and quiet hours, revision checked.

Local dispatch is CLI-only. No public generic event emission, provider send or operator endpoint is registered.

## R11 operations and continuation reads

- `GET /v1/platform?section=organizations|users|support|audit&search=&offset=`: separate current platform grant; 25 operational rows and `next`. Every access is recorded. Audit defaults to writes; `includeReads=true` includes access events. No generic private-record access.
- `POST /v1/platform`: `operation`, `action` (`organization_state`, `identity_state`, `support_reply`), `id`, `revision`, `reason` (10–500 characters), and `value` or `reply`. Payload identity/revision and grant checks govern replay. Confirmed refusal is editable; uncertain acknowledgment keeps the exact pending operation.
- `GET /v1/workspaces/:id/people?view=&role=&state=&search=&offset=&selected=&self=`: 25 scoped memberships, full filtered `total`, `next`, separately resolved selected people and responsible trainer names. Name search is case-insensitive. `selected` contains at most 100 UUIDs. Trainer scope is current responsibility; `self=true` also resolves the trainer's own channel participation.
- `GET /v1/workspaces/:id/recipients` and `GET /v1/coach/recipients`: bounded selected/available recipients with current assignment IDs/revisions/title. Independent selection max 50. Commands still validate each recipient at commit time.
- Workspace `summary=true` avoids downloading the roster; `invitationOffset` and `eventOffset` page 25 invitations/30 events. Modern web uses summary + people APIs.
- Organization delivery `history=true` returns 50 sessions and a verified continuation cursor; member names and current assignment are limited to the viewed history/person. Analytics `workloadOffset`/`programOffset` page 25 breakdown rows without changing full-scope totals.
- Calendar detail `summary=true` avoids the initial correction log; `historyMember` plus `historyOffset` returns 25 revisions and `historyNext` for an authorized event participant. A trainee cannot select another trainee's history.

Old open-client read shapes remain supported. Offset pages can shift during concurrent edits; exact writes use current revision checks and never trust displayed selection alone.

## Public reference catalogs (R14)

These endpoints are unauthenticated and contain no user or workspace data:

- `GET /v1/catalog/foods`: versioned object with `foods`; each includes stable ID, English/Arabic display names, original FDC metadata, source string, `basis: 100`, `unit: "g"`, `nutrients` (`kcal`, `protein_g`, `carb_g`, `fat_g`) and sourced portions (`name`, optional `name_ar`, `grams`). Values scale by actual quantity / basis. A missing nutrient is unknown, not zero.
- `GET /v1/catalog/exercise-media`: schema/version, source metadata and `items`; each immutable key has compatible starter mapping, frame paths, SHA256/dimensions and source/license attribution. Do not infer exercise matches from similar names.
- `GET /v1/catalog/exercise-media/:key/:frame.svg`: only manifest-listed keys and frames 1–3. Returns digest-verified SVG, immutable cache headers, ETag, no-sniff and restrictive CSP. Invalid keys/frames return the normal unavailable error.

`save_nutrition_guidance` accepts optional `p_meals` (default `[]`), up to 20 suggestions / 32 KiB. Each contains name, meal, positive quantity/basis (max 10000), unit, nutrient object and source. Existing participant/revision checks and immutable receipts apply to all fields; a changed payload with the same receipt is rejected. A suggestion is not consumption; trainee `save_meal` explicitly snapshots actual values.

Independent and organization exercise authoring accept `media_ref` from the reviewed catalog or null. Existing `media_url` remains optional HTTPS. Publication and copied prescriptions preserve the chosen key. Public catalog access does not grant access to private exercises, client records or organizational data.


### Expanded reference catalog and video assets (R15)

- `GET /v1/catalog/exercises`: pinned MIT metadata/text export and provenance; no restricted source GIF/image URLs.
- `GET /v1/catalog/wger-exercises`: dated wger metadata, instruction license/author and translated/editorial provenance.
- `GET /v1/catalog/exercise-videos`: 45 immutable motion references, source IDs, MIME types, byte sizes, hashes and credits. Exact IDs join the shared `wger-*` records; they do not claim equivalence to similarly named exercises.
- `GET|HEAD /v1/catalog/exercise-videos/:key.mp4` or `:key.webp`: allowlisted public asset. Supports a single `Range: bytes=...` request (206 with Content-Range); malformed/unsatisfiable ranges return 416. Unknown asset/type is 404; integrity mismatch is 503. Cache is public/immutable; video variants are H.264 MP4 with no audio. Full downloads remain available under the asset license.

Shared exercise records additionally contain nullable `category`, `body_part`, `target_muscle` and immutable `source_ref`. Custom authoring may set the facets; clients cannot forge the source reference. Existing prescription snapshots and media keys remain valid.

## Organization nutrition (R16)

`GET /v1/workspaces/:id/nutrition?view=admin|trainer|trainee&member=:membership&date=YYYY-MM-DD` returns authorized subject metadata, current plan for the date, latest revision, ten plan versions/next offset and authors. Trainee view resolves its own membership and rejects a different supplied member; staff use an explicit authorized membership. Omitting staff member returns `{member:null}`. Date defaults to the subject's local date.

The response includes `{sharing:{enabled,revision},canReadDiary,meals,removed,removedNext,corrections,correctionsNext}`. Actuals are returned to their subject or currently authorized staff while sharing is enabled. `removed=true&removedOffset=N` reads ten removed rows for the date; `meal=:id&historyOffset=N` reads ten revisions of an owned diary entry. `offset=N` pages plan versions. Unknown nutrients stay null/absent, not zero. Live daily meals are capped at200.

`POST` accepts an exact command with `operation` UUID, `view`, `member` and one action:

- `publish`: staff only, `id` UUID, `revision` matching latest plan, `effective_on` from subject today through366 days ahead, optional `expires_on` from start through366 days after start, `targets`, `guidance` (max4000), `meals` (max20/32KiB). Reuses nutrient and suggestion validation. Empty plans are rejected. Earlier versions cannot be edited.
- `sharing`: trainee only, expected `revision` (initial0), boolean `enabled`. Defaults off. Disabling hides all actuals/history from subsequent staff reads.
- `meal`: trainee only, `id`, expected `revision` (initial0), `logged_on` within the past366 days through subject today, `food` snapshot (`name,meal,quantity,basis,unit,nutrients,source`) and `note` (max2000). Positive bounded quantities/bases and known nutrient keys; units `g|ml|serving`.
- `remove`: trainee only, `id`, expected `revision`; creates a tombstone and history version, excludes it from current totals. Retrying the same operation returns its receipt; changing its payload is rejected.

Current membership/role/responsibility checks precede receipt lookup, so revoked staff cannot replay. `GET /v1/account/organizations` additionally includes the subject's `nutritionPlans`, `nutritionSharing` and `nutritionMeals` with `organization_meal_history`. Generic browser table queries do not expose these tables. These contracts are available to a later native client; no native/offline diary implementation is claimed.

## Organization assets

`PUT /v1/organization-assets/:id?workspace=:uuid&view=admin|trainer|trainee&purpose=exercise|message&filename=:name[&channel=:uuid]` uploads raw bytes with an allowed Content-Type, maximum 25 MB. Message purpose requires current channel participation; exercise purpose requires a staff role. The ID, owner, digest, MIME, purpose, name and channel are immutable. An identical retry succeeds; conflicting reuse returns 409.

`GET /v1/organization-assets/:id` rechecks membership and exact purpose/reference permissions. MP4 accepts a single byte range. `GET /v1/workspaces/:id/assets?view=admin|trainer&search=&offset=0&archived=false` returns 24 authorized exercise assets plus `next`; message files are excluded. `POST` to the same collection accepts the standard operation ID, `action: archive`, asset `id`, `revision`, `view` and boolean `retired`. Archive affects new selections, not existing published reads.

Organization message commands accept optional `asset_id`; the file must belong to the sender and that channel. `private_pair` on the channel makes participant changes and nonparticipant admin access unavailable.

## Organization trainer tasks

`GET /v1/workspaces/:id/tasks?view=admin|trainer&state=open|completed|cancelled&search=&offset=0&today=YYYY-MM-DD` returns 24 scoped rows, next offset and open/overdue/completed counts. The date-only `today` aligns the due-date count with the caller's calendar day. Trainers see only tasks assigned to their membership; admins see the organization queue.

`POST` accepts standard `operation`, `view`, `id` and `revision`. Admin `action: save` takes `title`, optional `description`, active trainer `assigned_to`, `priority: normal|high` and optional `due_date`. `action: state` takes `state: open|completed|cancelled`; cancellation/restoring cancelled tasks requires admin authority. Assignees can complete/reopen their work. Authorization is rechecked before replay.

`GET /v1/workspaces/:id/follow-up?view=admin|trainer` derives scoped counts and the first eight oldest review/outcome rows and alphabetic unassigned-program trainees. It is read-only and does not infer no-shows or deduct sessions.

## Organization session packages

`GET /v1/workspaces/:id/packages?view=admin|trainer|trainee` lists scoped packages before search (24/page); `member`, `search`, `status`, `offset` narrow results. `id` reads balance and paginated linked-session history. POST actions `create` (admin, allowance/dates/timezone/member, optional renewed_from), `adjust` (revision/allowance/reason), `archive` (revision/archived) use durable operation UUIDs. Current authorization is checked before receipt replay. Account exports include own-member package data.

Calendar create accepts one funding entry per trainee: `{member,package_id}` or `{member,independent_reason}` plus optional `makeup_for`. Omitted funding on older clients means independent `other`; the new UI explicitly displays funding. Repeated bookings reserve atomically. Attendance absent on a package requires `charge_absence`; completed package corrections require `reason`. `session-note` accepts member/revision/note (2000 characters). No-show charge decisions do not consume until the event completes. Historical check-in timestamp records the first present mark, not a biometric arrival or revised attendance proof.

## Organization feedback

`GET /v1/workspaces/:id/feedback?view=trainee` returns eligible completed own workouts/training appointments with optional score/revision, 24/page using `offset`. Trainer view returns the server’s current UTC `month`, `own` current-month response, and 24/page prior own monthly ratings. Admins use aggregate Analytics; no arbitrary member parameter grants response access.

POST body: `{operation,view,source,score,revision,id? ,month?}`. Session sources are `workout` (own completed log) and `calendar` (own present participant, completed training event); use source `id`. `workplace` requires trainer view and the server’s current UTC month. Scores are explicit integers 1–5; missing responses are null, never 3. Revision is 0 for a new logical response, otherwise the acknowledged version. Current authorization/source eligibility precedes receipt replay; correction cannot create another response. Feedback appears in own account export.

Analytics returns `experience`: source-specific rating buckets including null coverage, a separately scoped current UTC-month workplace distribution (admin only), and expired-package/explicit-linked-renewal counts. `performance` lists current trainers’ completed training events/present/missed participant counts, paged with workload; co-led sessions credit each event staff member. These are corrected operational records, not frozen historical snapshots or quality/payment/retention estimates.
