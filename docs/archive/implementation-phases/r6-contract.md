# R6 — Local release hardening

Status: implemented locally; final verification is recorded in the ledger and verification record. Hosting and native work remain deferred.

## Why this phase

R1–R5 provide the retained local coaching domains. The next execution stage is release readiness, not an unrequested hosted deployment. The mobile inbox regression reopens local quality acceptance. Fix that regression and check existing feature families before adding release behavior.

## Contracts

1. **A running application stays on one version.** The production service worker serves its own cached HTML and complete asset set. A deployment cannot combine new HTML with an older active worker or discard assets used by another open tab. A waiting worker must not call `skipWaiting`; installation failure leaves the working version intact.
2. **Updates do not interrupt work.** Settings can check for updates and explain a ready update. Finish work, close all Rafik tabs, then reopen. No automatic reload, draft deletion, cache-clearing button or new persistence queue. Browser worker lifecycle coordinates tabs.
3. **Release verification is repeatable and local.** One guarded command verifies prerequisites, runs backend/frontend checks sequentially, records per-step pass/fail with logs and stops on failure. It never resets the preview, installs dependencies, pushes, applies remote migrations or contacts customers. The report must explicitly leave hosted/device/business gates unverified.
4. **Quality is state-based.** Test populated and empty lists, selection and back navigation, long content, constrained height, both engines, RTL/themes and internal clipping. Inspect rendered screenshots; route count or document overflow is insufficient. Keep scenario coverage mapped to feature families.

## Acceptance

- Existing local database/service/browser journeys pass, including original inbox defect regression.
- Real two-version production browser test: an old tab stays functional/offline while an update waits; the new version activates only after old tabs close; records survive. Check Chromium and WebKit.
- Actual build artifact check verifies final files and distinct HTML-only releases, after every bundler transformation.
- Release runner rejects missing/wrong local prerequisites and writes a truthful result for success/failure without credentials.
- Update architecture, maintainer instructions, runbook, verification and phase status together.

## Boundaries

No external email/push/calendar/payment provider, hosted deployment, physical-device certification or native work. The original notification-delivery/preferences item remains a separate unimplemented product contract; existing Today activity is not a delivered notification service. Release hardening must not silently mark those capabilities complete.
