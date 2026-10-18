# Rafik Field app

The Android workspace is the Stage 7 coach-first field app. Instance sign-in, bounded schedules, event downloads, attendance, assessment drafts/results and event completion are implemented locally. Native/API acceptance remains open. Use synthetic data only.

## Local development

From the repository root, use Node 22.16 or Node 24 and install the monorepo once:

```sh
npm ci
npm run mobile:start
```

Build/run the Android development client on a machine with Android Studio, Android SDK and a running emulator or USB-connected device:

```sh
npm run mobile:android
```

This app enables SQLCipher and requires a native development build; Expo Go does not include that native configuration. On an Android emulator, use the host's emulator address (commonly `http://10.0.2.2:55331`) for the local API. A physical device must use a reachable LAN address and local HTTP is allowed only for localhost/emulator development; remote institutions must use HTTPS.

The canonical [Android development guide](../../docs/development/android.md) explains instance URLs, coach setup, attendance/scores, completion, sync states, account isolation and recovery. The app requests current workspace roles and a bounded 14-day schedule; non-trainer roles see no coach workflow.

## API contract

The coach app's supported OpenAPI subset is at [`../backend/openapi.json`](../backend/openapi.json), exported at `/v1/openapi.json` and shown in bundled Swagger UI at `/v1/docs` (`/api/v1/docs` through Compose). See [the API guide](../../docs/reference/api.md) for local native login and Authorize. Production viewers are reference-only; local requests use synthetic accounts.

## Current limitations

- Attendance works only for an event roster explicitly downloaded online. Queue checks use Node SQLite and do not establish Android encryption or process-restart reliability.
- Correction history, native conflict comparison/export, Arabic UI and URL scanning remain unfinished. Completed-event corrections currently use the web app.
- No physical Android device or field-use acceptance has been completed. iOS is out of scope.
