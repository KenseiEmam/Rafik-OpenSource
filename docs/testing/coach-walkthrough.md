# Local coach walkthrough

Use this guide for a personal, local walkthrough of the current university workflow. It is a usability check, not release approval or evidence from a university pilot. Use synthetic records only; do not enter real athlete health information.

## Start the local app

From the repository root, with Docker running, start the local database and apply pending migrations:

```sh
npm run backend:start
npm run web-env
```

Start the API and web app in separate terminals:

```sh
npm run start:api
```

```sh
npm run dev
```

Open `http://127.0.0.1:5173`. A fresh database opens the first-run super-admin setup form; complete it with synthetic details. A database seeded with sample accounts opens sign-in instead. The first-run journey can be exercised safely with `npm run test:e2e --workspace @rafik/frontend -- onboarding.e2e.ts --empty-database`; the isolated runner creates and removes its own database. Do not run `npm run seed:local` against a database that already contains data. The [development guide](../development/README.md) covers setup and troubleshooting.

## Coach walkthrough

Use a synthetic institution and athlete records. The first-run form creates the initial institution and super admin; subsequent users are added by an administrator through one-time invitation links.

1. Sign in and confirm the institution and active role.
2. As an administrator, open **Injury status** and configure consent prerequisites for a synthetic athlete. For a minor, use only the guardian-authorization attestation; do not enter guardian documents or real personal data. Confirm the administrator cannot see injury status.
3. Sign out. Sign in as that athlete, review the consent and assent prompt, and record a synthetic participation status. Then try reviewing, correcting, closing, withdrawing consent, and exporting the record. Note confusing wording, lost input, or unclear confirmation.
4. Sign out and sign in as the athlete’s designated coach. Open **Injury status** and verify that only the current participation status and effective date are visible. Confirm that unassigned athletes, prior history, and health details are not exposed, and that the coach cannot create or change the record.
5. Return to the athlete account, correct or withdraw the record, then refresh the coach view. Confirm the change is reflected and withdrawn status is hidden.
6. Note any blocked step, confusing wording, unexpected access, lost data, or unclear confirmation. Include the active role, screen, and steps that led to it.

Do not try to simulate the 12-month deletion by changing clocks or editing the database. Retention scheduling and database recovery are operational checks documented in the [verification record](../verification/README.md), not part of this manual UI walkthrough.

## What this walkthrough does not establish

- Completing it does not establish university privacy/security approval or authorize real athlete data.
- Invitation links are not delivered by email and do not verify an email address; share them only with their intended users.
- It does not test production deployment, retention alerts, physical devices, or an unaided external user.
- Seeded or manually created synthetic records are not evidence of real-world use.

Record observations without names, contact details, or health information. Send the steps and issue you observed back for review; automated tests and this walkthrough do not substitute for university policy or security review.
