# Operations

This is the operator entry point for builds, self-hosted deployment, configuration, secrets, backups, recovery and operational checks. Rafik is deployed as a separate instance on infrastructure controlled by each university.

For Android maintainers, [release operations](android-release.md) includes signing-key backup with an encrypted archive and a local S20+ acceptance path using USB forwarding; no public domain or running emulator is required for that device check. Keep private signing backups outside this repository.

Coaches normally install the upstream signed APK and configure their institution URL; institutions do not need to compile a custom APK for each server. Independent distributions own their signing key and updates. See [build-path selection](android-release.md#choose-the-right-path), [fresh-checkout builds](android-release.md#fresh-checkout-standalone-build) and [closing beta.1 distribution](android-release.md#close-beta1-distribution).

## Deployment

The Android history/recovery update requires the matching updated backend/OpenAPI export; no schema migration is needed for history reads. Recovery copies are user-initiated plain-text shares and are outside encrypted app storage and server retention. Institutions must choose approved recipients/storage and handle deletion of exported copies themselves; do not send athlete recovery records through the public landing contact form.

The multiple-message-attachment update requires migration `202610181200_message_attachments` before running the updated backend. It adds ordered links and backfills existing single-file messages without removing the compatibility column. Restart the backend after migration/client generation; existing file storage and backup procedures are unchanged.

Updated backends include Swagger reference at `/api/v1/docs` on the self-hosted web origin, with JSON at `/api/v1/openapi.json`. Production (`NODE_ENV=production`) disables interactive viewer requests. The viewer uses bundled assets and no external validator; no additional service or Compose definition is needed. Direct backend access uses `/v1/docs`. See the [API guide](../reference/api.md) for local exploration.

The supported deployment foundation is the self-host Docker Compose profile on a Unix server. The [infrastructure guide](../../infrastructure/README.md) is the canonical source for prerequisites, environment setup, TLS, startup, and service health checks. Use the committed example only as a template; set a unique project name and replace every secret before startup.

Optional AWS, Google Cloud and Azure single-VM Terraform starters are documented in the [cloud deployment guide](../../infrastructure/cloud/README.md). They retain the Compose stack and do not provision managed databases, backups or monitoring. They have not been applied to cloud accounts or validated; review provider prerequisites and cost estimates before use.

After configuring `infrastructure/.env.selfhost`, run `bash infrastructure/scripts/deploy.sh` to build and start the stack.

```sh
cp infrastructure/.env.selfhost.example infrastructure/.env.selfhost
# Edit the file with the university's domain, instance name and unique secrets.
docker compose --env-file infrastructure/.env.selfhost -f infrastructure/compose.yaml --profile selfhost up -d --build
```

Inspect service status:

```sh
docker compose --env-file infrastructure/.env.selfhost -f infrastructure/compose.yaml --profile selfhost ps
docker compose --env-file infrastructure/.env.selfhost -f infrastructure/compose.yaml --profile selfhost logs --tail=100 api web caddy
```

Do not expose PostgreSQL publicly. No Google service-account key or hosted-provider credential is part of this runtime.

## Release and configuration

The project beta candidate is **Squire 1.0.0-beta.1** across the web/API and optional coach Android app. The [project readiness table](release-checklist.md#project-beta-readiness-19-october-2026) distinguishes evaluation readiness from publication and each installation’s live-data checks. Follow [Android beta builds and updates](android-release.md) for signing, APK packaging and installation/upgrade acceptance. Private signing material is separate from institution server secrets; never include it in Compose images or public release assets.

Build and validate the approved revision before deployment. Apply forward migrations as part of the Compose release flow; never reset or reseed a hosted database. Review the [release checklist](release-checklist.md) and [known release gaps](../known-issues/README.md) before enabling external use.

Store the production env file outside source control with access limited to the university operators. Use unique instance secrets. Rotate secrets through a planned deployment; never paste credentials into issue trackers, logs, commits or check receipts. The self-hosted profile does not need SMTP, Google service-account keys, or hosted-provider credentials. Keep the service on a private network until the first super admin completes setup. Invitees choose their password from a single-use link that expires after seven days; no email is delivered or verified. Operators must share that link privately.

Instance branding (name, accent, light/dark page backgrounds and optional PNG/JPEG/WebP logo) is stored in PostgreSQL and therefore travels with database backups and restores. UI surfaces derive from those colors; text/accent colors adjust for contrast. The first super admin controls these settings; the image is limited to 512 KB. Keep the backup protected as sensitive operational data. Branding is not supplied by environment variables and remains after application image updates.

## Release assets and landing downloads

Use GitHub Releases as the canonical download host. The landing site should display release/version information and link to the matching GitHub source/archive and uploaded assets; do not copy release binaries into the landing repository or Vercel deployment. Use explicit versioned links for beta assets and enable download buttons only when those assets actually exist. See [GitHub release links](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases).

Label GitHub ZIP/tar.gz downloads **source code**: operators still configure secrets and build/run Compose. They are not prebuilt Docker-image bundles, database backups or an installed application. GitHub-generated archives can change compressed bytes when regenerated; pin the source commit/tag for content provenance and attach a reviewed custom source asset if fixed archive-byte checksums are needed. See [archive stability](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives#stability-of-source-code-archives).

For an accepted Android package, upload the signed APK, its `SHA256SUMS` and non-secret build metadata to the matching GitHub prerelease. Checksum entries must describe the actual uploaded files. Keep the APK's compiled source revision visible; do not describe the current follow-up candidate as built from the older source tag. Never package the working directory wholesale: signing material, local env files, backups and fixture data are not release assets.

Before publication, merge the reviewed source/docs changes, select the exact release source/tag and ensure the English/Arabic landing guidance names that same version and supported behavior. This documentation update does not publish assets or change tags automatically.

## Backup, recovery and rollback

Android field queues are device-local and are not part of server backups. The app disables automatic Android app-data backup, retains encrypted field commands and score drafts after sign-out, and requires the same account/server to recover it. Loss of app data or its key can lose unsent work. Explicit plain-text recovery sharing is implemented; no automatic import or remote wipe exists. A sign-out can remove local credentials while server revocation is unconfirmed. For device loss, follow institution incident procedures and suspend the account if required. See the [Android recovery guide](../development/android.md).

Use `bash infrastructure/scripts/backup.sh` to create checksummed PostgreSQL and private-file archives under the ignored `infrastructure/backups/` directory. Treat both archives as sensitive identity and health data. Store an encrypted copy on separate university-controlled storage and define a retention schedule.

Restore into a clean, matching Compose instance: start PostgreSQL, apply migrations once, then run `bash infrastructure/scripts/restore.sh infrastructure/.env.selfhost /path/to/backup-directory`. Restore replaces the database and private-file volume. Confirm the target and checksums before proceeding, then validate login and authorized private-file access.

Rollback is not a reverse migration. Take a paired database/file backup before updating. To return to an earlier application revision, restore the matching pre-update database and private-file archive together, then start the earlier revision. The founder accepts the earlier backup/restore verification; the integrated upgrade/rollback rehearsal and production review remain open.

## Retention operations

The API performs a retention pass at startup and daily after success; a failure retries after 15 minutes. The deployment-wide checkpoint contains only completion time and aggregate closed/purged counts. Alert if it is missing after startup or older than 48 hours:

```sql
SELECT completed_at, now() - completed_at AS age, closed_count, purged_count
FROM public.organization_injury_retention_checkpoint
WHERE singleton;
```

An isolated Docker database/API outage-and-restart rehearsal passed on 17 October 2026. Actual monitoring alert delivery remains unverified. Do not use real athlete data until university privacy/security review and consent/retention approval are complete.

## Local development and verification

Use [development setup](../development/README.md) for local PostgreSQL, API, web and sample-account access. Use [testing](../testing/README.md) for focused commands and prerequisites, and [verification](../verification/README.md) for checks actually performed and their limits.
