# ADR 0023 — Android coach field app

**Date:** 17 October 2026  
**Status:** Accepted for Stage 7 implementation  
**Scope:** Android coach field workflows; no athlete-native release decision.

## Context

Stage 7 adds a native field app after the web, API and self-hosted deployment foundation. The founder confirmed a coach-first release. Coaches need to use scheduled rosters and assessor-led results around training venues where network access may be intermittent. The app must remain compatible with university-owned deployments and preserve the API's tenant, role, assignment, audit, revision and retry rules.

The current API supports organization calendar detail, attendance, assessment results and event completion. Writes use stable operation IDs and server-side transactional receipts. Authentication currently supports only browser cookies, and mutation requests require the `web` client marker. Browser local storage is not native durable-storage evidence.

## Options considered

| Option | Advantages | Costs and risks |
| --- | --- | --- |
| React Native with Expo and TypeScript | Reuses the team's TypeScript skills and API contracts; supports Android-first work; Expo SQLite documents SQLCipher support and SecureStore uses Android Keystore-backed encryption. | SQLCipher requires a native build; Expo Go is insufficient. Background scheduling would need separate native integration and is excluded from v1. |
| Native Android with Kotlin | Direct access to Android platform APIs and WorkManager; strongest fit if Android-only platform behavior dominates. | Adds Kotlin/Gradle toolchain and a second application language; duplicates API contract types and validation work. |
| Mobile web/PWA | Reuses the existing Vue application and deploy process. | Does not meet the approved native Android field-app direction or the planned secure durable offline storage boundary. |

## Decision

Build an Android-first React Native app with Expo and TypeScript under `apps/mobile/`. Retain native app navigation and local persistence as distinct from the Vue web app. Use Expo SQLite configured with SQLCipher for the minimum encrypted event cache and ordered write queue. Store the SQLCipher key and native session credentials using Expo SecureStore. Do not use Expo Go as evidence for SQLCipher behavior; use a development build.

The first release is for coaches/trainers. It supports a bounded schedule, an explicitly opened event, attendance, assessor-led values, event completion, previous results when online and per-operation sync/recovery state. It does not ship athlete-native screens, general offline rosters, messaging, administration, private files or injury status.

Sync occurs when the app is foregrounded/resumed, when the user requests retry, and when connectivity returns while the app is active. Background execution is not promised. Offline writes are encrypted and saved before the UI reports device persistence. Commands replay in order with the exact original operation UUID and payload. The server rechecks actor, role, assignment and event state on every read, command and replay; 403/409 outcomes stop dependent writes and require visible recovery. Account or institution changes must never adopt another user's queue.

Add a dedicated native authentication boundary using Android bearer credentials. The API will issue short-lived access tokens and rotating refresh tokens, persist only token hashes, support explicit device-session revocation/logout and enforce login/refresh rate limits. Existing web cookie sessions, origin allowlists and client marker remain unchanged. Never embed a shared secret in the app.

## Trade-offs and constraints

- Online access is required to sign in, discover contexts, download an event package and refresh expired credentials. Offline capture is limited to event data fetched while online.
- A server revocation or changed assignment can block queued work. The app will preserve it in an encrypted blocked state and require an explicit permitted recovery or discard action; it will not silently transfer ownership or force writes through.
- Local event/roster data is sensitive. The encrypted cache is minimized and acknowledged data is evicted after event completion. Unresolved operations remain until resolution or explicit discard.
- No biometric gate, remote push, automatic background sync or medical workflow is included in the first release.
- Distribution channel, minimum Android version and physical-device usability remain pre-release decisions and evidence gates.

## Verification required

Before the mobile preview, add API integration coverage for duplicate delivery, lost acknowledgements, exact retries, changed payload rejection, refresh-token rotation/reuse, logout/revocation, assignment changes and multi-device revision conflicts. Verify database encryption and key storage in Android development builds; test process death, device restart, account switch, sign-out, app update, local URL access, offline capture, and recovery on emulator. Report physical-device results separately.

## References

- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/): SQLCipher support on Android; use a native build rather than Expo Go for SQLCipher.
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/): encrypted Android key-value storage backed by Android Keystore.
- [Android Keystore](https://developer.android.com/privacy-and-security/keystore): platform-managed cryptographic key protections.
- [Android WorkManager](https://developer.android.com/develop/background-work/background-tasks/persistent): durable background work is intentionally deferred; v1 sync remains foreground-driven.

