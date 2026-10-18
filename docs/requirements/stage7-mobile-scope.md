# Stage 7 mobile scope

**Status:** coach-first scope confirmed by the founder, 17 October 2026. This records the agreed first-user direction; detailed API and release acceptance still need implementation evidence.

## Goal

Help university staff and athletes complete useful training and field-work tasks on Android phones or tablets. The app must connect only to the user's university instance. It must preserve the server's current role, assignment, privacy, revision and audit rules.

## Implementation status — 18 October 2026

The founder reports a successful Android offline-attendance → backend-restart → online-sync journey on 18 October. Device type was not reconfirmed; scores, completion, app process-death recovery, native encryption and physical-device checks remain separate evidence gates. This report advances attendance runtime evidence without closing Stage 7.

Instance-bound sign-in, current coach contexts, bounded paginated schedules and an attendance slice are implemented locally. Coaches explicitly download a roster, capture attendance in SQLCipher-backed storage and replay exact commands while foregrounded. Device/sending/uncertain/acknowledged/rejected/blocked states and explicit local discard are implemented. Unresolved work remains isolated to the original account/server/workspace. Queue tests use Node SQLite; native encryption/rendering, API integration, URL scanning and broader native/API acceptance remain open; correction history and English/Arabic UI are implemented. Assessment entry, raw drafts and event completion are now implemented locally with dependency/completion gates; native/API acceptance is still open. See the [Android guide](../development/android.md). The requirements below remain the full target, including unfinished work.

## First release tasks

| User            | Proposed tasks                                                                                                                                                                                        | Excluded from the first mobile release                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Coach / trainer | See assigned field events; open an authorized event roster and assessment definition; record attendance and assessor-led performance results; finish the event; review prior results and sync status. | Administration, user invitations, program authoring, messages, analytics configuration and unrestricted athlete records. |
| Athlete         | No native role in the first release. Existing mobile web remains available for athlete training workflows.                                                                                            | Athlete native dashboard/workout logging, other athletes' data, and clinical or diagnostic health functionality.         |

The founder confirmed coach-first. Keep athlete-native work separate until the coach field workflow is accepted.

## Offline boundary proposal

- Allow offline capture only for a field event the coach opened and whose authorized roster/assessment definition were fetched while online. No general offline roster search or offline discovery.
- Queue each attendance, assessment or workout change locally before showing it as safely stored on the device. Show device-saved, sending, acknowledged, needs-attention and blocked/revoked states distinctly.
- Use an immutable operation ID and payload for retries. A lost response retries the same operation; editing creates a new operation against the latest acknowledged revision.
- Recheck current server authorization on every replay. Never upload a pending record under another account or institution. A revoked or reassigned user's unsent work remains visibly blocked and requires an explicit recovery/export or discard decision; it must not silently change owner.
- Do not cache conversations, private files, injury-status records or broad rosters for offline use in the first release. Evict acknowledged event/roster data after the event is completed and all operations are acknowledged; keep unresolved queue items encrypted and visible until explicit recovery or discard.
- Encrypt app-private local records and credentials using Android platform storage protections. Define logout, account switch, device loss and app removal behavior before implementation; do not claim secure deletion beyond what the platform can demonstrate.

## Existing API fit and gaps

| Requirement                        | Existing support                                                                                                                    | Gap to resolve before the app                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role-scoped workspaces and rosters | Organization routes return current role-scoped projections and paginated people.                                                    | Confirm mobile needs and paging/search behavior against the proposed field tasks.                                                                                                                                                  |
| Attendance and assessments         | Calendar routes support attendance, results, authorized detail and correction history.                                              | Define the exact field capture flow, units, validation, conflict UI and offline payload.                                                                                                                                           |
| Workout start and save             | Organization session routes provide start/save and revision-aware persistence; local web workout storage has queued retry behavior. | Extract a transport-independent command contract; web storage and service-worker behavior cannot be reused as native durability evidence.                                                                                          |
| Idempotent writes                  | Domain operations use stable IDs, transactional receipts and reject changed payloads for a reused ID.                               | Document receipt retention and every mobile command's retry semantics; add integration coverage for uncertain outcomes.                                                                                                            |
| Authentication                     | Password login creates an opaque HttpOnly SameSite cookie. Mutations require the web client marker and an allowed browser origin.   | Native apps need an explicitly supported auth transport, secure token/session storage, refresh/revocation behavior, and a mobile client boundary. Do not weaken browser origin checks or put long-lived secrets in the app bundle. |
| Revocation and changed authority   | Server checks current actor, role, assignment and resource before reads, writes and replay.                                         | Define user-visible handling for queued commands after account, role, assignment or institution access changes.                                                                                                                    |
| API discovery                      | The API is documented in the maintained API reference.                                                                              | Confirm whether a versioned OpenAPI document/Swagger UI is maintained and generate or publish one from actual routes before asking mobile developers to rely on it.                                                                |

## Selected architecture constraints

- Keep the native client in a separate `apps/mobile/` workspace.
- Use React Native with Expo and TypeScript. It matches the existing TypeScript API/contracts and keeps the first app Android-focused without introducing another language/toolchain. Keep UI and durable storage platform-specific where needed.
- Use Expo SQLite with SQLCipher for encrypted event cache and a durable, ordered command queue; keep its database key and native access/refresh credentials in Expo SecureStore. SQLCipher requires a development/production native build, not Expo Go. Do not claim background sync: the first release syncs on app foreground/resume, explicit retry and connectivity return while the app is active.
- The user enters their university API URL. The app must support HTTPS self-hosted instances and local development URLs without binding to a Rafik-hosted service.
- The user must be able to enter or scan their university instance URL. Do not bind the app to Rafik-hosted services or provider credentials.
- Store no service-account key, universal API secret, or hidden operator credential in the app.
- Keep server validation and authorization authoritative. The mobile client may validate for usability but must not duplicate business rules as its security boundary.
- iOS is out of scope unless the founder explicitly expands it after Android acceptance.

## Acceptance evidence required

1. API integration tests cover duplicate delivery, lost acknowledgements, exact retry, edited retry rejection, changed revisions, revoked access, changed assignment and multi-device conflict.
2. Device storage tests cover process death/restart, account switch, logout, app upgrade and recovery of each pending state.
3. Emulator tests cover coach and athlete journeys, online/offline transitions, network interruption, phone/tablet layouts and accessibility. Report physical-device checks separately.
4. Human field review confirms the selected task flows are workable in real coaching conditions. Emulator success alone does not prove field usability.
5. Documentation explains instance enrollment, account setup, supported offline behavior, sync/recovery states, privacy boundaries and known limits.

## Decisions still needed

- Decide the initial distribution channel before release: signed APK for direct installation, Google Play, or both. This does not block the app/API implementation.
- Set the minimum Android version and supported screen sizes during device verification.

## Coach field API contract

The mobile app uses the existing organization APIs; the server remains the sole authority for roles, participants, event state, attendance, assessment validation and revisions.

1. Authenticate to the selected instance using the dedicated native session endpoints. Do not put browser cookies or a shared API key in the app.
2. Load current workspaces and role grants through `GET /v1/contexts`; only trainer contexts expose coach field workflows.
3. Load a bounded local-date window with `GET /v1/workspaces/{workspace}/calendar?view=trainer&from={date}&to={date}&zone={iana-zone}&offset={offset}`. Follow `next` for additional pages; do not download the full season.
4. Before going offline, fetch one event detail with `GET /v1/workspaces/{workspace}/calendar?view=trainer&id={event-id}`. Cache only that event, its event participants, current attendance/result revisions and assessment definition.
5. Each attendance write is `POST /v1/workspaces/{workspace}/calendar` with `action: "attendance"`, `view: "trainer"`, event `id`, participant `member`, attendance enum, participant `revision`, and a stable `operation` UUID.
6. Each assessment write is a separate `action: "result"` command with participant `member`, existing result revision (zero when absent), validated values, note and stable `operation` UUID. Queue it after that participant's present command so server attendance preconditions are met.
7. Finish the event with `action: "finish"`, event `revision` and its own stable operation UUID only after all required attendance and assessment commands are acknowledged.
8. Replay each exact command in order. A lost acknowledgement retries the identical UUID and payload. A changed payload gets a new operation only after the prior result is known. On 403/409, stop dependent commands, refresh authorized event data when allowed, and show the exact correction/revocation state; never force-merge assessment values.

The API has actor-scoped transactional operation receipts and current role/assignment checks. The Android bearer-session flow and supported OpenAPI subset are implemented locally; browser cookie/origin behavior is retained. Native/auth/API integration evidence remains required before developer preview. The field package now includes assessment definitions and current results. Correction-history UI is implemented; broader native/API acceptance remains open.
