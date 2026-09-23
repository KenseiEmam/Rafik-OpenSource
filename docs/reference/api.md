# API conventions

## Source of truth

The API is PostgREST over the local Supabase database. The web adapter is `RAFIK-FRONTEND/src/lib/backend.ts`; generated `database.types.ts` contains callable SQL signatures and table row types. JSON domain types live in `src/lib/domain.ts` and feature `types.ts` files; SQL validates untrusted JSON. Regenerate types after a migration; never edit the generated file. See [architecture](../implementation/architecture.md) for command-by-command semantics and ownership.

## Calling and access

Authenticated calls use the current Supabase Auth session and the public anonymous key. A service key must never enter the web bundle. Use typed `rpc()` for domain commands, read helpers for authorized tables and the resource adapter for private Storage. Direct table writes are not an alternate API. Local admin scripts are guarded separately and do not form a browser backend.

## Revisions, retry and errors

- Compare-and-swap commands receive the last acknowledged revision. `conflict` means refresh/compare without discarding typed work automatically.
- Stable-ID commands persist the ID and exact payload before sending. A timeout can mean the write committed; retry that payload. `operation_reused` means the same ID was used for different content and needs explicit recovery.
- `forbidden`, `wrong_email` and unavailable/archived states require contextual explanations. Do not retry a confirmed validation rejection indefinitely.
- Friendly bilingual error mapping is in `src/lib/i18n.ts`. Pending state and success copy must reflect the actual acknowledgement, not merely completion of a local function.
- Publication and session creation select snapshots on the server. Never trust caller-provided ownership or mutable catalog content as historical evidence.

## Reads, pagination and dates

Read helpers fetch stable pages rather than assuming the response cap contains all rows. Conversations use descending server sequence, newest 50, then an exclusive before cursor; render chronologically. Read cursors reflect viewed history and move monotonically. Polling is foreground-only and is not push notification delivery.

Use client-local calendar dates for assigned training and UTC instants plus the original IANA timezone for appointments. See scheduling contracts before changing date handling. Strength units are explicit; analytics must compare like measurements and identify the exercise actually performed.

## Compatibility and tests

New optional JSON fields must tolerate existing stored device records and historical snapshots. Changing a field means reviewing the SQL validator, operation receipt, local queue, visible forms, review/progress, export and shared-plan copying. Use the database suites plus real HTTP and browser scenarios for those boundaries. After a hosted release, only forward migrations may change deployed contracts.
