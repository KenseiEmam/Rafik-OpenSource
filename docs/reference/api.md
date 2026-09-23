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
