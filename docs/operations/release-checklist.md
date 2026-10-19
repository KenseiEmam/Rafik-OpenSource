# Release checklist

Use this checklist for a proposed self-hosted university release. Checking an item means its evidence has been reviewed for the release candidate; it does not claim that a release has occurred.

## Public beta scope

Institute outreach can invite evaluation of a clearly labelled public beta; an invited-tester cohort is not a prerequisite. Announce an actual tagged/packageable version with installation instructions and known limits. Do not equate a planned announcement date with completed recovery/security evidence. Real sensitive athlete records still require the institution's own approval. Cloud-provider validation and first-user field feedback remain the founder-deferred backlog.

## Build and deploy

### Android Step 3 — beta packaging and installation

- [x] Build and verify the Squire `1.0.0-beta.1` APK using the [release procedure](android-release.md); record its checksum, certificate and exact source revision.
- [ ] Back up the authorized private signing key/passwords outside the checkout.
- [ ] Prove installation/startup without Metro on the updated candidate. The earlier APK passed on a separate Android 14 AVD; the offline-feedback rebuild awaits the S20+ check.
- [ ] Recheck cold offline startup and saved work on the updated candidate. The earlier APK passed a controlled same-key versionCode upgrade; historical/schema migration remains open.
- [x] Record actual device/OS/layout/accessibility coverage and explicit beta limits in [verification](../verification/README.md).
- [ ] Publish an annotated beta tag and matching English/Arabic landing release/install/upgrade documentation; publish download assets only after package acceptance.

### Self-hosted web/API

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
