# Testing and verification

This page describes checks for the current monorepo baseline. Passing these checks confirms that the existing local product still builds and its current contracts pass; it does not mean the university product or hosting model is implemented.

## Local commands

Run commands from the repository root unless noted:

```sh
npm test
npm run format:check
npm run build
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run content:check
npm --prefix backend run test:docs
```

Backend database and full browser checks have additional local service prerequisites. Follow the [backend runbook](../../backend/docs/implementation/runbook.md) and the [verification record](../../backend/docs/implementation/verification.md). Full browser acceptance uses the isolation wrapper and local web ports 5173 and 5174; it must not reset or reseed the preserved preview.

## Evidence limits

The existing backend verification record is historical evidence for the gym-first local product at its recorded checkpoints. New checks for this monorepo migration are recorded in the top entry of the backend [implementation ledger](../../backend/docs/implementation/ledger.md) and [verification record](../../backend/docs/implementation/verification.md). Browser emulation does not establish physical-device behavior or human usability outcomes. University onboarding, tenant isolation, production identity/mail/file providers, operations and releases require later acceptance.
