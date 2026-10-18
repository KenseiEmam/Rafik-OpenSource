# ADR 0024 — Direct signed Android beta APK

Date: 19 October 2026

Status: accepted for beta preparation by the founder; package acceptance is separate.

## Context

The coach app must be evaluable without Metro, Expo Go or Android Studio. The founder approved Squire beta preparation and generation of a new local release signing key. Development APKs use a different certificate and can contain pending device work.

## Options

| Option            | Trade-off                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| Direct signed APK | No store/cloud account needed; operators must distribute trusted files and users approve updates. |
| Google Play       | Managed distribution but requires account, listing, policy and review work. Deferred.             |
| EAS cloud builds  | Convenient hosted toolchain but introduces a hosted signing/build dependency. Deferred.           |

## Decision

Prepare a direct signed `1.0.0-beta.1` APK, initially for ARM64 and x86_64. Keep package ID `org.rafik.field` and one private signing identity across releases. Generated Android sources remain disposable; maintained scripts supply signing from ignored local files through environment variables and prohibit the generated debug-key fallback. Bundle JavaScript in release builds. Configure minimum API 24, matching the installed React Native baseline; physical-version coverage is not claimed.

## Consequences

The maintainer owns secure backup of the signing files. Updates must increase Android versionCode and preserve encrypted database/key identifiers. A separately signed development installation must not be uninstalled to make a release test pass. Fresh install, cold offline startup and actual version-upgrade checks are release evidence, not consequences automatically established by a successful build. See the [release procedure](../operations/android-release.md).
