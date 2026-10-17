# Verification record

This page records focused evidence for the current implementation and states what the evidence does not establish. See [testing](../testing/README.md) for the test strategy and commands; raw machine-readable evidence belongs under [receipts](receipts/). Earlier phase records are archived in the [verification history](../archive/verification-history-2026-10-17.md).

## Stage 4 — accepted prototype evidence

**Status:** prototype implementation complete. The founder deferred human and pre-production checks to the first-user/release backlog.

- The focused conversation flow passed in Chromium desktop and WebKit phone, including opening/reusing a direct conversation, message retry/reload, notification preference save, responsive layout and accessibility checks.
- The injury consent/status/correction/limited-coach/withdrawal flow passed in Chromium desktop and WebKit phone.
- Release guard tests passed 8/8. Backend and frontend typechecks, frontend build and the documentation-link check passed for the final Stage 4 source.
- A disposable database/API outage and restart rehearsal passed. The retained evidence does not establish production alert delivery, physical-device behavior, human usability, legal compliance, or a production update/rollback rehearsal.

The remaining first-user and pre-production items are listed in [known issues](../known-issues/README.md). Do not use real athlete data before the institution's privacy/security approval.

## Stage 5 — instance branding

The implementation adds PostgreSQL-backed instance name, accent, light/dark page backgrounds and optional raster logo settings. Surfaces derive from the page backgrounds and text/accent colors adjust for contrast. Only the first super admin can update the settings. Rafik attribution remains visible, the public logo endpoint serves only validated PNG/JPEG/WebP bytes up to 512 KB, and settings are included in the ordinary database backup.

The founder restarted the local backend and frontend and confirmed branding persisted. This is application-service restart evidence only; a database backup/restore check remains open.

### Checks run for this change — 17 October 2026

- Passed: backend and frontend typechecks.
- Passed: `npm run test:fresh --workspace @rafik/backend`; all 50 migrations, fixtures and eight SQL suites passed against a disposable database. The shared preview database was unchanged.
- Passed: frontend production build.
- Prettier formatted the edited TypeScript, Vue and CSS files. Prisma formatted the schema; the SQL migration has no configured Prettier parser.

The focused first-run palette journey passed in Chromium desktop and WebKit phone. It covered changing name/accent/light and dark backgrounds, uploading a logo, reload persistence, Arabic rendering, and axe accessibility checks. Viewport and full-page captures were visually inspected and saved under receipts. This does not establish physical-device or human usability evidence.

**Founder manual check:** after stopping and restarting the local backend and frontend, instance branding remained available. This confirms branding survives application-service restarts against the existing local database; it does not exercise restoring a backup.

After founder review, dark-mode card and soft surfaces were darkened slightly while leaving light mode unchanged. This CSS-only adjustment has not yet been rechecked in a browser.

After further founder review, light-theme primary and muted text were darkened slightly; dark-theme text colors were left unchanged. This CSS-only adjustment has not yet been rechecked in a browser.

A centered, accessible spinner now occupies the first render until the branding request settles, so the application shell is shown only after custom theme values are applied. The loader behavior has not yet received a browser check.

## Release and human evidence still needed

- First-user review of representative university coach and athlete tasks.
- Sport-specific taxonomy and exercise/field-drill content review.
- Institution privacy/security approval for consent, access, retention and deletion.
- Production retention alert delivery and disposable Unix update/rollback rehearsal.
- Stage 5 database backup/restore persistence check.
- Physical-device behavior and production service delivery where applicable.

Do not treat browser emulation as physical-device or human usability evidence. The [known-issues list](../known-issues/README.md) is the active record of open release gates.

## Stage 6 — cloud templates

Terraform is not installed in this environment, so `terraform fmt` and `terraform validate` were not run. No cloud credentials were used and no resources were created. Provider application, deployment, cost, upgrade, backup/restore and teardown remain unverified.
