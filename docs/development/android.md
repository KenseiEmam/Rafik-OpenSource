# Android coach field development

**Status, 18 October 2026:** Stage 7 implementation in progress. The native client has attendance, assessment drafts/results and event completion for explicitly opened events. Local SQLite queue checks are distinct from Android SQLCipher, API integration and rendered-device acceptance; those checks remain open. Correction-history UI, Arabic/RTL and instance URL scanning remain unfinished.

## Start a development instance and native build

Use synthetic accounts and events. From the repository root, install once with `npm ci`, then start the local backend using the [development guide](README.md). A trainer must be assigned as staff on an institution event; attendance entry opens after its scheduled start time. Administrators and athletes do not receive the coach workflow.

Install Android Studio, its Android SDK, a compatible JDK, and configure an emulator or USB-connected Android device. From the repository root:

```sh
npm run mobile:android
```

This builds and runs the native Android client. SQLCipher and Expo Crypto require a native build; Expo Go is unsupported. To restart Metro for an already installed build, use `npm run mobile:start`. Follow Expo's native-build output to connect the client.

Expo generates native Android/iOS projects and local Metro/type metadata. These paths are ignored; keep build configuration in `apps/mobile/app.json` and dependencies in the root lockfile. Do not commit generated build folders.

For a standard Android emulator, enter `http://10.0.2.2:55331` as the local API URL. A self-hosted instance normally uses `https://your-instance.example/api` because the web server proxies the API under `/api`. Use the exact API base supplied by the institution. HTTPS is required for remote instances; HTTP is accepted only for localhost, `127.0.0.1` or the emulator host. A physical device needs a reachable HTTPS development endpoint; arbitrary LAN HTTP is currently unsupported.

## Coach attendance walkthrough

For API exploration on your computer, open the backend's `/v1/docs` (default `http://127.0.0.1:55331/v1/docs`), or `/api/v1/docs` through Compose. The [API guide](../reference/api.md) explains native login and Authorize. Production viewers are reference-only; local requests use synthetic accounts.

1. Sign in using the institution API URL and a trainer account. Select the institution workspace if more than one is available.
2. Refresh the schedule. It requests a 14-day local-date window in the device's timezone. **Load more events** follows the server's pagination; the list is not a season-wide download.
3. Open an event online. The app saves event identity/timing/state, event participant names/duties/active flags, attendance and revisions. Assessment packages also include the event's metric definitions/units/limits and current results, revisions and assessor notes. It excludes correction history, session notes, files, conversations and injury records from the device cache.
4. After the event starts, choose **Present**, **Absent** or **Excused** for each athlete. The display acknowledges device saving only after the local transaction completes. One athlete's next edit waits for acknowledgment of their previous change; other athletes can be captured while a request is in progress.
5. Keep the app active to send saved attendance. Retry runs on foreground/resume, an explicit sync action and a 30-second timer while active. A network request times out after 20 seconds. There is no background-sync promise.
6. Reopen a saved event after an app restart or while disconnected. Saved events remain listed even when their dates are outside the current schedule window. A new event requires an online download.
7. Once all changes are confirmed, **Refresh roster** downloads current server data. A completed or cancelled event is displayed read-only and its offline roster/receipts are evicted. Otherwise the saved copy remains until removed explicitly.

## Assessment scores and event completion

1. Download the assessment event online before going offline. An older attendance-only package needs **Refresh roster** before score entry is available; confirm pending attendance and resolve drafts first.
2. Mark the athlete **Present**, then choose **Record assessment scores**. The editor uses that event's server-defined metric names, units, text/numeric kinds and limits. Enter every required metric; zero is a recorded value and a blank field is missing. Fractional numeric values are retained without integer rounding.
3. Each edit saves a raw score draft locally. Wait for **Score draft saved on this device** before closing. An unsuccessful write offers **Retry device save** or **Discard draft**; navigation remains blocked while the latest edit is unpersisted. Closing a persisted draft keeps it available after reopening or app restart. A draft is not a submitted result.
4. Choose **Save scores**. The app commits a separate immutable result command and removes its draft in the same transaction. A queued present command for that athlete must replay successfully before the result is sent. A failed attendance/revision/authorization check pauses dependent results; the pending values remain available for review.
5. Read the confirmed values/revision on the athlete card. **Review / correct scores** creates a new command against the acknowledged result revision. The server retains its normal correction history. The native app currently shows the current result rather than the paginated history; completed-event corrections use the institution web app.
6. Choose **Complete event** only after every athlete's attendance is marked, each present assessment athlete has confirmed results, every command is acknowledged, and every draft is submitted or explicitly discarded. The app asks for confirmation, then persists a separate finish command against the event revision. A future/cancelled/completed event is unavailable for capture.
7. Wait for completion acknowledgment. An uncertain finish is retained and retried with the exact original operation; it does not imply completion. A valid acknowledgment atomically removes only this account/workspace event's local package, scores, drafts and receipts. The open screen shows the completed result in memory; server records and correction history are preserved. Reopen completed events online for review.

No assessment is auto-merged over a conflicting server revision. Native/API and device acceptance remain required before calling Stage 7 complete.

## Saving, retry and recovery

| Display                           | Meaning and action                                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Saving attendance on this device  | Local persistence is running. Do not assume it survived a crash yet.                                                                          |
| Saved on device — waiting to send | The command is committed locally with its original operation ID and revision.                                                                 |
| Sending to institution            | Dispatch is in progress. Discard is unavailable until it settles.                                                                             |
| Server confirmation unknown       | A response, connection or acknowledgment write failed. Retry sends the original operation and payload. Do not re-enter it as another command. |
| Confirmed by institution          | The server returned the expected attendance/result/revision and the acknowledgment plus updated event committed locally together.             |
| Needs your review                 | The server rejected the command, for example because its revision changed. The queue pauses at this command.                                  |
| Access blocked                    | Current authorization failed. Saved work remains encrypted and entry is locked.                                                               |

Commands replay in order within the selected account/institution workspace. A blocked or rejected head pauses later commands, including other events in that workspace; the schedule offers a link to the event needing review. A newer download cannot overwrite unresolved commands or score drafts. The server checks current authority for every replay, including exact operation retries.

For conflicts or revoked access, review current records in the institution web app where authorized. The native app retains the saved values and error for review. **Remove device copy / discard pending work** requires an explicit confirmation and removes only that event's local data for this account and workspace. It does not undo a server write; an uncertain change may already have reached the server. Reopen online to download a fresh authorized roster before entering a correction. Native recovery export and in-app conflict comparison are not implemented.

If the session expired, sign out and sign in to the same institution URL/account, then retry. A lost refresh response can require a fresh sign-in because the server rotates refresh tokens. Do not edit or replace the pending attendance payload to repair sign-in.

## Storage and account boundaries

The client checks `PRAGMA cipher_version` before opening its field tables and refuses to store field data if the native build lacks SQLCipher. Its random database key and the instance-bound credentials are stored in Expo SecureStore. Android automatic app-data backup is disabled. These are implementation controls; they still require native-build verification.

Every event, score draft and command is partitioned by the exact normalized institution API URL, user ID and workspace ID. Signing out removes credentials and attempts current-device server revocation; the UI states when server revocation could not be confirmed. It retains encrypted field work for the original account. Another signed-in account cannot list, replay or discard that account's records. Pending work is not transferred to another coach. Reauthenticate as the original account to review or discard it.

App removal, Android clearing app data or loss of the SecureStore key can make unsent records unrecoverable. Server backups do not include the device queue. No remote wipe, biometric gate, recovery export or secure-erasure guarantee is implemented. Report a lost device to the institution; administrators should suspend the account if necessary. There is not yet a device-management screen for revoking one other device.

## Focused checks

Run from the repository root with Node 22.16 or Node 24:

```sh
npm run typecheck --workspace @rafik/mobile
npm run test:queue --workspace @rafik/mobile
```

The queue tests use real Node SQLite, including temporary on-disk restarts and transaction failures; their temporary directories are removed. They do not use the preview database, seed accounts or a device, and do not verify SQLCipher or Android process death. They cover exact retry, score precision/draft persistence, attendance → result sequencing, result corrections, completion gates and atomic eviction, stale-base protection, account/server/workspace isolation, blocked/conflicting commands, acknowledgment rollback and runtime switching.

Next acceptance must exercise the native build against the real API, including server receipt/revision rules, attendance → score → completion, real-form fractional values, refresh/revocation, airplane mode, forced app stop/reopen, account switching, phone/tablet layouts, assistive technology and both themes. Arabic/RTL, correction-history UI and URL scanning remain Stage 7 implementation work. Report emulator results separately from physical-device and human field review.

Native storage API references: [Expo SQLite/SQLCipher](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/) and [Expo Crypto](https://docs.expo.dev/versions/latest/sdk/crypto/).
