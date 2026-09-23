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
