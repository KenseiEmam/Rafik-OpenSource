# Testing and verification

This page describes checks for the current monorepo baseline. Passing these checks confirms that the existing local product still builds and its current contracts pass; it does not mean the university product or hosting model is implemented.

## Local commands

Run commands from the repository root unless noted:

```sh
npm test
npm run format:check
npm run build
npm run backend:typecheck
npm run backend:test
npm run content:check
npm run docs:check
```

Backend database and full browser checks have additional local service prerequisites. Follow the [runbook](../implementation/runbook.md) and the [verification record](../implementation/verification.md). Full browser acceptance uses the isolation wrapper and local web ports 5173 and 5174; it must not reset or reseed the preserved preview.

## Evidence limits

The implementation ledger and verification record preserve historical evidence for the current gym/training-organization application. Browser emulation does not establish physical-device behavior or human usability outcomes. University onboarding, tenant isolation, production identity/mail/file providers, operations and releases require later acceptance.
