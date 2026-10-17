# Release checklist

Use this checklist for a proposed self-hosted university release. Checking an item means its evidence has been reviewed for the release candidate; it does not claim that a release has occurred.

## Build and deploy

- [ ] Build from the approved revision; review migrations, shared types and bundled content/media provenance.
- [ ] Confirm required focused tests and build checks pass on the final source. Record commands and limits in [verification](../verification/README.md).
- [ ] Configure a separate university instance with unique secrets and domain/TLS. Keep the env file out of source control.
- [ ] Keep the service private until the first super admin completes first-run setup; share invitation links privately because Rafik does not email or verify them.
- [ ] Confirm production mode rejects local preview accounts, synthetic seed data and development defaults.
- [ ] Start with the documented [Compose deployment](README.md); verify healthy services and complete first-run super-admin setup while private.
- [ ] Confirm PostgreSQL is not publicly exposed and private files require API authorization.

## Recovery and operations

- [ ] Take and inspect a paired database/private-file backup before an update.
- [ ] Rehearse update and rollback on a disposable Linux deployment with the same migration sequence and persistent volumes.
- [ ] Restore database and private files together; verify checksums, login and authorized file reads.
- [ ] Configure alerts for database/API health and injury-retention checkpoint age; verify alert delivery.
- [ ] Document the university's operator ownership, access, backup, retention, incident-response and recovery contacts.

## University acceptance

- [ ] Review coach and athlete tasks using realistic synthetic records; record confusion, interruptions and recovery.
- [ ] Complete sport-specific exercise discovery/content review and verify all distributed media rights/credits.
- [ ] Obtain the university's privacy/security approval for consent, minors, role access, retention, export and deletion before using real athlete data.
- [ ] Confirm no unresolved [known issue](../known-issues/README.md) blocks the intended audience or workflow.
