# Operations

This is the operator entry point for builds, self-hosted deployment, configuration, secrets, backups, recovery and operational checks. Rafik is deployed as a separate instance on infrastructure controlled by each university.

## Deployment

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

Build and validate the approved revision before deployment. Apply forward migrations as part of the Compose release flow; never reset or reseed a hosted database. Review the [release checklist](release-checklist.md) and [known release gaps](../known-issues/README.md) before enabling external use.

Store the production env file outside source control with access limited to the university operators. Use unique instance secrets. Rotate secrets through a planned deployment; never paste credentials into issue trackers, logs, commits or check receipts. The self-hosted profile does not need SMTP, Google service-account keys, or hosted-provider credentials. Keep the service on a private network until the first super admin completes setup. Invitees choose their password from a single-use link that expires after seven days; no email is delivered or verified. Operators must share that link privately.

Instance branding (name, accent, light/dark page backgrounds and optional PNG/JPEG/WebP logo) is stored in PostgreSQL and therefore travels with database backups and restores. UI surfaces derive from those colors; text/accent colors adjust for contrast. The first super admin controls these settings; the image is limited to 512 KB. Keep the backup protected as sensitive operational data. Branding is not supplied by environment variables and remains after application image updates.

## Backup, recovery and rollback

Android field queues are device-local and are not part of server backups. The app disables automatic Android app-data backup, retains encrypted field commands and score drafts after sign-out, and requires the same account/server to recover it. Loss of app data or its key can lose unsent work; no remote-wipe or recovery-export feature exists yet. A sign-out can remove local credentials while server revocation is unconfirmed. For device loss, follow institution incident procedures and suspend the account if required. See the [Android recovery guide](../development/android.md).

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
