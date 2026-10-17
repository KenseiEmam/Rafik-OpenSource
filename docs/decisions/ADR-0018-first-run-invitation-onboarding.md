# ADR 0018 — First-run and invitation onboarding

- **Date:** 17 October 2026
- **Status:** Accepted

## Context

The web app was still presenting a gym-era public entry and email-code sign-in. The approved product is a self-hosted university application: one institution operates each deployment, and its super admin provisions its staff and athletes. Email verification and a mail service are not desired prerequisites.

## Options considered

1. Keep public registration and email-code sign-in.
2. Require an operator-configured bootstrap email and deliver a sign-in code.
3. Let the first person to complete setup on a fresh instance create its super-admin account, then require institution admins to issue expiring invitation links.

## Decision

Use option 3. The root route directs an uninitialized instance to a setup form and an initialized instance to password sign-in. Setup creates the first account, institution, admin membership and audit event in one transaction under an advisory lock; afterward setup is closed. A seven-day single-use invitation lets its intended user choose a password and joins that account to the institution. Administrators may issue 24-hour one-use password setup links for active members. Passwords use Node scrypt; session and setup tokens are opaque and stored as hashes.

The account email is an identifier and is not verified. The application does not send email for authentication, invitations or password setup. Operators must keep a new instance private until initial setup is complete and share invitation/setup links privately. This route replaces the marketing/public entry in the application; public marketing belongs in the separate frontend project.

“Institution” is the user-facing product term. Existing schema, API, route and code identifiers may retain “organization” for compatibility.

## Trade-offs and limits

- First-run setup is intentionally unauthenticated while open. A person who can reach the fresh instance can claim the super-admin account; network isolation during setup is required.
- A shared invitation URL is a bearer credential. Anyone who obtains it can attempt to accept it using the intended account email. There is no email verification to establish mailbox ownership.
- Admin-issued password setup is the recovery path; it expires after 24 hours, is single-use, and revokes existing sessions when consumed.
- Existing users without a password hash cannot use password sign-in until an administrator-issued setup link is provisioned. Release/upgrade procedures must account for this before upgrading an instance that already has users.
- No SMTP or mail-provider dependency is needed for these identity flows.
