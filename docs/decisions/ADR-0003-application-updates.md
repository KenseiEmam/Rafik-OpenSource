# ADR 0003: Keep each open application on one complete version

Status: Accepted · 23 September 2026

## Context

The web application caches its public shell for interrupted workouts. Network-first HTML could pick up a newly deployed entry page while an older worker controlled the tab. The previous cache key used asset filenames alone, so HTML-only and fixed-name brand changes could reuse a cache identity. Forcing worker activation/reload would risk interrupting editable forms and pending commands across tabs.

## Decision

Hash final emitted asset contents, HTML and the fixed brand asset in the final `writeBundle` hook. `generateBundle` can still precede HTML/chunk transforms; `test:build` compares the hash to the actual files and checks two HTML-only releases. Each worker installs the complete public shell and serves its own cached HTML/assets. It does not cache Auth, database or Storage responses. It never calls `skipWaiting`. The browser activates the new worker after all old controlled tabs close, then removes old Rafik shell caches. A failed installation leaves the active version usable.

Settings and Help offer an explicit update check with current/checking/ready/failure states. A ready update asks the user to finish, close all Rafik tabs and reopen. No automatic reload, browser-data clearing, persistence schema change or generic unsaved-form registry is introduced.

## Options considered

- **Force activation and reload immediately:** rejected because an open workout, form or pending command could be interrupted.
- **Allow old tabs to mix with newly deployed shell assets:** rejected because HTML and worker-controlled files could come from different releases.
- **Keep each open client on one complete version and offer a deliberate update:** selected; adoption may be delayed while old tabs remain open.

## Consequences

Open sessions remain stable, including offline and multi-tab use. Adoption can be delayed by long-lived tabs; backend changes must therefore remain compatible with older clients until a deliberate retirement plan exists. Installing the complete public bundle costs bandwidth; private data remains outside the cache. Real browser two-version tests cover failed installation, waiting activation, retained workout records and subsequent offline reload. This is local evidence, not a physical-device or hosted-CDN certification.

Implementation: web `build/offline-shell.ts`, `src/app/updates.ts`, `src/components/AppUpdates.vue`, and `tests/app-updates.e2e.ts`.
