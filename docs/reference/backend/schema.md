# Backend schema reference

Generated from a fresh migrated PostgreSQL catalog and reviewed purpose metadata. This is schema/source evidence, not production-data or runtime authorization acceptance. Regenerate with `npm run backend:inventory`; refresh the catalog after migrations with `npm run backend:inventory:database`.

94 physical tables; 761 columns. SQL constraints, policies and triggers are authoritative; Prisma relations are not additional physical columns. Full raw catalog: [verification receipt](../../verification/receipts/backend-schema-catalog.json).

## Table index

| Table | Domain | Treatment | Purpose |
| --- | --- | --- | --- |
| [file_store.buckets](#file_storebuckets) | Files and media | retain-history | Historical private-file bucket configuration and upload limits. |
| [file_store.objects](#file_storeobjects) | Files and media | retain-history | Historical private-file metadata linked to byte storage; MIME and ownership-aware RLS remain necessary for recovery/deletion. |
| [identity.mobile_sessions](#identitymobile_sessions) | Identity and access | retain-current | Rotating native access/refresh token hashes, device identity and revocation. |
| [identity.password_setup_tokens](#identitypassword_setup_tokens) | Identity and access | retain-current | Hashed, expiring one-time password setup tokens issued by administrators. |
| [identity.rate_limits](#identityrate_limits) | Identity and access | retain-current | Authentication request counters and time windows. |
| [identity.sessions](#identitysessions) | Identity and access | retain-current | Hashed browser session tokens and expiration. |
| [identity.users](#identityusers) | Identity and access | retain-current | Account identity, password hash and creation metadata; email is an unverified identifier. |
| [public.appointment_slots](#publicappointment_slots) | Historical compatibility | retain-history | Historical standalone coach availability, retained for account export and dependency-safe deletion. |
| [public.appointments](#publicappointments) | Historical compatibility | retain-history | Historical standalone booking and attendance records, not current institutional scheduling. |
| [public.assessment_result_history](#publicassessment_result_history) | Training and scheduling | retain-current | Attributed previous versions of participant assessment scores. |
| [public.assessment_results](#publicassessment_results) | Training and scheduling | retain-current | Current per-participant assessment scores and notes, separate from attendance/workout actuals. |
| [public.assessment_templates](#publicassessment_templates) | Training and scheduling | retain-current | Reusable assessment definitions, units, bounds and version. |
| [public.assignments](#publicassignments) | Historical compatibility | retain-history | Historical personal coaching assignments; source links are required by old workout history/replay. |
| [public.business_accounts](#publicbusiness_accounts) | Historical compatibility | retain-history | Historical commercial account state retained for own-account export/deletion; no current billing product. |
| [public.business_events](#publicbusiness_events) | Historical compatibility | retain-history | Historical provider receipt payloads retained for export; provider mutation and simulation are retired. |
| [public.client_context](#publicclient_context) | Historical compatibility | retain-history | Historical relationship goals/constraints retained for own-account export. |
| [public.coach_clients](#publiccoach_clients) | Historical compatibility | retain-history | Historical personal coaching relationships and privacy boundaries for owned records. |
| [public.coaching_forms](#publiccoaching_forms) | Historical compatibility | retain-history | Historical coach-authored forms referenced by exported requests. |
| [public.coaching_requests](#publiccoaching_requests) | Historical compatibility | retain-history | Historical form requests, answers and correction state retained for account export. |
| [public.conversation_reads](#publicconversation_reads) | Historical compatibility | retain-history | Historical direct-conversation read cursors retained for export. |
| [public.exercises](#publicexercises) | Reference library | retain-reference | Canonical/reference exercise metadata and historical personal exercise ownership. |
| [public.instance_branding](#publicinstance_branding) | Institution and operations | retain-current | One installation branding configuration: name, colors, logo metadata and revision. |
| [public.institution_assets](#publicinstitution_assets) | Files and media | retain-current | Institution file ownership, scope/purpose, channel boundary and byte lifecycle. |
| [public.institution_assignments](#publicinstitution_assignments) | Training and scheduling | retain-current | Athlete assignment to an immutable program version, date range, goal/sport and independent sequence cursor. |
| [public.institution_audit_events](#publicinstitution_audit_events) | Institution and operations | retain-current | Institution-scoped attributed audit events for supported commands. |
| [public.institution_channel_members](#publicinstitution_channel_members) | Communication and feedback | retain-current | Private/group channel authority and membership snapshots. |
| [public.institution_channel_reads](#publicinstitution_channel_reads) | Communication and feedback | retain-current | Per-member message read position. |
| [public.institution_channels](#publicinstitution_channels) | Communication and feedback | retain-current | Institution direct-pair/group conversation identity with distinct access rules. |
| [public.institution_coaching_links](#publicinstitution_coaching_links) | Institution and operations | retain-current | Primary/supporting coach relationships with sport scope and attribution/history. |
| [public.institution_event_people](#publicinstitution_event_people) | Training and scheduling | retain-current | Frozen event roster, staff/athlete duty, attendance and participant revision. |
| [public.institution_events](#publicinstitution_events) | Training and scheduling | retain-current | Timed training/assessment occurrences, timezone/date, source snapshot and lifecycle. |
| [public.institution_exercises](#publicinstitution_exercises) | Institution and operations | retain-current | Institution-authored exercise metadata and visibility to authorized staff. |
| [public.institution_group_members](#publicinstitution_group_members) | Institution and operations | retain-current | Current institution group membership; does not rewrite historical event rosters. |
| [public.institution_groups](#publicinstitution_groups) | Institution and operations | retain-current | Institution groups used to select participants and coaches. |
| [public.institution_injury_access_log](#publicinstitution_injury_access_log) | Health and privacy | retain-current | Audited permitted participation-status access/actions. |
| [public.institution_injury_history](#publicinstitution_injury_history) | Health and privacy | retain-current | Attributed historical versions of participation restrictions. |
| [public.institution_injury_operations](#publicinstitution_injury_operations) | Health and privacy | retain-current | Hash-only exact health-write acknowledgments; sensitive request content is not copied into receipts. |
| [public.institution_injury_permissions](#publicinstitution_injury_permissions) | Health and privacy | retain-current | Product consent/assent prerequisites and withdrawal checkpoints for participation-status sharing. |
| [public.institution_injury_records](#publicinstitution_injury_records) | Health and privacy | retain-current | Athlete-authored non-diagnostic participation restrictions; not general administrator-visible medical records. |
| [public.institution_injury_retention_checkpoint](#publicinstitution_injury_retention_checkpoint) | Health and privacy | retain-current | Non-identifying aggregate checkpoints for closed-record retention cleanup. |
| [public.institution_invitations](#publicinstitution_invitations) | Institution and operations | retain-current | Seven-day single-use institution invitation hashes, roles and sport metadata. |
| [public.institution_meal_history](#publicinstitution_meal_history) | Nutrition | retain-current | Attributed previous versions of actual nutrition entries. |
| [public.institution_meals](#publicinstitution_meals) | Nutrition | retain-current | Athlete actual consumption entries, kept separate from suggested meal plans. |
| [public.institution_member_sports](#publicinstitution_member_sports) | Institution and operations | retain-current | Membership-to-sport/specialty assignments. |
| [public.institution_members](#publicinstitution_members) | Institution and operations | retain-current | Institution membership, one role, active/revoked state, primary-coach mirror and revision. |
| [public.institution_message_assets](#publicinstitution_message_assets) | Files and media | retain-current | Ordered many-attachment links for institution messages. |
| [public.institution_messages](#publicinstitution_messages) | Communication and feedback | retain-current | Institution message body, sender and attachment compatibility reference. |
| [public.institution_nutrition_plans](#publicinstitution_nutrition_plans) | Nutrition | retain-current | Institution nutrition guidance snapshots assigned to an athlete. |
| [public.institution_nutrition_sharing](#publicinstitution_nutrition_sharing) | Nutrition | retain-current | Athlete authorization and revision for coach visibility of actual nutrition records. |
| [public.institution_operations](#publicinstitution_operations) | Institution and operations | retain-current | Exact actor/institution-scoped command payload and response receipts. |
| [public.institution_programs](#publicinstitution_programs) | Training and scheduling | retain-current | Editable institution program drafts, publication/library state and revision. |
| [public.institution_session_feedback](#publicinstitution_session_feedback) | Communication and feedback | retain-current | Explicit athlete ratings tied to a workout or event; missing feedback is unknown. |
| [public.institution_session_history](#publicinstitution_session_history) | Training and scheduling | retain-current | Attributed workout actual-result versions; corrections retain history. |
| [public.institution_sessions](#publicinstitution_sessions) | Training and scheduling | retain-current | Athlete workout document, prescription/actual results, recorder attribution and optional scoped occurrence link. |
| [public.institution_sports](#publicinstitution_sports) | Institution and operations | retain-current | Institution sports and coaching specialties, ordered and archived explicitly. |
| [public.institution_versions](#publicinstitution_versions) | Training and scheduling | retain-current | Immutable published institution program snapshots referenced by assignments and history. |
| [public.institution_workout_positions](#publicinstitution_workout_positions) | Training and scheduling | retain-current | Assignment sequence position/cycle, occurrence/workout links and attributed once-only resolution. |
| [public.institution_workout_recurrences](#publicinstitution_workout_recurrences) | Training and scheduling | retain-current | Bounded weekly individual schedule rules; the recurring worker remains pending. |
| [public.institution_workplace_feedback](#publicinstitution_workplace_feedback) | Communication and feedback | retain-current | Explicit monthly coach workplace feedback; distinct from athlete experience. |
| [public.institutions](#publicinstitutions) | Institution and operations | retain-current | Persistent institution identity and historical scope keys; one institution is supported per installation. |
| [public.invitations](#publicinvitations) | Historical compatibility | retain-history | Historical personal assignment/invitation records referenced by retained SQL lifecycle code; no new HTTP invitation flow. |
| [public.meal_entries](#publicmeal_entries) | Historical compatibility | retain-history | Historical personal food-consumption entries retained for own-account export. |
| [public.measurements](#publicmeasurements) | Historical compatibility | retain-history | Historical athlete measurements retained for own-account export. |
| [public.messages](#publicmessages) | Historical compatibility | retain-history | Historical private pair messages and linked workout/resource references; no standalone thread endpoint. |
| [public.notification_events](#publicnotification_events) | Communication and feedback | retain-current | Per-user notification inbox and delivery checkpoints; not proof of external delivery. |
| [public.notification_intercepts](#publicnotification_intercepts) | Communication and feedback | retain-current | Local delivery-adapter interception evidence, not a production email service. |
| [public.notification_preferences](#publicnotification_preferences) | Communication and feedback | retain-current | Explicit user category/channel preferences and quiet hours. |
| [public.nutrition_guidance](#publicnutrition_guidance) | Historical compatibility | retain-history | Historical personal nutrition suggestions retained separately from actual consumption. |
| [public.plan_deliveries](#publicplan_deliveries) | Historical compatibility | retain-history | Historical personal-plan delivery receipts retained for lifecycle/reconciliation; no new standalone delivery endpoint. |
| [public.plan_versions](#publicplan_versions) | Reference library | retain-reference | Immutable personal/reference program versions required by historical workouts and reference fixtures. |
| [public.plans](#publicplans) | Historical compatibility | retain-history | Historical personal program drafts and ownership referenced by exported versions. |
| [public.platform_grants](#publicplatform_grants) | Institution and operations | retain-current | Explicit operator authority; institution administration does not imply this grant. |
| [public.platform_identity_state](#publicplatform_identity_state) | Institution and operations | retain-current | Operator-managed account suspension state independent from institution role. |
| [public.platform_operations](#publicplatform_operations) | Institution and operations | retain-current | Exact operator write receipts and actor attribution. |
| [public.profiles](#publicprofiles) | Identity and access | retain-current | Own account display name, locale, measurement units and timezone; identity bridge for historical subject data. |
| [public.program_media](#publicprogram_media) | Files and media | retain-current | Institution program artwork metadata and private-byte identity. |
| [public.resource_shares](#publicresource_shares) | Historical compatibility | retain-history | Historical per-relationship resource permissions needed by byte reads/export/deletion. |
| [public.resources](#publicresources) | Historical compatibility | retain-history | Historical personal file ownership, pending/ready/retired state and byte path; only recovery and cleanup remain exposed. |
| [public.saved_foods](#publicsaved_foods) | Historical compatibility | retain-history | Historical user-created food references retained for account export. |
| [public.schedule_exceptions](#publicschedule_exceptions) | Historical compatibility | retain-history | Historical personal assignment calendar exceptions retained for export. |
| [public.session_operations](#publicsession_operations) | Historical compatibility | retain-history | Exact historical workout write receipts; prevents uncertain retries from applying twice. |
| [public.sessions](#publicsessions) | Historical compatibility | retain-history | Historical personal workout prescriptions/actuals and immutable source links; private read/replay/export remain supported. |
| [public.set_entries](#publicset_entries) | Institution and operations | retain-current | Historical per-exercise/set actual measurements belonging to personal workouts. |
| [public.support_cases](#publicsupport_cases) | Institution and operations | retain-current | Locally owned support reports and replies; legacy team scope is retained only for existing cases. |
| [public.team_activity](#publicteam_activity) | Historical compatibility | retain-history | Historical team activity/audit records retained for export and lifecycle checks. |
| [public.team_assignments](#publicteam_assignments) | Historical compatibility | retain-history | Historical team plan deliveries retained for export. |
| [public.team_clients](#publicteam_clients) | Historical compatibility | retain-history | Historical team enrollment and assigned-coach ownership retained for export/deletion checks. |
| [public.team_group_members](#publicteam_group_members) | Historical compatibility | retain-history | Historical team group roster links retained for export. |
| [public.team_groups](#publicteam_groups) | Historical compatibility | retain-history | Historical team group definitions retained for export. |
| [public.team_invitations](#publicteam_invitations) | Historical compatibility | retain-history | Historical team invitations referenced by lifecycle/account cleanup; no current team acquisition API. |
| [public.team_members](#publicteam_members) | Historical compatibility | retain-history | Historical team roles used by existing record access/deletion rules. |
| [public.team_plans](#publicteam_plans) | Historical compatibility | retain-history | Historical team-shared plan links retained with immutable versions. |
| [public.team_resource_shares](#publicteam_resource_shares) | Historical compatibility | retain-history | Historical team byte-sharing permissions retained for private file access/deletion. |
| [public.teams](#publicteams) | Historical compatibility | retain-history | Historical gym/team identity, distinct from the supported installation institution. |

## file_store.buckets

Historical private-file bucket configuration and upload limits.

- Prisma model: `buckets`; domain: Files and media; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [file_store.objects](schema.md#file_storeobjects).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `text` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `name` | `text` | no | — | Display name for this entity. |
| `public` | `boolean` | no | `false` | Historical bucket public flag; private byte access still follows authorization. |
| `file_size_limit` | `bigint` | yes | — | Historical bucket upload size cap. |
| `allowed_mime_types` | `text[]` | yes | — | Historical bucket MIME allowlist. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `buckets_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX buckets_pkey ON file_store.buckets USING btree (id);
```


</details>

## file_store.objects

Historical private-file metadata linked to byte storage; MIME and ownership-aware RLS remain necessary for recovery/deletion.

- Prisma model: `objects`; domain: Files and media; treatment: **retain-history**.
- Direct server source references: [server/files.ts](../../../apps/backend/server/files.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `bucket_id` | `text` | no | — | Linked bucket identity; scope and target are shown in the foreign keys below. |
| `name` | `text` | no | — | Display name for this entity. |
| `metadata` | `jsonb` | no | — | Historical object metadata, including MIME and size. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `objects_bucket_id_fkey`: `FOREIGN KEY (bucket_id) REFERENCES file_store.buckets(id)`
- `objects_bucket_id_name_key`: `UNIQUE (bucket_id, name)`
- `objects_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX objects_bucket_id_name_key ON file_store.objects USING btree (bucket_id, name);
CREATE UNIQUE INDEX objects_pkey ON file_store.objects USING btree (id);
```

- Policy `rafik_resource_delete` (DELETE): USING `((bucket_id = 'rafik-private'::text) AND (EXISTS ( SELECT 1    FROM resources r   WHERE ((r.object_path = objects.name) AND (r.owner_id = identity.actor_id()) AND (r.state = 'retired'::text)))))`; CHECK `—`.
- Policy `rafik_resource_read` (SELECT): USING `((bucket_id = 'rafik-private'::text) AND (EXISTS ( SELECT 1    FROM resources r   WHERE ((r.object_path = objects.name) AND can_read_resource(r.id)))))`; CHECK `—`.
- Policy `rafik_resource_upload` (INSERT): USING `—`; CHECK `((bucket_id = 'rafik-private'::text) AND can_upload_resource(name))`.

</details>

## identity.mobile_sessions

Rotating native access/refresh token hashes, device identity and revocation.

- Prisma model: `mobile_sessions`; domain: Identity and access; treatment: **retain-current**.
- Direct server source references: [server/auth.ts](../../../apps/backend/server/auth.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `user_id` | `uuid` | no | — | Global account subject. |
| `access_token_hash` | `text` | no | — | Hash of a short-lived native access token. |
| `refresh_token_hash` | `text` | no | — | Hash of the current rotating native refresh token. |
| `previous_refresh_token_hash` | `text` | yes | — | Previous native refresh hash used for safe retry detection. |
| `access_expires_at` | `timestamp with time zone` | no | — | Native access-token expiry. |
| `expires_at` | `timestamp with time zone` | no | — | Expiration instant. |
| `absolute_expires_at` | `timestamp with time zone` | no | — | Absolute native-session expiry. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `last_seen_at` | `timestamp with time zone` | no | `now()` | Native device/session last-used timestamp. |
| `revoked_at` | `timestamp with time zone` | yes | — | Explicit native-session revocation time. |
| `device_name` | `text` | no | `'Android device'::text` | Human-readable native device label; not an authorization grant. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `mobile_sessions_access_token_hash_check`: `CHECK ((access_token_hash ~ '^[a-f0-9]{64}$'::text))`
- `mobile_sessions_access_token_hash_key`: `UNIQUE (access_token_hash)`
- `mobile_sessions_check`: `CHECK ((access_expires_at <= expires_at))`
- `mobile_sessions_check1`: `CHECK ((expires_at <= absolute_expires_at))`
- `mobile_sessions_device_name_check`: `CHECK (((length(device_name) >= 1) AND (length(device_name) <= 80)))`
- `mobile_sessions_pkey`: `PRIMARY KEY (id)`
- `mobile_sessions_previous_refresh_token_hash_check`: `CHECK (((previous_refresh_token_hash IS NULL) OR (previous_refresh_token_hash ~ '^[a-f0-9]{64}$'::text)))`
- `mobile_sessions_previous_refresh_token_hash_key`: `UNIQUE (previous_refresh_token_hash)`
- `mobile_sessions_refresh_token_hash_check`: `CHECK ((refresh_token_hash ~ '^[a-f0-9]{64}$'::text))`
- `mobile_sessions_refresh_token_hash_key`: `UNIQUE (refresh_token_hash)`
- `mobile_sessions_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX mobile_sessions_access_token_hash_key ON identity.mobile_sessions USING btree (access_token_hash);
CREATE UNIQUE INDEX mobile_sessions_pkey ON identity.mobile_sessions USING btree (id);
CREATE UNIQUE INDEX mobile_sessions_previous_refresh_token_hash_key ON identity.mobile_sessions USING btree (previous_refresh_token_hash);
CREATE UNIQUE INDEX mobile_sessions_refresh_token_hash_key ON identity.mobile_sessions USING btree (refresh_token_hash);
CREATE INDEX mobile_sessions_user_active ON identity.mobile_sessions USING btree (user_id, expires_at) WHERE (revoked_at IS NULL);
```


</details>

## identity.password_setup_tokens

Hashed, expiring one-time password setup tokens issued by administrators.

- Prisma model: `password_setup_tokens`; domain: Identity and access; treatment: **retain-current**.
- Direct server source references: [server/auth.ts](../../../apps/backend/server/auth.ts), [server/institution.ts](../../../apps/backend/server/institution.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `token_hash` | `text` | no | — | One-way token hash; never the usable token. |
| `user_id` | `uuid` | no | — | Global account subject. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `expires_at` | `timestamp with time zone` | no | — | Expiration instant. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `password_setup_tokens_created_by_fkey`: `FOREIGN KEY (created_by) REFERENCES identity.users(id) ON DELETE CASCADE`
- `password_setup_tokens_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `password_setup_tokens_pkey`: `PRIMARY KEY (token_hash)`
- `password_setup_tokens_token_hash_check`: `CHECK ((token_hash ~ '^[a-f0-9]{64}$'::text))`
- `password_setup_tokens_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX password_setup_tokens_pkey ON identity.password_setup_tokens USING btree (token_hash);
CREATE INDEX password_setup_tokens_user_expiry ON identity.password_setup_tokens USING btree (user_id, expires_at);
```


</details>

## identity.rate_limits

Authentication request counters and time windows.

- Prisma model: `rate_limits`; domain: Identity and access; treatment: **retain-current**.
- Direct server source references: [server/auth.ts](../../../apps/backend/server/auth.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `key` | `text` | no | — | Stable limiter/key identity. |
| `count` | `integer` | no | `1` | Limiter/window count. |
| `window_start` | `timestamp with time zone` | no | `now()` | Rate-limit window start. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `rate_limits_pkey`: `PRIMARY KEY (key)`

```sql
CREATE UNIQUE INDEX rate_limits_pkey ON identity.rate_limits USING btree (key);
```


</details>

## identity.sessions

Hashed browser session tokens and expiration.

- Prisma model: `identity_sessions`; domain: Identity and access; treatment: **retain-current**.
- Direct server source references: [server/auth.ts](../../../apps/backend/server/auth.ts), [server/platform.ts](../../../apps/backend/server/platform.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `token_hash` | `text` | no | — | One-way token hash; never the usable token. |
| `user_id` | `uuid` | no | — | Global account subject. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `expires_at` | `timestamp with time zone` | no | — | Expiration instant. |
| `last_seen_at` | `timestamp with time zone` | no | `now()` | Native device/session last-used timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `sessions_pkey`: `PRIMARY KEY (token_hash)`
- `sessions_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX sessions_pkey ON identity.sessions USING btree (token_hash);
CREATE INDEX sessions_user ON identity.sessions USING btree (user_id);
```


</details>

## identity.users

Account identity, password hash and creation metadata; email is an unverified identifier.

- Prisma model: `users`; domain: Identity and access; treatment: **retain-current**.
- Direct server source references: [server/auth.ts](../../../apps/backend/server/auth.ts), [server/institution.ts](../../../apps/backend/server/institution.ts), [server/platform.ts](../../../apps/backend/server/platform.ts).
- Referenced by: [identity.mobile_sessions](schema.md#identitymobile_sessions), [identity.password_setup_tokens](schema.md#identitypassword_setup_tokens), [identity.sessions](schema.md#identitysessions), [public.instance_branding](schema.md#publicinstance_branding), [public.institution_audit_events](schema.md#publicinstitution_audit_events), [public.institution_invitations](schema.md#publicinstitution_invitations), [public.institution_members](schema.md#publicinstitution_members), [public.institution_operations](schema.md#publicinstitution_operations), [public.institutions](schema.md#publicinstitutions), [public.plan_deliveries](schema.md#publicplan_deliveries), [public.platform_grants](schema.md#publicplatform_grants), [public.platform_identity_state](schema.md#publicplatform_identity_state), [public.platform_operations](schema.md#publicplatform_operations), [public.profiles](schema.md#publicprofiles), [public.program_media](schema.md#publicprogram_media).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `email` | `text` | yes | — | Account/invitation identifier; not verified by this deployment flow. |
| `email_confirmed_at` | `timestamp with time zone` | yes | — | Historical identity metadata; do not infer an active email-verification flow. |
| `raw_user_meta_data` | `jsonb` | no | `'{}'::jsonb` | Account metadata; never a source of authorization grants. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `password_hash` | `text` | yes | — | Password hash; never plaintext or a public API field. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `users_email_key`: `UNIQUE (email)`
- `users_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX users_email_key ON identity.users USING btree (email);
CREATE UNIQUE INDEX users_pkey ON identity.users USING btree (id);
```


</details>

## public.appointment_slots

Historical standalone coach availability, retained for account export and dependency-safe deletion.

- Prisma model: `appointment_slots`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.appointments](schema.md#publicappointments).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `series_id` | `uuid` | no | — | Linked series identity; scope and target are shown in the foreign keys below. |
| `coach_id` | `uuid` | no | — | Linked coach identity; scope and target are shown in the foreign keys below. |
| `starts_at` | `timestamp with time zone` | no | — | Fixed occurrence/booking start instant. |
| `ends_at` | `timestamp with time zone` | no | — | Fixed occurrence/booking end instant. |
| `local_start` | `timestamp without time zone` | no | — | Historical local date/time source used to create availability. |
| `timezone` | `text` | no | — | IANA timezone used for date/clock interpretation. |
| `title` | `text` | no | — | Human-readable title. |
| `location` | `text` | no | — | Human-readable occurrence location. |
| `state` | `text` | no | `'open'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `appointment_slots_check`: `CHECK ((ends_at > starts_at))`
- `appointment_slots_coach_id_fkey`: `FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `appointment_slots_pkey`: `PRIMARY KEY (id)`
- `appointment_slots_series_id_starts_at_key`: `UNIQUE (series_id, starts_at)`
- `appointment_slots_state_check`: `CHECK ((state = ANY (ARRAY['open'::text, 'booked'::text, 'withdrawn'::text])))`

```sql
CREATE UNIQUE INDEX appointment_slots_pkey ON public.appointment_slots USING btree (id);
CREATE UNIQUE INDEX appointment_slots_series_id_starts_at_key ON public.appointment_slots USING btree (series_id, starts_at);
CREATE INDEX slots_coach_time ON public.appointment_slots USING btree (coach_id, starts_at);
```

- Policy `slots_coach_clients` (SELECT): USING `((coach_id = identity.actor_id()) OR ((state <> 'withdrawn'::text) AND (EXISTS ( SELECT 1    FROM coach_clients c   WHERE ((c.coach_id = appointment_slots.coach_id) AND (c.client_id = identity.actor_id()) AND (c.state = 'active'::text))))))`; CHECK `—`.

</details>

## public.appointments

Historical standalone booking and attendance records, not current institutional scheduling.

- Prisma model: `appointments`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `relationship_id` | `uuid` | no | — | Historical private coach/athlete pair identity. |
| `slot_id` | `uuid` | no | — | Linked slot identity; scope and target are shown in the foreign keys below. |
| `starts_at` | `timestamp with time zone` | no | — | Fixed occurrence/booking start instant. |
| `ends_at` | `timestamp with time zone` | no | — | Fixed occurrence/booking end instant. |
| `title` | `text` | no | — | Human-readable title. |
| `location` | `text` | no | — | Human-readable occurrence location. |
| `timezone` | `text` | no | — | IANA timezone used for date/clock interpretation. |
| `state` | `text` | no | `'booked'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `note` | `text` | no | `''::text` | Scoped user-entered note; not a place to bypass health-record permissions. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `appointments_pkey`: `PRIMARY KEY (id)`
- `appointments_relationship_id_fkey`: `FOREIGN KEY (relationship_id) REFERENCES coach_clients(id) ON DELETE CASCADE`
- `appointments_slot_id_fkey`: `FOREIGN KEY (slot_id) REFERENCES appointment_slots(id)`
- `appointments_state_check`: `CHECK ((state = ANY (ARRAY['booked'::text, 'cancelled'::text, 'attended'::text, 'missed'::text])))`

```sql
CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);
CREATE INDEX appointments_relationship_time ON public.appointments USING btree (relationship_id, starts_at);
CREATE UNIQUE INDEX slot_one_booking ON public.appointments USING btree (slot_id) WHERE (state = 'booked'::text);
CREATE TRIGGER appointment_institution_conflict BEFORE INSERT OR UPDATE OF starts_at, ends_at, state ON public.appointments FOR EACH ROW EXECUTE FUNCTION guard_institution_booking_conflict();
CREATE TRIGGER notification_appointment AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION capture_domain_notification();
```

- Policy `appointments_participants` (SELECT): USING `(EXISTS ( SELECT 1    FROM coach_clients c   WHERE ((c.id = appointments.relationship_id) AND ((identity.actor_id() = c.coach_id) OR (identity.actor_id() = c.client_id)))))`; CHECK `—`.

</details>

## public.assessment_result_history

Attributed previous versions of participant assessment scores.

- Prisma model: `assessment_result_history`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/calendar.ts](../../../apps/backend/server/calendar.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `event_id` | `uuid` | no | — | Linked event identity; scope and target are shown in the foreign keys below. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `revision` | `integer` | no | — | Optimistic record revision checked before edits. |
| `document` | `jsonb` | no | — | Workout prescription, actual measurements, notes and recorded version. |
| `recorded_by` | `uuid` | no | — | Attributed recorder identity. |
| `recorded_at` | `timestamp with time zone` | no | `now()` | Recorded result/history timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `assessment_result_history_event_id_member_id_fkey`: `FOREIGN KEY (event_id, member_id) REFERENCES assessment_results(event_id, member_id) ON DELETE CASCADE`
- `assessment_result_history_event_id_member_id_revision_key`: `UNIQUE (event_id, member_id, revision)`
- `assessment_result_history_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `assessment_result_history_institution_id_recorded_by_fkey`: `FOREIGN KEY (institution_id, recorded_by) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `assessment_result_history_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX assessment_result_history_event_id_member_id_revision_key ON public.assessment_result_history USING btree (event_id, member_id, revision);
CREATE UNIQUE INDEX assessment_result_history_pkey ON public.assessment_result_history USING btree (id);
```


</details>

## public.assessment_results

Current per-participant assessment scores and notes, separate from attendance/workout actuals.

- Prisma model: `assessment_results`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/analytics.ts](../../../apps/backend/server/analytics.ts), [server/calendar.ts](../../../apps/backend/server/calendar.ts), [server/notifications.ts](../../../apps/backend/server/notifications.ts).
- Referenced by: [public.assessment_result_history](schema.md#publicassessment_result_history).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `event_id` | `uuid` | no | — | Linked event identity; scope and target are shown in the foreign keys below. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `values` | `jsonb` | no | — | Recorded assessment/measurement values, interpreted using their definition. |
| `note` | `text` | no | `''::text` | Scoped user-entered note; not a place to bypass health-record permissions. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `recorded_by` | `uuid` | no | — | Attributed recorder identity. |
| `recorded_at` | `timestamp with time zone` | no | `now()` | Recorded result/history timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `assessment_results_event_id_member_id_fkey`: `FOREIGN KEY (event_id, member_id) REFERENCES institution_event_people(event_id, member_id) ON DELETE CASCADE`
- `assessment_results_institution_id_event_id_fkey`: `FOREIGN KEY (institution_id, event_id) REFERENCES institution_events(institution_id, id) ON DELETE CASCADE`
- `assessment_results_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `assessment_results_institution_id_recorded_by_fkey`: `FOREIGN KEY (institution_id, recorded_by) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `assessment_results_pkey`: `PRIMARY KEY (event_id, member_id)`

```sql
CREATE UNIQUE INDEX assessment_results_pkey ON public.assessment_results USING btree (event_id, member_id);
CREATE TRIGGER notification_org_result AFTER INSERT OR UPDATE ON public.assessment_results FOR EACH ROW EXECUTE FUNCTION capture_domain_notification();
```


</details>

## public.assessment_templates

Reusable assessment definitions, units, bounds and version.

- Prisma model: `assessment_templates`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/calendar.ts](../../../apps/backend/server/calendar.ts), [server/service-catalog.ts](../../../apps/backend/server/service-catalog.ts).
- Referenced by: [public.institution_events](schema.md#publicinstitution_events).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `title` | `text` | no | — | Human-readable title. |
| `definition` | `jsonb` | no | — | Assessment definition, result types, units and bounds; occurrences keep their own snapshot. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `archived` | `boolean` | no | `false` | Archived identity/draft flag; archival is not data deletion. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `assessment_templates_institution_id_created_by_fkey`: `FOREIGN KEY (institution_id, created_by) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `assessment_templates_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `assessment_templates_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `assessment_templates_pkey`: `PRIMARY KEY (id)`
- `assessment_templates_title_check`: `CHECK (((char_length(title) >= 1) AND (char_length(title) <= 100)))`

```sql
CREATE UNIQUE INDEX assessment_templates_institution_id_id_key ON public.assessment_templates USING btree (institution_id, id);
CREATE UNIQUE INDEX assessment_templates_pkey ON public.assessment_templates USING btree (id);
```


</details>

## public.assignments

Historical personal coaching assignments; source links are required by old workout history/replay.

- Prisma model: `assignments`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.invitations](schema.md#publicinvitations), [public.schedule_exceptions](schema.md#publicschedule_exceptions), [public.sessions](schema.md#publicsessions).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `relationship_id` | `uuid` | no | — | Historical private coach/athlete pair identity. |
| `coach_id` | `uuid` | no | — | Linked coach identity; scope and target are shown in the foreign keys below. |
| `client_id` | `uuid` | no | — | Linked client identity; scope and target are shown in the foreign keys below. |
| `version_id` | `uuid` | no | — | Immutable published program version identity. |
| `start_date` | `date` | no | `CURRENT_DATE` | Inclusive assignment start date. |
| `state` | `text` | no | `'active'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `schedule_mode` | `text` | no | `'flexible'::text` | Legacy/current assignment scheduling mode; sequence rules are handled explicitly. |
| `end_date` | `date` | yes | — | Optional inclusive assignment end date. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `assignment_dates`: `CHECK (((end_date IS NULL) OR (end_date >= start_date)))`
- `assignments_client_id_fkey`: `FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `assignments_coach_id_fkey`: `FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `assignments_pkey`: `PRIMARY KEY (id)`
- `assignments_relationship_id_fkey`: `FOREIGN KEY (relationship_id) REFERENCES coach_clients(id) ON DELETE CASCADE`
- `assignments_schedule_mode_check`: `CHECK ((schedule_mode = ANY (ARRAY['flexible'::text, 'cycle'::text])))`
- `assignments_state_check`: `CHECK ((state = ANY (ARRAY['active'::text, 'archived'::text])))`
- `assignments_version_id_fkey`: `FOREIGN KEY (version_id) REFERENCES plan_versions(id)`

```sql
CREATE INDEX assignments_client ON public.assignments USING btree (client_id, state);
CREATE UNIQUE INDEX assignments_pkey ON public.assignments USING btree (id);
CREATE UNIQUE INDEX one_active_assignment ON public.assignments USING btree (relationship_id) WHERE (state = 'active'::text);
```

- Policy `assignment_read` (SELECT): USING `((coach_id = identity.actor_id()) OR (client_id = identity.actor_id()))`; CHECK `—`.

</details>

## public.business_accounts

Historical commercial account state retained for own-account export/deletion; no current billing product.

- Prisma model: `business_accounts`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.business_events](schema.md#publicbusiness_events).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `owner_id` | `uuid` | yes | — | Owning account/member identity; see its scoped foreign key. |
| `team_id` | `uuid` | yes | — | Historical team scope; not an additional current institution. |
| `state` | `text` | no | `'trial'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `access_until` | `timestamp with time zone` | no | `(now() + '14 days'::interval)` | Historical commercial access date retained for export only. |
| `staff_limit` | `integer` | no | `10` | Historical commercial staff allowance; not enforced by current institution APIs. |
| `client_limit` | `integer` | no | `50` | Historical commercial athlete allowance; not a current entitlement. |
| `provider_sequence` | `bigint` | no | `0` | Historical provider ordering checkpoint; no new provider mutation endpoint. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `business_accounts_check`: `CHECK (((owner_id IS NULL) <> (team_id IS NULL)))`
- `business_accounts_client_limit_check`: `CHECK (((client_limit >= 1) AND (client_limit <= 100000)))`
- `business_accounts_owner_id_fkey`: `FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `business_accounts_owner_id_key`: `UNIQUE (owner_id)`
- `business_accounts_pkey`: `PRIMARY KEY (id)`
- `business_accounts_staff_limit_check`: `CHECK (((staff_limit >= 1) AND (staff_limit <= 1000)))`
- `business_accounts_state_check`: `CHECK ((state = ANY (ARRAY['trial'::text, 'active'::text, 'past_due'::text, 'cancelled'::text])))`
- `business_accounts_team_id_fkey`: `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE`
- `business_accounts_team_id_key`: `UNIQUE (team_id)`

```sql
CREATE UNIQUE INDEX business_accounts_owner_id_key ON public.business_accounts USING btree (owner_id);
CREATE UNIQUE INDEX business_accounts_pkey ON public.business_accounts USING btree (id);
CREATE UNIQUE INDEX business_accounts_team_id_key ON public.business_accounts USING btree (team_id);
```

- Policy `business_owner` (SELECT): USING `business_access(id)`; CHECK `—`.

</details>

## public.business_events

Historical provider receipt payloads retained for export; provider mutation and simulation are retired.

- Prisma model: `business_events`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `account_id` | `uuid` | no | — | Linked account identity; scope and target are shown in the foreign keys below. |
| `sequence` | `bigint` | no | — | Ordered message/provider event position. |
| `payload` | `jsonb` | no | — | Original operation/provider request payload retained for exact identity/history. |
| `applied` | `boolean` | no | — | Whether a historical provider receipt updated its account at the time. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `business_events_account_id_fkey`: `FOREIGN KEY (account_id) REFERENCES business_accounts(id) ON DELETE CASCADE`
- `business_events_account_id_sequence_key`: `UNIQUE (account_id, sequence)`
- `business_events_pkey`: `PRIMARY KEY (id)`
- `business_events_sequence_check`: `CHECK ((sequence > 0))`

```sql
CREATE UNIQUE INDEX business_events_account_id_sequence_key ON public.business_events USING btree (account_id, sequence);
CREATE UNIQUE INDEX business_events_pkey ON public.business_events USING btree (id);
```

- Policy `events_owner` (SELECT): USING `business_access(account_id)`; CHECK `—`.

</details>

## public.client_context

Historical relationship goals/constraints retained for own-account export.

- Prisma model: `client_context`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `goals` | `text` | no | `''::text` | Historical relationship goals. |
| `constraints` | `text` | no | `''::text` | Historical relationship constraints; private exported context. |
| `notes` | `text` | no | `''::text` | Historical relationship notes retained for own-account export. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `client_context_constraints_check`: `CHECK ((length(constraints) <= 2000))`
- `client_context_goals_check`: `CHECK ((length(goals) <= 2000))`
- `client_context_id_fkey`: `FOREIGN KEY (id) REFERENCES coach_clients(id) ON DELETE CASCADE`
- `client_context_notes_check`: `CHECK ((length(notes) <= 5000))`
- `client_context_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX client_context_pkey ON public.client_context USING btree (id);
```

- Policy `coach_context` (SELECT): USING `(EXISTS ( SELECT 1    FROM coach_clients c   WHERE ((c.id = client_context.id) AND (c.coach_id = identity.actor_id()))))`; CHECK `—`.

</details>

## public.coach_clients

Historical personal coaching relationships and privacy boundaries for owned records.

- Prisma model: `coach_clients`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.appointments](schema.md#publicappointments), [public.assignments](schema.md#publicassignments), [public.client_context](schema.md#publicclient_context), [public.coaching_requests](schema.md#publiccoaching_requests), [public.conversation_reads](schema.md#publicconversation_reads), [public.meal_entries](schema.md#publicmeal_entries), [public.measurements](schema.md#publicmeasurements), [public.messages](schema.md#publicmessages), [public.nutrition_guidance](schema.md#publicnutrition_guidance), [public.resource_shares](schema.md#publicresource_shares), [public.team_clients](schema.md#publicteam_clients).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `coach_id` | `uuid` | no | — | Linked coach identity; scope and target are shown in the foreign keys below. |
| `client_id` | `uuid` | no | — | Linked client identity; scope and target are shown in the foreign keys below. |
| `state` | `text` | no | `'active'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `coach_clients_check`: `CHECK ((coach_id <> client_id))`
- `coach_clients_client_id_fkey`: `FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `coach_clients_coach_id_client_id_key`: `UNIQUE (coach_id, client_id)`
- `coach_clients_coach_id_fkey`: `FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `coach_clients_pkey`: `PRIMARY KEY (id)`
- `coach_clients_state_check`: `CHECK ((state = ANY (ARRAY['active'::text, 'archived'::text])))`

```sql
CREATE UNIQUE INDEX coach_clients_coach_id_client_id_key ON public.coach_clients USING btree (coach_id, client_id);
CREATE UNIQUE INDEX coach_clients_pkey ON public.coach_clients USING btree (id);
```

- Policy `relationship_read` (SELECT): USING `((coach_id = identity.actor_id()) OR (client_id = identity.actor_id()))`; CHECK `—`.

</details>

## public.coaching_forms

Historical coach-authored forms referenced by exported requests.

- Prisma model: `coaching_forms`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.coaching_requests](schema.md#publiccoaching_requests).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `coach_id` | `uuid` | no | — | Linked coach identity; scope and target are shown in the foreign keys below. |
| `title` | `text` | no | — | Human-readable title. |
| `kind` | `text` | no | — | Entity variant; consult SQL constraints and the relevant handler. |
| `fields` | `jsonb` | no | — | Historical form field definitions and units. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `coaching_forms_coach_id_fkey`: `FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `coaching_forms_kind_check`: `CHECK ((kind = ANY (ARRAY['checkin'::text, 'assessment'::text])))`
- `coaching_forms_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX coaching_forms_pkey ON public.coaching_forms USING btree (id);
```

- Policy `forms_owner` (SELECT): USING `(coach_id = identity.actor_id())`; CHECK `—`.

</details>

## public.coaching_requests

Historical form requests, answers and correction state retained for account export.

- Prisma model: `coaching_requests`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.messages](schema.md#publicmessages).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `series_id` | `uuid` | no | — | Linked series identity; scope and target are shown in the foreign keys below. |
| `relationship_id` | `uuid` | no | — | Historical private coach/athlete pair identity. |
| `form_id` | `uuid` | yes | — | Linked form identity; scope and target are shown in the foreign keys below. |
| `form_revision` | `integer` | no | — | Version of the historical form used by this request. |
| `title` | `text` | no | — | Human-readable title. |
| `kind` | `text` | no | — | Entity variant; consult SQL constraints and the relevant handler. |
| `fields` | `jsonb` | no | — | Historical form field definitions and units. |
| `due_date` | `date` | no | — | Historical form/request due date. |
| `answers` | `jsonb` | no | `'{}'::jsonb` | Historical form response values. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `submitted_at` | `timestamp with time zone` | yes | — | Historical response submission timestamp. |
| `reviewed_at` | `timestamp with time zone` | yes | — | Coach review timestamp. |
| `feedback` | `text` | no | `''::text` | Explicit review feedback. |
| `cancelled` | `boolean` | no | `false` | Explicit cancelled request state. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `coaching_requests_form_id_fkey`: `FOREIGN KEY (form_id) REFERENCES coaching_forms(id) ON DELETE SET NULL`
- `coaching_requests_pkey`: `PRIMARY KEY (id)`
- `coaching_requests_relationship_id_fkey`: `FOREIGN KEY (relationship_id) REFERENCES coach_clients(id) ON DELETE CASCADE`
- `coaching_requests_series_id_due_date_key`: `UNIQUE (series_id, due_date)`

```sql
CREATE UNIQUE INDEX coaching_requests_pkey ON public.coaching_requests USING btree (id);
CREATE UNIQUE INDEX coaching_requests_series_id_due_date_key ON public.coaching_requests USING btree (series_id, due_date);
CREATE INDEX requests_relationship_due ON public.coaching_requests USING btree (relationship_id, due_date);
CREATE TRIGGER notification_form AFTER UPDATE ON public.coaching_requests FOR EACH ROW EXECUTE FUNCTION capture_domain_notification();
```

- Policy `requests_participant` (SELECT): USING `(EXISTS ( SELECT 1    FROM coach_clients c   WHERE ((c.id = coaching_requests.relationship_id) AND ((identity.actor_id() = c.coach_id) OR (identity.actor_id() = c.client_id)))))`; CHECK `—`.

</details>

## public.conversation_reads

Historical direct-conversation read cursors retained for export.

- Prisma model: `conversation_reads`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `relationship_id` | `uuid` | no | — | Historical private coach/athlete pair identity. |
| `user_id` | `uuid` | no | — | Global account subject. |
| `last_sequence` | `bigint` | no | `0` | Last acknowledged message sequence. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `conversation_reads_pkey`: `PRIMARY KEY (id)`
- `conversation_reads_relationship_id_fkey`: `FOREIGN KEY (relationship_id) REFERENCES coach_clients(id) ON DELETE CASCADE`
- `conversation_reads_relationship_id_user_id_key`: `UNIQUE (relationship_id, user_id)`
- `conversation_reads_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX conversation_reads_pkey ON public.conversation_reads USING btree (id);
CREATE UNIQUE INDEX conversation_reads_relationship_id_user_id_key ON public.conversation_reads USING btree (relationship_id, user_id);
```

- Policy `reads_owner` (SELECT): USING `(user_id = identity.actor_id())`; CHECK `—`.

</details>

## public.exercises

Canonical/reference exercise metadata and historical personal exercise ownership.

- Prisma model: `exercises`; domain: Reference library; treatment: **retain-reference**.
- Direct server source references: [server/programming.ts](../../../apps/backend/server/programming.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT true; user SELECT true; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `text` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `name` | `text` | no | — | Display name for this entity. |
| `name_ar` | `text` | no | — | Arabic display name. |
| `equipment` | `text` | no | — | Exercise equipment classification. |
| `equipment_ar` | `text` | no | — | Arabic equipment label. |
| `instructions` | `text` | no | — | Exercise instructions. |
| `instructions_ar` | `text` | no | — | Arabic exercise instructions. |
| `movement` | `text` | no | — | Exercise movement classification. |
| `active` | `boolean` | no | `true` | Current enabled membership/record state; historical records are retained. |
| `owner_id` | `uuid` | yes | — | Owning account/member identity; see its scoped foreign key. |
| `kind` | `text` | no | `'strength'::text` | Entity variant; consult SQL constraints and the relevant handler. |
| `media_url` | `text` | no | `''::text` | Historical reviewed media URL. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `media_ref` | `text` | yes | — | Pinned reference-media identity. |
| `category` | `text` | yes | — | Exercise/notification classification. |
| `body_part` | `text` | yes | — | Exercise body-region metadata. |
| `target_muscle` | `text` | yes | — | Exercise target-muscle metadata. |
| `source_ref` | `text` | yes | — | Pinned external/reference source key. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `exercises_kind_check`: `CHECK ((kind = ANY (ARRAY['strength'::text, 'timed'::text, 'distance'::text])))`
- `exercises_owner_id_fkey`: `FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `exercises_pkey`: `PRIMARY KEY (id)`

```sql
CREATE INDEX exercises_owner ON public.exercises USING btree (owner_id);
CREATE UNIQUE INDEX exercises_pkey ON public.exercises USING btree (id);
```

- Policy `api_shared_catalog` (SELECT): USING `(owner_id IS NULL)`; CHECK `—`.
- Policy `own_catalog` (SELECT): USING `(owner_id = identity.actor_id())`; CHECK `—`.
- Policy `shared_catalog` (SELECT): USING `((owner_id IS NULL) AND active)`; CHECK `—`.

</details>

## public.instance_branding

One installation branding configuration: name, colors, logo metadata and revision.

- Prisma model: `instance_branding`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT false; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `boolean` | no | `true` | Stable record identity; singleton tables constrain this to the one installation row. |
| `owner_id` | `uuid` | yes | — | Owning account/member identity; see its scoped foreign key. |
| `name` | `text` | no | `'Rafik'::text` | Display name for this entity. |
| `accent` | `text` | no | `'#285943'::text` | Configured installation accent color. |
| `background_light` | `text` | no | `'#f8f8f3'::text` | Configured light surface/background color. |
| `background_dark` | `text` | no | `'#171e1a'::text` | Configured dark surface/background color. |
| `logo` | `bytea` | yes | — | Validated installation logo bytes. |
| `logo_mime` | `text` | yes | — | Validated logo MIME type. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `instance_branding_accent_check`: `CHECK ((accent ~ '^#[0-9a-f]{6}$'::text))`
- `instance_branding_background_dark_check`: `CHECK ((background_dark ~ '^#[0-9a-f]{6}$'::text))`
- `instance_branding_background_light_check`: `CHECK ((background_light ~ '^#[0-9a-f]{6}$'::text))`
- `instance_branding_check`: `CHECK (((logo IS NULL) = (logo_mime IS NULL)))`
- `instance_branding_id_check`: `CHECK (id)`
- `instance_branding_logo_check`: `CHECK (((logo IS NULL) OR (octet_length(logo) <= 524288)))`
- `instance_branding_logo_mime_check`: `CHECK ((logo_mime = ANY (ARRAY['image/png'::text, 'image/jpeg'::text, 'image/webp'::text])))`
- `instance_branding_name_check`: `CHECK (((length(name) >= 1) AND (length(name) <= 60)))`
- `instance_branding_owner_id_fkey`: `FOREIGN KEY (owner_id) REFERENCES identity.users(id) ON DELETE SET NULL`
- `instance_branding_owner_id_key`: `UNIQUE (owner_id)`
- `instance_branding_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX instance_branding_owner_id_key ON public.instance_branding USING btree (owner_id);
CREATE UNIQUE INDEX instance_branding_pkey ON public.instance_branding USING btree (id);
```


</details>

## public.institution_assets

Institution file ownership, scope/purpose, channel boundary and byte lifecycle.

- Prisma model: `institution_assets`; domain: Files and media; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/assets.ts](../../../apps/backend/server/assets.ts), [server/communication.ts](../../../apps/backend/server/communication.ts).
- Referenced by: [public.institution_message_assets](schema.md#publicinstitution_message_assets), [public.institution_messages](schema.md#publicinstitution_messages).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `owner_id` | `uuid` | no | — | Owning account/member identity; see its scoped foreign key. |
| `purpose` | `text` | no | — | File-use boundary (message/resource/exercise), not unrestricted sharing. |
| `channel_id` | `uuid` | yes | — | Linked channel identity; scope and target are shown in the foreign keys below. |
| `filename` | `text` | no | — | Original display filename; never an unchecked storage path. |
| `media_type` | `text` | no | — | Validated file MIME type. |
| `bytes` | `integer` | no | — | Declared stored file size in bytes. |
| `digest` | `text` | no | — | Pinned byte/content digest. |
| `retired` | `boolean` | no | `false` | File retirement flag; cleanup follows reference/grace rules. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_assets_bytes_check`: `CHECK (((bytes >= 1) AND (bytes <= 26214400)))`
- `institution_assets_check`: `CHECK (((purpose = 'message'::text) = (channel_id IS NOT NULL)))`
- `institution_assets_digest_check`: `CHECK ((digest ~ '^[a-f0-9]{64}$'::text))`
- `institution_assets_filename_check`: `CHECK (((length(filename) >= 1) AND (length(filename) <= 180)))`
- `institution_assets_institution_id_channel_id_fkey`: `FOREIGN KEY (institution_id, channel_id) REFERENCES institution_channels(institution_id, id) ON DELETE CASCADE`
- `institution_assets_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_assets_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_assets_institution_id_owner_id_fkey`: `FOREIGN KEY (institution_id, owner_id) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_assets_media_type_check`: `CHECK ((media_type = ANY (ARRAY['image/jpeg'::text, 'image/png'::text, 'image/webp'::text, 'image/gif'::text, 'video/mp4'::text, 'application/pdf'::text])))`
- `institution_assets_pkey`: `PRIMARY KEY (id)`
- `institution_assets_purpose_check`: `CHECK ((purpose = ANY (ARRAY['exercise'::text, 'message'::text])))`
- `institution_assets_revision_check`: `CHECK ((revision > 0))`

```sql
CREATE UNIQUE INDEX institution_assets_institution_id_id_key ON public.institution_assets USING btree (institution_id, id);
CREATE INDEX institution_assets_owner ON public.institution_assets USING btree (institution_id, owner_id, created_at DESC, id);
CREATE UNIQUE INDEX institution_assets_pkey ON public.institution_assets USING btree (id);
```


</details>

## public.institution_assignments

Athlete assignment to an immutable program version, date range, goal/sport and independent sequence cursor.

- Prisma model: `institution_assignments`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/analytics.ts](../../../apps/backend/server/analytics.ts), [server/assets.ts](../../../apps/backend/server/assets.ts), [server/athlete-plans.ts](../../../apps/backend/server/athlete-plans.ts), [server/follow-up.ts](../../../apps/backend/server/follow-up.ts), [server/people.ts](../../../apps/backend/server/people.ts), [server/program-media.ts](../../../apps/backend/server/program-media.ts), [server/programming.ts](../../../apps/backend/server/programming.ts), [server/workout-sequence.ts](../../../apps/backend/server/workout-sequence.ts).
- Referenced by: [public.institution_sessions](schema.md#publicinstitution_sessions), [public.institution_workout_positions](schema.md#publicinstitution_workout_positions), [public.institution_workout_recurrences](schema.md#publicinstitution_workout_recurrences).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `version_id` | `uuid` | no | — | Immutable published program version identity. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `start_date` | `date` | no | — | Inclusive assignment start date. |
| `end_date` | `date` | yes | — | Optional inclusive assignment end date. |
| `schedule_mode` | `text` | no | — | Legacy/current assignment scheduling mode; sequence rules are handled explicitly. |
| `state` | `text` | no | `'active'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `goal` | `text` | yes | — | Explicit goal label for concurrent assignments. |
| `sport_id` | `uuid` | yes | — | Linked sport identity; scope and target are shown in the foreign keys below. |
| `sequence_cursor` | `integer` | no | `0` | Next zero-based independent assignment position; booking does not consume it. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_assignments_check`: `CHECK (((end_date IS NULL) OR (end_date >= start_date)))`
- `institution_assignments_goal_check`: `CHECK (((goal IS NULL) OR (((char_length(goal) >= 1) AND (char_length(goal) <= 80)) AND (goal = btrim(goal)))))`
- `institution_assignments_institution_id_created_by_fkey`: `FOREIGN KEY (institution_id, created_by) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_assignments_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED`
- `institution_assignments_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_assignments_institution_id_member_id_fkey`: `FOREIGN KEY (institution_id, member_id) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_assignments_institution_id_version_id_fkey`: `FOREIGN KEY (institution_id, version_id) REFERENCES institution_versions(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_assignments_pkey`: `PRIMARY KEY (id)`
- `institution_assignments_schedule_mode_check`: `CHECK ((schedule_mode = ANY (ARRAY['flexible'::text, 'cycle'::text])))`
- `institution_assignments_sequence_cursor_check`: `CHECK ((sequence_cursor >= 0))`
- `institution_assignments_sport`: `FOREIGN KEY (institution_id, sport_id) REFERENCES institution_sports(institution_id, id)`
- `institution_assignments_state_check`: `CHECK ((state = ANY (ARRAY['active'::text, 'archived'::text])))`

```sql
CREATE INDEX institution_assignments_active_member ON public.institution_assignments USING btree (institution_id, member_id) WHERE (state = 'active'::text);
CREATE UNIQUE INDEX institution_assignments_institution_id_id_key ON public.institution_assignments USING btree (institution_id, id);
CREATE UNIQUE INDEX institution_assignments_pkey ON public.institution_assignments USING btree (id);
CREATE UNIQUE INDEX institution_one_active_version ON public.institution_assignments USING btree (institution_id, member_id, version_id) WHERE (state = 'active'::text);
```


</details>

## public.institution_audit_events

Institution-scoped attributed audit events for supported commands.

- Prisma model: `institution_audit_events`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/auth.ts](../../../apps/backend/server/auth.ts), [server/calendar.ts](../../../apps/backend/server/calendar.ts), [server/institution.ts](../../../apps/backend/server/institution.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `actor_id` | `uuid` | yes | — | Account actor responsible for this command/audit. |
| `kind` | `text` | no | — | Entity variant; consult SQL constraints and the relevant handler. |
| `subject_id` | `uuid` | yes | — | Linked subject identity; scope and target are shown in the foreign keys below. |
| `detail` | `jsonb` | no | `'{}'::jsonb` | Support details or attributed audit detail, depending on this table. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_audit_events_actor_id_fkey`: `FOREIGN KEY (actor_id) REFERENCES identity.users(id) ON DELETE SET NULL`
- `institution_audit_events_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_audit_events_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX institution_audit_events_pkey ON public.institution_audit_events USING btree (id);
CREATE INDEX institution_audit_events_recent ON public.institution_audit_events USING btree (institution_id, created_at DESC, id);
```


</details>

## public.institution_channel_members

Private/group channel authority and membership snapshots.

- Prisma model: `institution_channel_members`; domain: Communication and feedback; treatment: **retain-current**.
- Direct server source references: [server/communication.ts](../../../apps/backend/server/communication.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `channel_id` | `uuid` | no | — | Linked channel identity; scope and target are shown in the foreign keys below. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `manager` | `boolean` | no | `false` | Historical team management flag. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_channel_members_channel_id_institution_id_fkey`: `FOREIGN KEY (channel_id, institution_id) REFERENCES institution_channels(id, institution_id) ON DELETE CASCADE`
- `institution_channel_members_member_id_institution_id_fkey`: `FOREIGN KEY (member_id, institution_id) REFERENCES institution_members(id, institution_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED`
- `institution_channel_members_pkey`: `PRIMARY KEY (channel_id, member_id)`

```sql
CREATE INDEX channel_members_person ON public.institution_channel_members USING btree (member_id, channel_id);
CREATE UNIQUE INDEX institution_channel_members_pkey ON public.institution_channel_members USING btree (channel_id, member_id);
```


</details>

## public.institution_channel_reads

Per-member message read position.

- Prisma model: `institution_channel_reads`; domain: Communication and feedback; treatment: **retain-current**.
- Direct server source references: [server/communication.ts](../../../apps/backend/server/communication.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `channel_id` | `uuid` | no | — | Linked channel identity; scope and target are shown in the foreign keys below. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `sequence` | `bigint` | no | `0` | Ordered message/provider event position. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_channel_reads_channel_id_institution_id_fkey`: `FOREIGN KEY (channel_id, institution_id) REFERENCES institution_channels(id, institution_id) ON DELETE CASCADE`
- `institution_channel_reads_member_id_institution_id_fkey`: `FOREIGN KEY (member_id, institution_id) REFERENCES institution_members(id, institution_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED`
- `institution_channel_reads_pkey`: `PRIMARY KEY (channel_id, member_id)`

```sql
CREATE UNIQUE INDEX institution_channel_reads_pkey ON public.institution_channel_reads USING btree (channel_id, member_id);
```


</details>

## public.institution_channels

Institution direct-pair/group conversation identity with distinct access rules.

- Prisma model: `institution_channels`; domain: Communication and feedback; treatment: **retain-current**.
- Direct server source references: [server/assets.ts](../../../apps/backend/server/assets.ts), [server/communication.ts](../../../apps/backend/server/communication.ts).
- Referenced by: [public.institution_assets](schema.md#publicinstitution_assets), [public.institution_channel_members](schema.md#publicinstitution_channel_members), [public.institution_channel_reads](schema.md#publicinstitution_channel_reads), [public.institution_messages](schema.md#publicinstitution_messages).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `title` | `text` | no | — | Human-readable title. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `archived` | `boolean` | no | `false` | Archived identity/draft flag; archival is not data deletion. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `private_pair` | `boolean` | no | `false` | Frozen direct-channel participant identities. |
| `private_pair_key` | `text` | yes | — | Canonical pair key preventing duplicate direct conversations. |
| `conversation_group_id` | `uuid` | yes | — | Linked conversation group identity; scope and target are shown in the foreign keys below. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_channels_created_by_institution_id_fkey`: `FOREIGN KEY (created_by, institution_id) REFERENCES institution_members(id, institution_id) DEFERRABLE INITIALLY DEFERRED`
- `institution_channels_group_fk`: `FOREIGN KEY (institution_id, conversation_group_id) REFERENCES institution_groups(institution_id, id) ON DELETE CASCADE`
- `institution_channels_id_institution_id_key`: `UNIQUE (id, institution_id)`
- `institution_channels_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_channels_pkey`: `PRIMARY KEY (id)`
- `institution_channels_title_check`: `CHECK (((length(title) >= 1) AND (length(title) <= 100)))`

```sql
CREATE UNIQUE INDEX institution_channels_id_institution_id_key ON public.institution_channels USING btree (id, institution_id);
CREATE UNIQUE INDEX institution_channels_pkey ON public.institution_channels USING btree (id);
CREATE UNIQUE INDEX institution_group_conversation_unique ON public.institution_channels USING btree (institution_id, conversation_group_id);
CREATE UNIQUE INDEX institution_private_pair_unique ON public.institution_channels USING btree (institution_id, private_pair_key);
```


</details>

## public.institution_coaching_links

Primary/supporting coach relationships with sport scope and attribution/history.

- Prisma model: `institution_coaching_links`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/assets.ts](../../../apps/backend/server/assets.ts), [server/coaching-links.ts](../../../apps/backend/server/coaching-links.ts), [server/people.ts](../../../apps/backend/server/people.ts), [server/program-media.ts](../../../apps/backend/server/program-media.ts), [server/programming.ts](../../../apps/backend/server/programming.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `athlete_member_id` | `uuid` | no | — | Athlete membership subject. |
| `coach_member_id` | `uuid` | no | — | Coach membership with explicit relationship scope. |
| `kind` | `text` | no | — | Entity variant; consult SQL constraints and the relevant handler. |
| `sport_id` | `uuid` | yes | — | Linked sport identity; scope and target are shown in the foreign keys below. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `ended_by` | `uuid` | yes | — | Actor ending the link. |
| `ended_at` | `timestamp with time zone` | yes | — | Coaching-link end time; history remains. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_coaching_links_check`: `CHECK ((athlete_member_id <> coach_member_id))`
- `institution_coaching_links_check1`: `CHECK (((kind = 'primary'::text) = (sport_id IS NULL)))`
- `institution_coaching_links_check2`: `CHECK (((ended_by IS NULL) OR (ended_at IS NOT NULL)))`
- `institution_coaching_links_institution_id_athlete_member_id_fke`: `FOREIGN KEY (institution_id, athlete_member_id) REFERENCES institution_members(institution_id, id) ON DELETE CASCADE`
- `institution_coaching_links_institution_id_coach_member_id_fkey`: `FOREIGN KEY (institution_id, coach_member_id) REFERENCES institution_members(institution_id, id) ON DELETE CASCADE`
- `institution_coaching_links_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_coaching_links_institution_id_sport_id_fkey`: `FOREIGN KEY (institution_id, sport_id) REFERENCES institution_sports(institution_id, id)`
- `institution_coaching_links_kind_check`: `CHECK ((kind = ANY (ARRAY['primary'::text, 'supporting'::text])))`
- `institution_coaching_links_pkey`: `PRIMARY KEY (id)`

```sql
CREATE INDEX institution_coaching_coach ON public.institution_coaching_links USING btree (institution_id, coach_member_id) WHERE (ended_at IS NULL);
CREATE UNIQUE INDEX institution_coaching_links_institution_id_id_key ON public.institution_coaching_links USING btree (institution_id, id);
CREATE UNIQUE INDEX institution_coaching_links_pkey ON public.institution_coaching_links USING btree (id);
CREATE UNIQUE INDEX institution_coaching_one_active_pair ON public.institution_coaching_links USING btree (institution_id, athlete_member_id, coach_member_id) WHERE (ended_at IS NULL);
CREATE UNIQUE INDEX institution_coaching_one_primary ON public.institution_coaching_links USING btree (institution_id, athlete_member_id) WHERE ((kind = 'primary'::text) AND (ended_at IS NULL));
```


</details>

## public.institution_event_people

Frozen event roster, staff/athlete duty, attendance and participant revision.

- Prisma model: `institution_event_people`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/analytics.ts](../../../apps/backend/server/analytics.ts), [server/calendar.ts](../../../apps/backend/server/calendar.ts), [server/experience-report.ts](../../../apps/backend/server/experience-report.ts), [server/feedback.ts](../../../apps/backend/server/feedback.ts), [server/follow-up.ts](../../../apps/backend/server/follow-up.ts), [server/people.ts](../../../apps/backend/server/people.ts), [server/workout-sequence.ts](../../../apps/backend/server/workout-sequence.ts).
- Referenced by: [public.assessment_results](schema.md#publicassessment_results), [public.institution_event_people](schema.md#publicinstitution_event_people), [public.institution_session_feedback](schema.md#publicinstitution_session_feedback), [public.institution_sessions](schema.md#publicinstitution_sessions).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `event_id` | `uuid` | no | — | Linked event identity; scope and target are shown in the foreign keys below. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `duty` | `text` | no | — | Event roster role: staff or athlete (trainee compatibility value). |
| `attendance` | `text` | no | `'unmarked'::text` | Participant attendance; absence/unmarked is not workout completion. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `makeup_for` | `uuid` | yes | — | Explicit participant makeup link; no commercial allowance accounting. |
| `session_note` | `text` | no | `''::text` | Participant event note, separate from score values. |
| `checked_in_at` | `timestamp with time zone` | yes | — | Participant check-in timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_event_makeup`: `FOREIGN KEY (makeup_for, member_id) REFERENCES institution_event_people(event_id, member_id) DEFERRABLE INITIALLY DEFERRED`
- `institution_event_makeup_not_self`: `CHECK (((makeup_for IS NULL) OR (makeup_for <> event_id)))`
- `institution_event_people_attendance_check`: `CHECK ((attendance = ANY (ARRAY['unmarked'::text, 'present'::text, 'absent'::text, 'excused'::text])))`
- `institution_event_people_duty_check`: `CHECK ((duty = ANY (ARRAY['staff'::text, 'trainee'::text])))`
- `institution_event_people_institution_id_event_id_fkey`: `FOREIGN KEY (institution_id, event_id) REFERENCES institution_events(institution_id, id) ON DELETE CASCADE`
- `institution_event_people_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_event_people_institution_id_member_id_fkey`: `FOREIGN KEY (institution_id, member_id) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_event_people_pkey`: `PRIMARY KEY (event_id, member_id)`
- `institution_event_people_session_note_check`: `CHECK ((length(session_note) <= 2000))`
- `institution_event_subject`: `UNIQUE (institution_id, member_id, event_id)`

```sql
CREATE UNIQUE INDEX institution_event_people_pkey ON public.institution_event_people USING btree (event_id, member_id);
CREATE UNIQUE INDEX institution_event_subject ON public.institution_event_people USING btree (institution_id, member_id, event_id);
CREATE INDEX institution_person_agenda ON public.institution_event_people USING btree (institution_id, member_id, event_id);
CREATE TRIGGER notification_org_person AFTER INSERT ON public.institution_event_people FOR EACH ROW EXECUTE FUNCTION capture_domain_notification();
```


</details>

## public.institution_events

Timed training/assessment occurrences, timezone/date, source snapshot and lifecycle.

- Prisma model: `institution_events`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/analytics.ts](../../../apps/backend/server/analytics.ts), [server/calendar.ts](../../../apps/backend/server/calendar.ts), [server/experience-report.ts](../../../apps/backend/server/experience-report.ts), [server/feedback.ts](../../../apps/backend/server/feedback.ts), [server/follow-up.ts](../../../apps/backend/server/follow-up.ts), [server/notifications.ts](../../../apps/backend/server/notifications.ts), [server/workout-sequence.ts](../../../apps/backend/server/workout-sequence.ts).
- Referenced by: [public.assessment_results](schema.md#publicassessment_results), [public.institution_event_people](schema.md#publicinstitution_event_people), [public.institution_workout_positions](schema.md#publicinstitution_workout_positions).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `series_id` | `uuid` | no | — | Linked series identity; scope and target are shown in the foreign keys below. |
| `title` | `text` | no | — | Human-readable title. |
| `starts_at` | `timestamp with time zone` | no | — | Fixed occurrence/booking start instant. |
| `ends_at` | `timestamp with time zone` | no | — | Fixed occurrence/booking end instant. |
| `timezone` | `text` | no | — | IANA timezone used for date/clock interpretation. |
| `location` | `text` | no | `''::text` | Human-readable occurrence location. |
| `kind` | `text` | no | — | Entity variant; consult SQL constraints and the relevant handler. |
| `definition` | `jsonb` | yes | — | Assessment definition, result types, units and bounds; occurrences keep their own snapshot. |
| `template_id` | `uuid` | yes | — | Linked template identity; scope and target are shown in the foreign keys below. |
| `template_revision` | `integer` | yes | — | Frozen assessment-template revision used by this occurrence. |
| `state` | `text` | no | `'scheduled'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `training_date` | `date` | no | `CURRENT_DATE` | Event-local calendar date derived from timestamp and timezone. |
| `workout_snapshot` | `jsonb` | yes | — | Shared workout baseline and sequence source for a training occurrence. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_event_workout_kind`: `CHECK (((workout_snapshot IS NULL) OR ((kind = 'training'::text) AND (jsonb_typeof(workout_snapshot) = 'object'::text))))`
- `institution_events_check`: `CHECK (((ends_at > starts_at) AND (ends_at <= (starts_at + '08:00:00'::interval))))`
- `institution_events_check1`: `CHECK (((kind = 'assessment'::text) = (definition IS NOT NULL)))`
- `institution_events_institution_id_created_by_fkey`: `FOREIGN KEY (institution_id, created_by) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_events_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_events_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_events_institution_id_template_id_fkey`: `FOREIGN KEY (institution_id, template_id) REFERENCES assessment_templates(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_events_kind_check`: `CHECK ((kind = ANY (ARRAY['training'::text, 'assessment'::text])))`
- `institution_events_pkey`: `PRIMARY KEY (id)`
- `institution_events_state_check`: `CHECK ((state = ANY (ARRAY['scheduled'::text, 'cancelled'::text, 'completed'::text])))`
- `institution_events_title_check`: `CHECK (((char_length(title) >= 1) AND (char_length(title) <= 100)))`

```sql
CREATE INDEX institution_event_agenda ON public.institution_events USING btree (institution_id, starts_at, id);
CREATE INDEX institution_event_series ON public.institution_events USING btree (institution_id, series_id, starts_at);
CREATE UNIQUE INDEX institution_events_institution_id_id_key ON public.institution_events USING btree (institution_id, id);
CREATE UNIQUE INDEX institution_events_pkey ON public.institution_events USING btree (id);
CREATE TRIGGER institution_event_training_date BEFORE INSERT OR UPDATE ON public.institution_events FOR EACH ROW EXECUTE FUNCTION set_event_training_date();
CREATE TRIGGER notification_org_event AFTER UPDATE ON public.institution_events FOR EACH ROW EXECUTE FUNCTION capture_domain_notification();
```


</details>

## public.institution_exercises

Institution-authored exercise metadata and visibility to authorized staff.

- Prisma model: `institution_exercises`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/assets.ts](../../../apps/backend/server/assets.ts), [server/programming.ts](../../../apps/backend/server/programming.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `id` | `text` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `data` | `jsonb` | no | — | Institution exercise metadata snapshot. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `active` | `boolean` | no | `true` | Current enabled membership/record state; historical records are retained. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_exercises_data_check`: `CHECK ((jsonb_typeof(data) = 'object'::text))`
- `institution_exercises_institution_id_created_by_fkey`: `FOREIGN KEY (institution_id, created_by) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_exercises_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED`
- `institution_exercises_pkey`: `PRIMARY KEY (institution_id, id)`

```sql
CREATE UNIQUE INDEX institution_exercises_pkey ON public.institution_exercises USING btree (institution_id, id);
```


</details>

## public.institution_group_members

Current institution group membership; does not rewrite historical event rosters.

- Prisma model: `institution_group_members`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/service-catalog.ts](../../../apps/backend/server/service-catalog.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `group_id` | `uuid` | no | — | Linked group identity; scope and target are shown in the foreign keys below. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_group_members_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_group_members_institution_id_group_id_fkey`: `FOREIGN KEY (institution_id, group_id) REFERENCES institution_groups(institution_id, id) ON DELETE CASCADE`
- `institution_group_members_institution_id_member_id_fkey`: `FOREIGN KEY (institution_id, member_id) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_group_members_pkey`: `PRIMARY KEY (group_id, member_id)`

```sql
CREATE UNIQUE INDEX institution_group_members_pkey ON public.institution_group_members USING btree (group_id, member_id);
```


</details>

## public.institution_groups

Institution groups used to select participants and coaches.

- Prisma model: `institution_groups`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/communication.ts](../../../apps/backend/server/communication.ts), [server/service-catalog.ts](../../../apps/backend/server/service-catalog.ts).
- Referenced by: [public.institution_channels](schema.md#publicinstitution_channels), [public.institution_group_members](schema.md#publicinstitution_group_members).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `name` | `text` | no | — | Display name for this entity. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `archived` | `boolean` | no | `false` | Archived identity/draft flag; archival is not data deletion. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_groups_institution_id_created_by_fkey`: `FOREIGN KEY (institution_id, created_by) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_groups_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_groups_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_groups_name_check`: `CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100)))`
- `institution_groups_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX institution_groups_institution_id_id_key ON public.institution_groups USING btree (institution_id, id);
CREATE UNIQUE INDEX institution_groups_pkey ON public.institution_groups USING btree (id);
```


</details>

## public.institution_injury_access_log

Audited permitted participation-status access/actions.

- Prisma model: `institution_injury_access_log`; domain: Health and privacy; treatment: **retain-current**.
- Direct server source references: [server/injuries.ts](../../../apps/backend/server/injuries.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `record_id` | `uuid` | no | — | Linked record identity; scope and target are shown in the foreign keys below. |
| `athlete_member_id` | `uuid` | no | — | Athlete membership subject. |
| `actor_id` | `uuid` | no | — | Account actor responsible for this command/audit. |
| `action` | `text` | no | — | Attributed operation/history action. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_injury_access_lo_institution_id_athlete_member__fke`: `FOREIGN KEY (institution_id, athlete_member_id) REFERENCES institution_members(institution_id, id) ON DELETE CASCADE`
- `institution_injury_access_log_action_check`: `CHECK ((action = ANY (ARRAY['athlete_detail_read'::text, 'athlete_export'::text, 'coach_status_read'::text, 'reported'::text, 'corrected'::text, 'closed'::text, 'withdrawn'::text, 'consent_changed'::text, 'consent_withdrawn'::text])))`
- `institution_injury_access_log_institution_id_record_id_fkey`: `FOREIGN KEY (institution_id, record_id) REFERENCES institution_injury_records(institution_id, id) ON DELETE CASCADE`
- `institution_injury_access_log_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX institution_injury_access_log_pkey ON public.institution_injury_access_log USING btree (id);
CREATE INDEX institution_injury_access_recent ON public.institution_injury_access_log USING btree (institution_id, athlete_member_id, created_at DESC);
```


</details>

## public.institution_injury_history

Attributed historical versions of participation restrictions.

- Prisma model: `institution_injury_history`; domain: Health and privacy; treatment: **retain-current**.
- Direct server source references: [server/injuries.ts](../../../apps/backend/server/injuries.ts), [server/injury-retention.ts](../../../apps/backend/server/injury-retention.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `record_id` | `uuid` | no | — | Linked record identity; scope and target are shown in the foreign keys below. |
| `revision` | `integer` | no | — | Optimistic record revision checked before edits. |
| `action` | `text` | no | — | Attributed operation/history action. |
| `participation` | `text` | no | — | Explicit non-diagnostic modified/unavailable participation status. |
| `effective_from` | `date` | no | — | Date from which a participation status applies. |
| `recorded_by` | `uuid` | yes | — | Attributed recorder identity. |
| `recorded_at` | `timestamp with time zone` | no | `now()` | Recorded result/history timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_injury_history_action_check`: `CHECK ((action = ANY (ARRAY['reported'::text, 'corrected'::text, 'closed'::text, 'withdrawn'::text])))`
- `institution_injury_history_institution_id_record_id_fkey`: `FOREIGN KEY (institution_id, record_id) REFERENCES institution_injury_records(institution_id, id) ON DELETE CASCADE`
- `institution_injury_history_participation_check`: `CHECK ((participation = ANY (ARRAY['modified'::text, 'unavailable'::text])))`
- `institution_injury_history_pkey`: `PRIMARY KEY (id)`
- `institution_injury_history_record_id_revision_key`: `UNIQUE (record_id, revision)`
- `institution_injury_history_revision_check`: `CHECK ((revision > 0))`

```sql
CREATE UNIQUE INDEX institution_injury_history_pkey ON public.institution_injury_history USING btree (id);
CREATE UNIQUE INDEX institution_injury_history_record_id_revision_key ON public.institution_injury_history USING btree (record_id, revision);
```


</details>

## public.institution_injury_operations

Hash-only exact health-write acknowledgments; sensitive request content is not copied into receipts.

- Prisma model: `institution_injury_operations`; domain: Health and privacy; treatment: **retain-current**.
- Direct server source references: [server/injuries.ts](../../../apps/backend/server/injuries.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `operation_id` | `uuid` | no | — | Original durable command identity; retries keep this value. |
| `actor_id` | `uuid` | no | — | Account actor responsible for this command/audit. |
| `request_hash` | `text` | no | — | Digest of the exact sensitive request; not its cleartext contents. |
| `record_id` | `uuid` | no | — | Linked record identity; scope and target are shown in the foreign keys below. |
| `result_revision` | `integer` | no | — | Acknowledged result revision. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_injury_operations_institution_id_record_id_fkey`: `FOREIGN KEY (institution_id, record_id) REFERENCES institution_injury_records(institution_id, id) ON DELETE CASCADE`
- `institution_injury_operations_pkey`: `PRIMARY KEY (institution_id, operation_id)`
- `institution_injury_operations_request_hash_check`: `CHECK ((length(request_hash) = 64))`

```sql
CREATE UNIQUE INDEX institution_injury_operations_pkey ON public.institution_injury_operations USING btree (institution_id, operation_id);
```


</details>

## public.institution_injury_permissions

Product consent/assent prerequisites and withdrawal checkpoints for participation-status sharing.

- Prisma model: `institution_injury_permissions`; domain: Health and privacy; treatment: **retain-current**.
- Direct server source references: [server/injuries.ts](../../../apps/backend/server/injuries.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `athlete_member_id` | `uuid` | no | — | Athlete membership subject. |
| `age_group` | `text` | no | — | Product consent category: adult or minor. |
| `guardian_authorized` | `boolean` | no | `false` | Whether the product guardian prerequisite is acknowledged. |
| `guardian_verified_by` | `uuid` | yes | — | Account that recorded guardian prerequisite verification. |
| `guardian_verified_at` | `timestamp with time zone` | yes | — | Recorded guardian prerequisite verification time. |
| `athlete_assented_at` | `timestamp with time zone` | yes | — | Athlete assent timestamp. |
| `assent_policy_version` | `text` | yes | — | Acknowledged product assent policy version. |
| `withdrawn_at` | `timestamp with time zone` | yes | — | Consent withdrawal time. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `configured_at` | `timestamp with time zone` | no | `now()` | Configuration timestamp. |
| `configured_by` | `uuid` | no | — | Attributed configuration account. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_injury_permissio_institution_id_athlete_member__fke`: `FOREIGN KEY (institution_id, athlete_member_id) REFERENCES institution_members(institution_id, id) ON DELETE CASCADE`
- `institution_injury_permissions_age_group_check`: `CHECK ((age_group = ANY (ARRAY['adult'::text, 'minor'::text])))`
- `institution_injury_permissions_check`: `CHECK ((((age_group = 'minor'::text) AND guardian_authorized AND (guardian_verified_by IS NOT NULL) AND (guardian_verified_at IS NOT NULL)) OR ((age_group = 'adult'::text) AND (NOT guardian_authorized) AND (guardian_verified_by IS NULL) AND (guardian_verified_at IS NULL))))`
- `institution_injury_permissions_pkey`: `PRIMARY KEY (institution_id, athlete_member_id)`
- `institution_injury_permissions_revision_check`: `CHECK ((revision > 0))`

```sql
CREATE UNIQUE INDEX institution_injury_permissions_pkey ON public.institution_injury_permissions USING btree (institution_id, athlete_member_id);
```


</details>

## public.institution_injury_records

Athlete-authored non-diagnostic participation restrictions; not general administrator-visible medical records.

- Prisma model: `institution_injury_records`; domain: Health and privacy; treatment: **retain-current**.
- Direct server source references: [server/injuries.ts](../../../apps/backend/server/injuries.ts), [server/injury-retention.ts](../../../apps/backend/server/injury-retention.ts), [server/workout-sequence.ts](../../../apps/backend/server/workout-sequence.ts).
- Referenced by: [public.institution_injury_access_log](schema.md#publicinstitution_injury_access_log), [public.institution_injury_history](schema.md#publicinstitution_injury_history), [public.institution_injury_operations](schema.md#publicinstitution_injury_operations).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `athlete_member_id` | `uuid` | no | — | Athlete membership subject. |
| `participation` | `text` | no | — | Explicit non-diagnostic modified/unavailable participation status. |
| `effective_from` | `date` | no | — | Date from which a participation status applies. |
| `state` | `text` | no | `'active'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |
| `closed_at` | `timestamp with time zone` | yes | — | Participation record closure time used by retention. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_injury_records_check`: `CHECK (((state = 'closed'::text) = (closed_at IS NOT NULL)))`
- `institution_injury_records_institution_id_athlete_member_id_fke`: `FOREIGN KEY (institution_id, athlete_member_id) REFERENCES institution_members(institution_id, id) ON DELETE CASCADE`
- `institution_injury_records_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_injury_records_participation_check`: `CHECK ((participation = ANY (ARRAY['modified'::text, 'unavailable'::text])))`
- `institution_injury_records_pkey`: `PRIMARY KEY (id)`
- `institution_injury_records_revision_check`: `CHECK ((revision > 0))`
- `institution_injury_records_state_check`: `CHECK ((state = ANY (ARRAY['active'::text, 'closed'::text])))`

```sql
CREATE INDEX institution_injury_athlete_history ON public.institution_injury_records USING btree (institution_id, athlete_member_id, created_at DESC, id);
CREATE INDEX institution_injury_expiry ON public.institution_injury_records USING btree (closed_at, id) WHERE (state = 'closed'::text);
CREATE UNIQUE INDEX institution_injury_one_active ON public.institution_injury_records USING btree (institution_id, athlete_member_id) WHERE (state = 'active'::text);
CREATE UNIQUE INDEX institution_injury_records_institution_id_id_key ON public.institution_injury_records USING btree (institution_id, id);
CREATE UNIQUE INDEX institution_injury_records_pkey ON public.institution_injury_records USING btree (id);
```


</details>

## public.institution_injury_retention_checkpoint

Non-identifying aggregate checkpoints for closed-record retention cleanup.

- Prisma model: `institution_injury_retention_checkpoint`; domain: Health and privacy; treatment: **retain-current**.
- Direct server source references: [server/injury-retention.ts](../../../apps/backend/server/injury-retention.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `singleton` | `boolean` | no | `true` | One-row installation constraint. |
| `completed_at` | `timestamp with time zone` | no | — | Workout completion timestamp; independent from event attendance. |
| `closed_count` | `integer` | no | — | Non-identifying retention aggregate count of closed records. |
| `purged_count` | `integer` | no | — | Non-identifying retention aggregate count of purged records. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_injury_retention_checkpoint_closed_count_check`: `CHECK ((closed_count >= 0))`
- `institution_injury_retention_checkpoint_pkey`: `PRIMARY KEY (singleton)`
- `institution_injury_retention_checkpoint_purged_count_check`: `CHECK ((purged_count >= 0))`
- `institution_injury_retention_checkpoint_singleton_check`: `CHECK (singleton)`

```sql
CREATE UNIQUE INDEX institution_injury_retention_checkpoint_pkey ON public.institution_injury_retention_checkpoint USING btree (singleton);
```


</details>

## public.institution_invitations

Seven-day single-use institution invitation hashes, roles and sport metadata.

- Prisma model: `institution_invitations`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/institution.ts](../../../apps/backend/server/institution.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `email` | `text` | no | — | Account/invitation identifier; not verified by this deployment flow. |
| `roles` | `text[]` | no | — | Stored role array; current institution membership permits exactly one role. |
| `token_hash` | `text` | no | — | One-way token hash; never the usable token. |
| `created_by` | `uuid` | yes | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `expires_at` | `timestamp with time zone` | no | `(now() + '7 days'::interval)` | Expiration instant. |
| `state` | `text` | no | `'pending'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `accepted_by` | `uuid` | yes | — | Account that consumed the invitation. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `sport_ids` | `uuid[]` | no | `'{}'::uuid[]` | Selected sport/specialty identities frozen on the invitation. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_invitation_admin_no_sports`: `CHECK (((NOT ('admin'::text = ANY (roles))) OR (cardinality(sport_ids) = 0)))`
- `institution_invitations_accepted_by_fkey`: `FOREIGN KEY (accepted_by) REFERENCES identity.users(id) ON DELETE SET NULL`
- `institution_invitations_created_by_fkey`: `FOREIGN KEY (created_by) REFERENCES identity.users(id) ON DELETE SET NULL`
- `institution_invitations_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_invitations_pkey`: `PRIMARY KEY (id)`
- `institution_invitations_single_role_check`: `CHECK (((cardinality(roles) = 1) AND (roles <@ ARRAY['admin'::text, 'trainer'::text, 'trainee'::text])))`
- `institution_invitations_state_check`: `CHECK ((state = ANY (ARRAY['pending'::text, 'accepted'::text, 'revoked'::text])))`
- `institution_invitations_token_hash_key`: `UNIQUE (token_hash)`

```sql
CREATE INDEX institution_invitations_pending ON public.institution_invitations USING btree (institution_id, email) WHERE (state = 'pending'::text);
CREATE UNIQUE INDEX institution_invitations_pkey ON public.institution_invitations USING btree (id);
CREATE UNIQUE INDEX institution_invitations_token_hash_key ON public.institution_invitations USING btree (token_hash);
```


</details>

## public.institution_meal_history

Attributed previous versions of actual nutrition entries.

- Prisma model: `institution_meal_history`; domain: Nutrition; treatment: **retain-current**.
- Direct server source references: [server/nutrition.ts](../../../apps/backend/server/nutrition.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `meal_id` | `uuid` | no | — | Linked meal identity; scope and target are shown in the foreign keys below. |
| `revision` | `integer` | no | — | Optimistic record revision checked before edits. |
| `document` | `jsonb` | no | — | Workout prescription, actual measurements, notes and recorded version. |
| `recorded_at` | `timestamp with time zone` | no | `now()` | Recorded result/history timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_meal_history_institution_id_meal_id_fkey`: `FOREIGN KEY (institution_id, meal_id) REFERENCES institution_meals(institution_id, id) ON DELETE CASCADE`
- `institution_meal_history_meal_id_revision_key`: `UNIQUE (meal_id, revision)`
- `institution_meal_history_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX institution_meal_history_meal_id_revision_key ON public.institution_meal_history USING btree (meal_id, revision);
CREATE UNIQUE INDEX institution_meal_history_pkey ON public.institution_meal_history USING btree (id);
```


</details>

## public.institution_meals

Athlete actual consumption entries, kept separate from suggested meal plans.

- Prisma model: `institution_meals`; domain: Nutrition; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/nutrition.ts](../../../apps/backend/server/nutrition.ts).
- Referenced by: [public.institution_meal_history](schema.md#publicinstitution_meal_history).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `logged_on` | `date` | no | — | Consumption local date. |
| `food` | `jsonb` | no | — | Food source snapshot. |
| `note` | `text` | no | `''::text` | Scoped user-entered note; not a place to bypass health-record permissions. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `removed` | `boolean` | no | `false` | Recorded removal state; not deletion of unrelated history. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_meals_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_meals_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_meals_institution_id_member_id_fkey`: `FOREIGN KEY (institution_id, member_id) REFERENCES institution_members(institution_id, id) ON DELETE CASCADE`
- `institution_meals_note_check`: `CHECK ((char_length(note) <= 2000))`
- `institution_meals_pkey`: `PRIMARY KEY (id)`
- `institution_meals_revision_check`: `CHECK ((revision > 0))`

```sql
CREATE UNIQUE INDEX institution_meals_institution_id_id_key ON public.institution_meals USING btree (institution_id, id);
CREATE INDEX institution_meals_institution_id_member_id_logged_on_created_id ON public.institution_meals USING btree (institution_id, member_id, logged_on, created_at);
CREATE UNIQUE INDEX institution_meals_pkey ON public.institution_meals USING btree (id);
```


</details>

## public.institution_member_sports

Membership-to-sport/specialty assignments.

- Prisma model: `institution_member_sports`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/coaching-links.ts](../../../apps/backend/server/coaching-links.ts), [server/institution.ts](../../../apps/backend/server/institution.ts), [server/sports.ts](../../../apps/backend/server/sports.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `sport_id` | `uuid` | no | — | Linked sport identity; scope and target are shown in the foreign keys below. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_member_sports_institution_id_member_id_fkey`: `FOREIGN KEY (institution_id, member_id) REFERENCES institution_members(institution_id, id) ON DELETE CASCADE`
- `institution_member_sports_institution_id_sport_id_fkey`: `FOREIGN KEY (institution_id, sport_id) REFERENCES institution_sports(institution_id, id) ON DELETE CASCADE`
- `institution_member_sports_pkey`: `PRIMARY KEY (member_id, sport_id)`

```sql
CREATE UNIQUE INDEX institution_member_sports_pkey ON public.institution_member_sports USING btree (member_id, sport_id);
CREATE INDEX institution_member_sports_sport ON public.institution_member_sports USING btree (institution_id, sport_id);
```


</details>

## public.institution_members

Institution membership, one role, active/revoked state, primary-coach mirror and revision.

- Prisma model: `institution_members`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/analytics.ts](../../../apps/backend/server/analytics.ts), [server/assets.ts](../../../apps/backend/server/assets.ts), [server/auth.ts](../../../apps/backend/server/auth.ts), [server/calendar.ts](../../../apps/backend/server/calendar.ts), [server/coaching-links.ts](../../../apps/backend/server/coaching-links.ts), [server/communication.ts](../../../apps/backend/server/communication.ts), [server/experience-report.ts](../../../apps/backend/server/experience-report.ts), [server/follow-up.ts](../../../apps/backend/server/follow-up.ts), [server/injuries.ts](../../../apps/backend/server/injuries.ts), [server/injury-retention.ts](../../../apps/backend/server/injury-retention.ts), [server/institution.ts](../../../apps/backend/server/institution.ts), [server/notifications.ts](../../../apps/backend/server/notifications.ts), [server/nutrition-plan-index.ts](../../../apps/backend/server/nutrition-plan-index.ts), [server/nutrition.ts](../../../apps/backend/server/nutrition.ts), [server/people.ts](../../../apps/backend/server/people.ts), [server/platform.ts](../../../apps/backend/server/platform.ts), [server/program-media.ts](../../../apps/backend/server/program-media.ts), [server/programming.ts](../../../apps/backend/server/programming.ts), [server/service-catalog.ts](../../../apps/backend/server/service-catalog.ts), [server/sports.ts](../../../apps/backend/server/sports.ts), [server/workout-sequence.ts](../../../apps/backend/server/workout-sequence.ts).
- Referenced by: [public.assessment_result_history](schema.md#publicassessment_result_history), [public.assessment_results](schema.md#publicassessment_results), [public.assessment_templates](schema.md#publicassessment_templates), [public.institution_assets](schema.md#publicinstitution_assets), [public.institution_assignments](schema.md#publicinstitution_assignments), [public.institution_channel_members](schema.md#publicinstitution_channel_members), [public.institution_channel_reads](schema.md#publicinstitution_channel_reads), [public.institution_channels](schema.md#publicinstitution_channels), [public.institution_coaching_links](schema.md#publicinstitution_coaching_links), [public.institution_event_people](schema.md#publicinstitution_event_people), [public.institution_events](schema.md#publicinstitution_events), [public.institution_exercises](schema.md#publicinstitution_exercises), [public.institution_group_members](schema.md#publicinstitution_group_members), [public.institution_groups](schema.md#publicinstitution_groups), [public.institution_injury_access_log](schema.md#publicinstitution_injury_access_log), [public.institution_injury_permissions](schema.md#publicinstitution_injury_permissions), [public.institution_injury_records](schema.md#publicinstitution_injury_records), [public.institution_meals](schema.md#publicinstitution_meals), [public.institution_member_sports](schema.md#publicinstitution_member_sports), [public.institution_members](schema.md#publicinstitution_members), [public.institution_messages](schema.md#publicinstitution_messages), [public.institution_nutrition_plans](schema.md#publicinstitution_nutrition_plans), [public.institution_nutrition_sharing](schema.md#publicinstitution_nutrition_sharing), [public.institution_programs](schema.md#publicinstitution_programs), [public.institution_session_history](schema.md#publicinstitution_session_history), [public.institution_sessions](schema.md#publicinstitution_sessions), [public.institution_versions](schema.md#publicinstitution_versions), [public.institution_workout_positions](schema.md#publicinstitution_workout_positions), [public.institution_workout_recurrences](schema.md#publicinstitution_workout_recurrences), [public.institution_workplace_feedback](schema.md#publicinstitution_workplace_feedback).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `user_id` | `uuid` | yes | — | Global account subject. |
| `roles` | `text[]` | no | — | Stored role array; current institution membership permits exactly one role. |
| `active` | `boolean` | no | `true` | Current enabled membership/record state; historical records are retained. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `trainer_id` | `uuid` | yes | — | Primary-coach membership mirror, not an additional role on the athlete. |
| `joined_at` | `timestamp with time zone` | no | `now()` | Membership join time. |
| `name` | `text` | no | `'Former member'::text` | Display name for this entity. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_members_check`: `CHECK (((trainer_id IS NULL) OR ((trainer_id <> id) AND ('trainee'::text = ANY (roles)))))`
- `institution_members_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_members_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_members_institution_id_trainer_id_fkey`: `FOREIGN KEY (institution_id, trainer_id) REFERENCES institution_members(institution_id, id)`
- `institution_members_institution_id_user_id_key`: `UNIQUE (institution_id, user_id)`
- `institution_members_pkey`: `PRIMARY KEY (id)`
- `institution_members_single_role_check`: `CHECK (((cardinality(roles) = 1) AND (roles <@ ARRAY['admin'::text, 'trainer'::text, 'trainee'::text])))`
- `institution_members_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE SET NULL`

```sql
CREATE UNIQUE INDEX institution_members_institution_id_id_key ON public.institution_members USING btree (institution_id, id);
CREATE UNIQUE INDEX institution_members_institution_id_user_id_key ON public.institution_members USING btree (institution_id, user_id);
CREATE INDEX institution_members_name_page ON public.institution_members USING btree (institution_id, active, name, id);
CREATE UNIQUE INDEX institution_members_pkey ON public.institution_members USING btree (id);
CREATE INDEX institution_members_trainer ON public.institution_members USING btree (institution_id, trainer_id) WHERE active;
CREATE INDEX institution_members_user ON public.institution_members USING btree (user_id, active);
CREATE TRIGGER institution_members_sync_coaching_links AFTER INSERT OR UPDATE OF active, roles, trainer_id ON public.institution_members FOR EACH ROW EXECUTE FUNCTION sync_coaching_links();
```


</details>

## public.institution_message_assets

Ordered many-attachment links for institution messages.

- Prisma model: `institution_message_assets`; domain: Files and media; treatment: **retain-current**.
- Direct server source references: [server/communication.ts](../../../apps/backend/server/communication.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `message_id` | `uuid` | no | — | Linked message identity; scope and target are shown in the foreign keys below. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `asset_id` | `uuid` | no | — | Linked asset identity; scope and target are shown in the foreign keys below. |
| `position` | `integer` | no | — | Stable sequence/order position within the owning record. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_message_assets_institution_id_asset_id_fkey`: `FOREIGN KEY (institution_id, asset_id) REFERENCES institution_assets(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_message_assets_message_id_institution_id_fkey`: `FOREIGN KEY (message_id, institution_id) REFERENCES institution_messages(id, institution_id) ON DELETE CASCADE`
- `institution_message_assets_message_id_position_key`: `UNIQUE (message_id, "position")`
- `institution_message_assets_pkey`: `PRIMARY KEY (message_id, asset_id)`
- `institution_message_assets_position_check`: `CHECK ((("position" >= 0) AND ("position" <= 9)))`

```sql
CREATE INDEX institution_message_assets_asset ON public.institution_message_assets USING btree (institution_id, asset_id);
CREATE UNIQUE INDEX institution_message_assets_message_id_position_key ON public.institution_message_assets USING btree (message_id, "position");
CREATE UNIQUE INDEX institution_message_assets_pkey ON public.institution_message_assets USING btree (message_id, asset_id);
```


</details>

## public.institution_messages

Institution message body, sender and attachment compatibility reference.

- Prisma model: `institution_messages`; domain: Communication and feedback; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/assets.ts](../../../apps/backend/server/assets.ts), [server/communication.ts](../../../apps/backend/server/communication.ts), [server/notifications.ts](../../../apps/backend/server/notifications.ts).
- Referenced by: [public.institution_message_assets](schema.md#publicinstitution_message_assets).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `sequence` | `bigint` | no | — | Ordered message/provider event position. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `channel_id` | `uuid` | no | — | Linked channel identity; scope and target are shown in the foreign keys below. |
| `sender_id` | `uuid` | no | — | Institution message sender membership. |
| `body` | `text` | no | — | Message/notification content; scoped private data. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `asset_id` | `uuid` | yes | — | Linked asset identity; scope and target are shown in the foreign keys below. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_messages_body_check`: `CHECK (((length(body) >= 1) AND (length(body) <= 4000)))`
- `institution_messages_channel_id_institution_id_fkey`: `FOREIGN KEY (channel_id, institution_id) REFERENCES institution_channels(id, institution_id) ON DELETE CASCADE`
- `institution_messages_id_institution_id_key`: `UNIQUE (id, institution_id)`
- `institution_messages_institution_id_asset_id_fkey`: `FOREIGN KEY (institution_id, asset_id) REFERENCES institution_assets(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_messages_pkey`: `PRIMARY KEY (id)`
- `institution_messages_sender_id_institution_id_fkey`: `FOREIGN KEY (sender_id, institution_id) REFERENCES institution_members(id, institution_id) DEFERRABLE INITIALLY DEFERRED`
- `institution_messages_sequence_key`: `UNIQUE (sequence)`

```sql
CREATE UNIQUE INDEX institution_messages_id_institution_id_key ON public.institution_messages USING btree (id, institution_id);
CREATE INDEX institution_messages_page ON public.institution_messages USING btree (channel_id, sequence DESC);
CREATE UNIQUE INDEX institution_messages_pkey ON public.institution_messages USING btree (id);
CREATE UNIQUE INDEX institution_messages_sequence_key ON public.institution_messages USING btree (sequence);
CREATE TRIGGER notification_org_message AFTER INSERT ON public.institution_messages FOR EACH ROW EXECUTE FUNCTION capture_domain_notification();
```


</details>

## public.institution_nutrition_plans

Institution nutrition guidance snapshots assigned to an athlete.

- Prisma model: `institution_nutrition_plans`; domain: Nutrition; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/nutrition-plan-index.ts](../../../apps/backend/server/nutrition-plan-index.ts), [server/nutrition.ts](../../../apps/backend/server/nutrition.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `author_id` | `uuid` | no | — | Attributed content author. |
| `revision` | `integer` | no | — | Optimistic record revision checked before edits. |
| `effective_on` | `date` | no | — | Historical plan-effective calendar date. |
| `expires_on` | `date` | yes | — | Expiration calendar date. |
| `targets` | `jsonb` | no | — | Per-set prescribed targets. |
| `meals` | `jsonb` | no | `'[]'::jsonb` | Suggested meal plan, not actual consumption. |
| `guidance` | `text` | no | `''::text` | Explicit nutrition guidance. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_nutrition_plans_check`: `CHECK (((expires_on IS NULL) OR (expires_on >= effective_on)))`
- `institution_nutrition_plans_guidance_check`: `CHECK ((char_length(guidance) <= 4000))`
- `institution_nutrition_plans_institution_id_author_id_fkey`: `FOREIGN KEY (institution_id, author_id) REFERENCES institution_members(institution_id, id)`
- `institution_nutrition_plans_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_nutrition_plans_institution_id_member_id_fkey`: `FOREIGN KEY (institution_id, member_id) REFERENCES institution_members(institution_id, id) ON DELETE CASCADE`
- `institution_nutrition_plans_institution_id_member_id_revisio_ke`: `UNIQUE (institution_id, member_id, revision)`
- `institution_nutrition_plans_pkey`: `PRIMARY KEY (id)`
- `institution_nutrition_plans_revision_check`: `CHECK ((revision > 0))`

```sql
CREATE INDEX institution_nutrition_plans_institution_id_member_id_effecti_id ON public.institution_nutrition_plans USING btree (institution_id, member_id, effective_on DESC, revision DESC);
CREATE UNIQUE INDEX institution_nutrition_plans_institution_id_member_id_revisio_ke ON public.institution_nutrition_plans USING btree (institution_id, member_id, revision);
CREATE UNIQUE INDEX institution_nutrition_plans_pkey ON public.institution_nutrition_plans USING btree (id);
```


</details>

## public.institution_nutrition_sharing

Athlete authorization and revision for coach visibility of actual nutrition records.

- Prisma model: `institution_nutrition_sharing`; domain: Nutrition; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/nutrition.ts](../../../apps/backend/server/nutrition.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `enabled` | `boolean` | no | `false` | Explicit configured feature/record flag. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_nutrition_sharing_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_nutrition_sharing_institution_id_member_id_fkey`: `FOREIGN KEY (institution_id, member_id) REFERENCES institution_members(institution_id, id) ON DELETE CASCADE`
- `institution_nutrition_sharing_institution_id_member_id_key`: `UNIQUE (institution_id, member_id)`
- `institution_nutrition_sharing_pkey`: `PRIMARY KEY (member_id)`
- `institution_nutrition_sharing_revision_check`: `CHECK ((revision > 0))`

```sql
CREATE UNIQUE INDEX institution_nutrition_sharing_institution_id_member_id_key ON public.institution_nutrition_sharing USING btree (institution_id, member_id);
CREATE UNIQUE INDEX institution_nutrition_sharing_pkey ON public.institution_nutrition_sharing USING btree (member_id);
```


</details>

## public.institution_operations

Exact actor/institution-scoped command payload and response receipts.

- Prisma model: `institution_operations`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/institution.ts](../../../apps/backend/server/institution.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `actor_id` | `uuid` | no | — | Account actor responsible for this command/audit. |
| `payload` | `jsonb` | no | — | Original operation/provider request payload retained for exact identity/history. |
| `result` | `jsonb` | no | — | Saved operation response returned on an exact retry. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_operations_actor_id_fkey`: `FOREIGN KEY (actor_id) REFERENCES identity.users(id) ON DELETE CASCADE`
- `institution_operations_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_operations_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX institution_operations_pkey ON public.institution_operations USING btree (id);
```


</details>

## public.institution_programs

Editable institution program drafts, publication/library state and revision.

- Prisma model: `institution_programs`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/assets.ts](../../../apps/backend/server/assets.ts), [server/program-media.ts](../../../apps/backend/server/program-media.ts), [server/programming.ts](../../../apps/backend/server/programming.ts).
- Referenced by: [public.institution_versions](schema.md#publicinstitution_versions).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `title` | `text` | no | — | Human-readable title. |
| `draft` | `jsonb` | no | — | Editable program prescription before publication. |
| `draft_version` | `integer` | no | `1` | Optimistic draft revision; distinct from published version number. |
| `archived` | `boolean` | no | `false` | Archived identity/draft flag; archival is not data deletion. |
| `listed` | `boolean` | no | `false` | Published/library visibility; assignment remains explicit. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_programs_institution_id_created_by_fkey`: `FOREIGN KEY (institution_id, created_by) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_programs_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED`
- `institution_programs_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_programs_pkey`: `PRIMARY KEY (id)`
- `institution_programs_title_check`: `CHECK (((length(title) >= 1) AND (length(title) <= 100)))`

```sql
CREATE UNIQUE INDEX institution_programs_institution_id_id_key ON public.institution_programs USING btree (institution_id, id);
CREATE UNIQUE INDEX institution_programs_pkey ON public.institution_programs USING btree (id);
```


</details>

## public.institution_session_feedback

Explicit athlete ratings tied to a workout or event; missing feedback is unknown.

- Prisma model: `institution_session_feedback`; domain: Communication and feedback; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/experience-report.ts](../../../apps/backend/server/experience-report.ts), [server/feedback.ts](../../../apps/backend/server/feedback.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `workout_id` | `uuid` | yes | — | Linked workout identity; scope and target are shown in the foreign keys below. |
| `event_id` | `uuid` | yes | — | Linked event identity; scope and target are shown in the foreign keys below. |
| `score` | `integer` | no | — | Explicit submitted rating/result; missing is not neutral. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_feedback_event`: `UNIQUE (institution_id, member_id, event_id)`
- `institution_feedback_workout`: `UNIQUE (institution_id, member_id, workout_id)`
- `institution_session_feedback_check`: `CHECK ((num_nonnulls(workout_id, event_id) = 1))`
- `institution_session_feedback_institution_id_member_id_event_fke`: `FOREIGN KEY (institution_id, member_id, event_id) REFERENCES institution_event_people(institution_id, member_id, event_id) ON DELETE CASCADE`
- `institution_session_feedback_institution_id_member_id_worko_fke`: `FOREIGN KEY (institution_id, member_id, workout_id) REFERENCES institution_sessions(institution_id, member_id, id) ON DELETE CASCADE`
- `institution_session_feedback_pkey`: `PRIMARY KEY (id)`
- `institution_session_feedback_score_check`: `CHECK (((score >= 1) AND (score <= 5)))`

```sql
CREATE UNIQUE INDEX institution_feedback_event ON public.institution_session_feedback USING btree (institution_id, member_id, event_id);
CREATE INDEX institution_feedback_period ON public.institution_session_feedback USING btree (institution_id, created_at);
CREATE UNIQUE INDEX institution_feedback_workout ON public.institution_session_feedback USING btree (institution_id, member_id, workout_id);
CREATE UNIQUE INDEX institution_session_feedback_pkey ON public.institution_session_feedback USING btree (id);
```


</details>

## public.institution_session_history

Attributed workout actual-result versions; corrections retain history.

- Prisma model: `institution_session_history`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/programming.ts](../../../apps/backend/server/programming.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `session_id` | `uuid` | no | — | Linked session identity; scope and target are shown in the foreign keys below. |
| `version` | `integer` | no | — | Workout/document version used by exact write/replay checks. |
| `actor_member_id` | `uuid` | no | — | Membership actor responsible for this result version. |
| `action` | `text` | no | — | Attributed operation/history action. |
| `entries` | `jsonb` | no | — | Versioned per-set actual measurements. |
| `note` | `text` | no | — | Scoped user-entered note; not a place to bypass health-record permissions. |
| `completed` | `boolean` | no | — | History/set completion flag; not automatic group completion. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_session_history_action_check`: `CHECK ((action = ANY (ARRAY['start'::text, 'save'::text])))`
- `institution_session_history_institution_id_actor_member_id_fkey`: `FOREIGN KEY (institution_id, actor_member_id) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_session_history_institution_id_session_id_fkey`: `FOREIGN KEY (institution_id, session_id) REFERENCES institution_sessions(institution_id, id) ON DELETE CASCADE`
- `institution_session_history_pkey`: `PRIMARY KEY (id)`
- `institution_session_history_session_id_version_key`: `UNIQUE (session_id, version)`

```sql
CREATE UNIQUE INDEX institution_session_history_pkey ON public.institution_session_history USING btree (id);
CREATE UNIQUE INDEX institution_session_history_session_id_version_key ON public.institution_session_history USING btree (session_id, version);
```


</details>

## public.institution_sessions

Athlete workout document, prescription/actual results, recorder attribution and optional scoped occurrence link.

- Prisma model: `institution_sessions`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/analytics.ts](../../../apps/backend/server/analytics.ts), [server/assets.ts](../../../apps/backend/server/assets.ts), [server/experience-report.ts](../../../apps/backend/server/experience-report.ts), [server/feedback.ts](../../../apps/backend/server/feedback.ts), [server/follow-up.ts](../../../apps/backend/server/follow-up.ts), [server/notifications.ts](../../../apps/backend/server/notifications.ts), [server/people.ts](../../../apps/backend/server/people.ts), [server/programming.ts](../../../apps/backend/server/programming.ts), [server/workout-sequence.ts](../../../apps/backend/server/workout-sequence.ts).
- Referenced by: [public.institution_session_feedback](schema.md#publicinstitution_session_feedback), [public.institution_session_history](schema.md#publicinstitution_session_history), [public.institution_workout_positions](schema.md#publicinstitution_workout_positions).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `assignment_id` | `uuid` | no | — | Linked assignment identity; scope and target are shown in the foreign keys below. |
| `day_id` | `text` | no | — | Published workout day identity. |
| `local_date` | `date` | no | — | Recorded workout date, independent of UTC day boundaries. |
| `document` | `jsonb` | no | — | Workout prescription, actual measurements, notes and recorded version. |
| `version` | `integer` | no | `1` | Workout/document version used by exact write/replay checks. |
| `started_at` | `timestamp with time zone` | no | `now()` | Workout start timestamp. |
| `completed_at` | `timestamp with time zone` | yes | — | Workout completion timestamp; independent from event attendance. |
| `recorded_mode` | `text` | no | `'self'::text` | Self versus delegated recording; the athlete remains the subject. |
| `recorded_by` | `uuid` | yes | — | Attributed recorder identity. |
| `occurrence_id` | `uuid` | yes | — | Linked occurrence identity; scope and target are shown in the foreign keys below. |
| `source_snapshot` | `jsonb` | yes | — | Frozen assignment/version/day prescription source; never replaced by today's draft. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_session_subject`: `UNIQUE (institution_id, member_id, id)`
- `institution_sessions_assignment_id_local_date_day_id_key`: `UNIQUE (assignment_id, local_date, day_id)`
- `institution_sessions_delegated_by`: `CHECK (((recorded_mode = 'self'::text) OR (recorded_by IS NOT NULL)))`
- `institution_sessions_institution_id_assignment_id_fkey`: `FOREIGN KEY (institution_id, assignment_id) REFERENCES institution_assignments(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_sessions_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED`
- `institution_sessions_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_sessions_institution_id_member_id_fkey`: `FOREIGN KEY (institution_id, member_id) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_sessions_pkey`: `PRIMARY KEY (id)`
- `institution_sessions_recorded_by`: `FOREIGN KEY (institution_id, recorded_by) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_sessions_recorded_mode_check`: `CHECK ((recorded_mode = ANY (ARRAY['self'::text, 'delegated'::text])))`
- `institution_workout_participant`: `FOREIGN KEY (institution_id, member_id, occurrence_id) REFERENCES institution_event_people(institution_id, member_id, event_id)`
- `institution_workout_scoped_participant`: `UNIQUE (institution_id, member_id, occurrence_id)`
- `institution_workout_snapshot_object`: `CHECK (((source_snapshot IS NULL) OR (jsonb_typeof(source_snapshot) = 'object'::text)))`

```sql
CREATE INDEX institution_history ON public.institution_sessions USING btree (institution_id, member_id, started_at DESC, id);
CREATE UNIQUE INDEX institution_session_subject ON public.institution_sessions USING btree (institution_id, member_id, id);
CREATE UNIQUE INDEX institution_sessions_assignment_id_local_date_day_id_key ON public.institution_sessions USING btree (assignment_id, local_date, day_id);
CREATE UNIQUE INDEX institution_sessions_institution_id_id_key ON public.institution_sessions USING btree (institution_id, id);
CREATE UNIQUE INDEX institution_sessions_pkey ON public.institution_sessions USING btree (id);
CREATE UNIQUE INDEX institution_workout_occurrence_subject ON public.institution_sessions USING btree (occurrence_id, member_id) WHERE (occurrence_id IS NOT NULL);
CREATE UNIQUE INDEX institution_workout_scoped_participant ON public.institution_sessions USING btree (institution_id, member_id, occurrence_id);
CREATE TRIGGER institution_workout_source_guard BEFORE INSERT OR UPDATE ON public.institution_sessions FOR EACH ROW EXECUTE FUNCTION guard_workout_source();
CREATE TRIGGER notification_org_workout AFTER UPDATE ON public.institution_sessions FOR EACH ROW EXECUTE FUNCTION capture_domain_notification();
```


</details>

## public.institution_sports

Institution sports and coaching specialties, ordered and archived explicitly.

- Prisma model: `institution_sports`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/coaching-links.ts](../../../apps/backend/server/coaching-links.ts), [server/institution.ts](../../../apps/backend/server/institution.ts), [server/programming.ts](../../../apps/backend/server/programming.ts), [server/sports.ts](../../../apps/backend/server/sports.ts).
- Referenced by: [public.institution_assignments](schema.md#publicinstitution_assignments), [public.institution_coaching_links](schema.md#publicinstitution_coaching_links), [public.institution_member_sports](schema.md#publicinstitution_member_sports).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `name` | `text` | no | — | Display name for this entity. |
| `kind` | `text` | no | — | Entity variant; consult SQL constraints and the relevant handler. |
| `archived` | `boolean` | no | `false` | Archived identity/draft flag; archival is not data deletion. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_sports_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `institution_sports_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_sports_kind_check`: `CHECK ((kind = ANY (ARRAY['sport'::text, 'specialty'::text])))`
- `institution_sports_name_check`: `CHECK ((((char_length(name) >= 1) AND (char_length(name) <= 80)) AND (name = btrim(name))))`
- `institution_sports_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX institution_sports_institution_id_id_key ON public.institution_sports USING btree (institution_id, id);
CREATE UNIQUE INDEX institution_sports_name ON public.institution_sports USING btree (institution_id, lower(name));
CREATE UNIQUE INDEX institution_sports_pkey ON public.institution_sports USING btree (id);
```


</details>

## public.institution_versions

Immutable published institution program snapshots referenced by assignments and history.

- Prisma model: `institution_versions`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/analytics.ts](../../../apps/backend/server/analytics.ts), [server/assets.ts](../../../apps/backend/server/assets.ts), [server/program-media.ts](../../../apps/backend/server/program-media.ts), [server/programming.ts](../../../apps/backend/server/programming.ts).
- Referenced by: [public.institution_assignments](schema.md#publicinstitution_assignments).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `program_id` | `uuid` | no | — | Linked program identity; scope and target are shown in the foreign keys below. |
| `revision` | `integer` | no | — | Optimistic record revision checked before edits. |
| `title` | `text` | no | — | Human-readable title. |
| `prescription` | `jsonb` | no | — | Immutable exercise/program prescription snapshot. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_versions_institution_id_created_by_fkey`: `FOREIGN KEY (institution_id, created_by) REFERENCES institution_members(institution_id, id) DEFERRABLE INITIALLY DEFERRED`
- `institution_versions_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_versions_institution_id_program_id_fkey`: `FOREIGN KEY (institution_id, program_id) REFERENCES institution_programs(institution_id, id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED`
- `institution_versions_pkey`: `PRIMARY KEY (id)`
- `institution_versions_program_id_revision_key`: `UNIQUE (program_id, revision)`

```sql
CREATE UNIQUE INDEX institution_versions_institution_id_id_key ON public.institution_versions USING btree (institution_id, id);
CREATE UNIQUE INDEX institution_versions_pkey ON public.institution_versions USING btree (id);
CREATE UNIQUE INDEX institution_versions_program_id_revision_key ON public.institution_versions USING btree (program_id, revision);
```


</details>

## public.institution_workout_positions

Assignment sequence position/cycle, occurrence/workout links and attributed once-only resolution.

- Prisma model: `institution_workout_positions`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/calendar.ts](../../../apps/backend/server/calendar.ts), [server/programming.ts](../../../apps/backend/server/programming.ts), [server/workout-sequence.ts](../../../apps/backend/server/workout-sequence.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `assignment_id` | `uuid` | no | — | Linked assignment identity; scope and target are shown in the foreign keys below. |
| `position` | `integer` | no | — | Stable sequence/order position within the owning record. |
| `cycle` | `integer` | no | — | Zero-based repeated plan-cycle number; no automatic load increase. |
| `day_id` | `text` | no | — | Published workout day identity. |
| `occurrence_id` | `uuid` | no | — | Linked occurrence identity; scope and target are shown in the foreign keys below. |
| `session_id` | `uuid` | yes | — | Linked session identity; scope and target are shown in the foreign keys below. |
| `state` | `text` | no | `'pending'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `resolved_by` | `uuid` | yes | — | Attributed member who explicitly completed/skipped this sequence position. |
| `resolved_at` | `timestamp with time zone` | yes | — | Explicit sequence resolution time. |
| `reason` | `text` | yes | — | Staff explanation for an explicit lifecycle decision, such as a skip. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_workout_positions_assignment_id_position_key`: `UNIQUE (assignment_id, "position")`
- `institution_workout_positions_check`: `CHECK ((((state = ANY (ARRAY['completed'::text, 'skipped'::text])) AND (resolved_at IS NOT NULL) AND (resolved_by IS NOT NULL)) OR ((state <> ALL (ARRAY['completed'::text, 'skipped'::text])) AND (resolved_at IS NULL) AND (resolved_by IS NULL))))`
- `institution_workout_positions_check1`: `CHECK (((state <> 'skipped'::text) OR ((reason IS NOT NULL) AND (length(btrim(reason)) > 0))))`
- `institution_workout_positions_cycle_check`: `CHECK ((cycle >= 0))`
- `institution_workout_positions_day_id_check`: `CHECK ((length(day_id) > 0))`
- `institution_workout_positions_institution_id_assignment_id_fkey`: `FOREIGN KEY (institution_id, assignment_id) REFERENCES institution_assignments(institution_id, id)`
- `institution_workout_positions_institution_id_occurrence_id_fkey`: `FOREIGN KEY (institution_id, occurrence_id) REFERENCES institution_events(institution_id, id)`
- `institution_workout_positions_institution_id_occurrence_id_key`: `UNIQUE (institution_id, occurrence_id)`
- `institution_workout_positions_institution_id_resolved_by_fkey`: `FOREIGN KEY (institution_id, resolved_by) REFERENCES institution_members(institution_id, id)`
- `institution_workout_positions_institution_id_session_id_fkey`: `FOREIGN KEY (institution_id, session_id) REFERENCES institution_sessions(institution_id, id)`
- `institution_workout_positions_institution_id_session_id_key`: `UNIQUE (institution_id, session_id)`
- `institution_workout_positions_occurrence_id_key`: `UNIQUE (occurrence_id)`
- `institution_workout_positions_pkey`: `PRIMARY KEY (id)`
- `institution_workout_positions_position_check`: `CHECK (("position" >= 0))`
- `institution_workout_positions_session_id_key`: `UNIQUE (session_id)`
- `institution_workout_positions_state_check`: `CHECK ((state = ANY (ARRAY['pending'::text, 'completed'::text, 'skipped'::text, 'cancelled'::text, 'paused'::text])))`

```sql
CREATE UNIQUE INDEX institution_workout_one_unresolved ON public.institution_workout_positions USING btree (assignment_id) WHERE (state = ANY (ARRAY['pending'::text, 'paused'::text]));
CREATE UNIQUE INDEX institution_workout_positions_assignment_id_position_key ON public.institution_workout_positions USING btree (assignment_id, "position");
CREATE UNIQUE INDEX institution_workout_positions_institution_id_occurrence_id_key ON public.institution_workout_positions USING btree (institution_id, occurrence_id);
CREATE UNIQUE INDEX institution_workout_positions_institution_id_session_id_key ON public.institution_workout_positions USING btree (institution_id, session_id);
CREATE UNIQUE INDEX institution_workout_positions_occurrence_id_key ON public.institution_workout_positions USING btree (occurrence_id);
CREATE UNIQUE INDEX institution_workout_positions_pkey ON public.institution_workout_positions USING btree (id);
CREATE UNIQUE INDEX institution_workout_positions_session_id_key ON public.institution_workout_positions USING btree (session_id);
CREATE TRIGGER institution_workout_position_guard BEFORE INSERT OR UPDATE ON public.institution_workout_positions FOR EACH ROW EXECUTE FUNCTION validate_workout_position();
```


</details>

## public.institution_workout_recurrences

Bounded weekly individual schedule rules; the recurring worker remains pending.

- Prisma model: `institution_workout_recurrences`; domain: Training and scheduling; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/workout-sequence.ts](../../../apps/backend/server/workout-sequence.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `assignment_id` | `uuid` | no | — | Linked assignment identity; scope and target are shown in the foreign keys below. |
| `created_by` | `uuid` | no | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `starts_on` | `date` | no | — | Inclusive recurrence date-range start. |
| `ends_on` | `date` | no | — | Inclusive recurrence date-range end. |
| `weekdays` | `smallint[]` | no | — | ISO weekday numbers selected for bounded weekly recurrence. |
| `timezone` | `text` | no | — | IANA timezone used for date/clock interpretation. |
| `local_time` | `time without time zone` | yes | — | Optional recurrence clock time; null is reserved for later day-only support. |
| `duration_minutes` | `integer` | yes | — | Fixed occurrence duration in minutes. |
| `state` | `text` | no | `'active'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_workout_recurrence_institution_id_assignment_id_fke`: `FOREIGN KEY (institution_id, assignment_id) REFERENCES institution_assignments(institution_id, id)`
- `institution_workout_recurrences_check`: `CHECK (((ends_on >= starts_on) AND (ends_on <= (starts_on + 366))))`
- `institution_workout_recurrences_check1`: `CHECK ((((local_time IS NULL) AND (duration_minutes IS NULL)) OR ((local_time IS NOT NULL) AND (duration_minutes IS NOT NULL) AND ((duration_minutes >= 1) AND (duration_minutes <= 480)))))`
- `institution_workout_recurrences_institution_id_created_by_fkey`: `FOREIGN KEY (institution_id, created_by) REFERENCES institution_members(institution_id, id)`
- `institution_workout_recurrences_institution_id_id_key`: `UNIQUE (institution_id, id)`
- `institution_workout_recurrences_pkey`: `PRIMARY KEY (id)`
- `institution_workout_recurrences_revision_check`: `CHECK ((revision > 0))`
- `institution_workout_recurrences_state_check`: `CHECK ((state = ANY (ARRAY['active'::text, 'cancelled'::text])))`
- `institution_workout_recurrences_weekdays_check`: `CHECK ((((cardinality(weekdays) >= 1) AND (cardinality(weekdays) <= 7)) AND (weekdays <@ ARRAY[(1)::smallint, (2)::smallint, (3)::smallint, (4)::smallint, (5)::smallint, (6)::smallint, (7)::smallint]) AND (array_position(weekdays, NULL::smallint) IS NULL)))`

```sql
CREATE INDEX institution_workout_recurrence_assignment ON public.institution_workout_recurrences USING btree (institution_id, assignment_id);
CREATE UNIQUE INDEX institution_workout_recurrences_institution_id_id_key ON public.institution_workout_recurrences USING btree (institution_id, id);
CREATE UNIQUE INDEX institution_workout_recurrences_pkey ON public.institution_workout_recurrences USING btree (id);
```


</details>

## public.institution_workplace_feedback

Explicit monthly coach workplace feedback; distinct from athlete experience.

- Prisma model: `institution_workplace_feedback`; domain: Communication and feedback; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/experience-report.ts](../../../apps/backend/server/experience-report.ts), [server/feedback.ts](../../../apps/backend/server/feedback.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `member_id` | `uuid` | no | — | Institution membership subject; distinct from global account identity. |
| `month` | `date` | no | — | Month-start date for explicit workplace feedback. |
| `score` | `integer` | no | — | Explicit submitted rating/result; missing is not neutral. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institution_workplace_feedback_institution_id_member_id_fkey`: `FOREIGN KEY (institution_id, member_id) REFERENCES institution_members(institution_id, id) ON DELETE CASCADE`
- `institution_workplace_feedback_month_check`: `CHECK ((EXTRACT(day FROM month) = (1)::numeric))`
- `institution_workplace_feedback_pkey`: `PRIMARY KEY (institution_id, member_id, month)`
- `institution_workplace_feedback_score_check`: `CHECK (((score >= 1) AND (score <= 5)))`

```sql
CREATE UNIQUE INDEX institution_workplace_feedback_pkey ON public.institution_workplace_feedback USING btree (institution_id, member_id, month);
```


</details>

## public.institutions

Persistent institution identity and historical scope keys; one institution is supported per installation.

- Prisma model: `institutions`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/auth.ts](../../../apps/backend/server/auth.ts), [server/institution-compatibility.ts](../../../apps/backend/server/institution-compatibility.ts), [server/institution.ts](../../../apps/backend/server/institution.ts), [server/platform.ts](../../../apps/backend/server/platform.ts), [server/program-media.ts](../../../apps/backend/server/program-media.ts).
- Referenced by: [identity.password_setup_tokens](schema.md#identitypassword_setup_tokens), [public.assessment_result_history](schema.md#publicassessment_result_history), [public.assessment_results](schema.md#publicassessment_results), [public.assessment_templates](schema.md#publicassessment_templates), [public.institution_assets](schema.md#publicinstitution_assets), [public.institution_assignments](schema.md#publicinstitution_assignments), [public.institution_audit_events](schema.md#publicinstitution_audit_events), [public.institution_channels](schema.md#publicinstitution_channels), [public.institution_event_people](schema.md#publicinstitution_event_people), [public.institution_events](schema.md#publicinstitution_events), [public.institution_exercises](schema.md#publicinstitution_exercises), [public.institution_group_members](schema.md#publicinstitution_group_members), [public.institution_groups](schema.md#publicinstitution_groups), [public.institution_invitations](schema.md#publicinstitution_invitations), [public.institution_meals](schema.md#publicinstitution_meals), [public.institution_members](schema.md#publicinstitution_members), [public.institution_nutrition_plans](schema.md#publicinstitution_nutrition_plans), [public.institution_nutrition_sharing](schema.md#publicinstitution_nutrition_sharing), [public.institution_operations](schema.md#publicinstitution_operations), [public.institution_programs](schema.md#publicinstitution_programs), [public.institution_sessions](schema.md#publicinstitution_sessions), [public.institution_sports](schema.md#publicinstitution_sports), [public.notification_events](schema.md#publicnotification_events), [public.program_media](schema.md#publicprogram_media).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `kind` | `text` | no | — | Entity variant; consult SQL constraints and the relevant handler. |
| `name` | `text` | no | — | Display name for this entity. |
| `created_by` | `uuid` | yes | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `archived` | `boolean` | no | `false` | Archived identity/draft flag; archival is not data deletion. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `institutions_created_by_fkey`: `FOREIGN KEY (created_by) REFERENCES identity.users(id) ON DELETE SET NULL`
- `institutions_kind_check`: `CHECK ((kind = ANY (ARRAY['independent'::text, 'organization'::text])))`
- `institutions_name_check`: `CHECK (((length(TRIM(BOTH FROM name)) >= 1) AND (length(TRIM(BOTH FROM name)) <= 100)))`
- `institutions_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX institutions_pkey ON public.institutions USING btree (id);
```


</details>

## public.invitations

Historical personal assignment/invitation records referenced by retained SQL lifecycle code; no new HTTP invitation flow.

- Prisma model: `invitations`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `coach_id` | `uuid` | no | — | Linked coach identity; scope and target are shown in the foreign keys below. |
| `intended_email` | `text` | no | — | Historical invitation intended account identifier. |
| `version_id` | `uuid` | no | — | Immutable published program version identity. |
| `token_hash` | `text` | no | — | One-way token hash; never the usable token. |
| `request_id` | `uuid` | no | — | Linked historical coaching request identity. |
| `status` | `text` | no | `'pending'::text` | Workout/support lifecycle status; it is not evidence of attendance. |
| `accepted_by` | `uuid` | yes | — | Account that consumed the invitation. |
| `assignment_id` | `uuid` | yes | — | Linked assignment identity; scope and target are shown in the foreign keys below. |
| `expires_at` | `timestamp with time zone` | no | `(now() + '7 days'::interval)` | Expiration instant. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `invitations_accepted_by_fkey`: `FOREIGN KEY (accepted_by) REFERENCES profiles(id) ON DELETE SET NULL`
- `invitations_assignment_id_fkey`: `FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL`
- `invitations_coach_id_fkey`: `FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `invitations_coach_id_request_id_key`: `UNIQUE (coach_id, request_id)`
- `invitations_pkey`: `PRIMARY KEY (id)`
- `invitations_status_check`: `CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'revoked'::text])))`
- `invitations_token_hash_key`: `UNIQUE (token_hash)`
- `invitations_version_id_fkey`: `FOREIGN KEY (version_id) REFERENCES plan_versions(id)`

```sql
CREATE UNIQUE INDEX invitations_coach_id_request_id_key ON public.invitations USING btree (coach_id, request_id);
CREATE UNIQUE INDEX invitations_pkey ON public.invitations USING btree (id);
CREATE UNIQUE INDEX invitations_token_hash_key ON public.invitations USING btree (token_hash);
```

- Policy `invitation_read` (SELECT): USING `(coach_id = identity.actor_id())`; CHECK `—`.

</details>

## public.meal_entries

Historical personal food-consumption entries retained for own-account export.

- Prisma model: `meal_entries`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `client_id` | `uuid` | no | — | Linked client identity; scope and target are shown in the foreign keys below. |
| `relationship_id` | `uuid` | yes | — | Historical private coach/athlete pair identity. |
| `logged_on` | `date` | no | — | Consumption local date. |
| `meal` | `text` | no | — | Actual consumed meal/food snapshot. |
| `food_id` | `uuid` | yes | — | Linked food identity; scope and target are shown in the foreign keys below. |
| `name` | `text` | no | — | Display name for this entity. |
| `quantity` | `numeric` | no | — | Actual consumed quantity. |
| `basis` | `numeric` | no | — | Food nutrient reference amount. |
| `unit` | `text` | no | — | Measurement unit paired with the stored value. |
| `nutrients` | `jsonb` | no | — | Stored nutrient source values; unknown is distinct from zero. |
| `source` | `text` | no | — | Reference provenance identifier. |
| `note` | `text` | no | `''::text` | Scoped user-entered note; not a place to bypass health-record permissions. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `meal_entries_client_id_fkey`: `FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `meal_entries_food_id_fkey`: `FOREIGN KEY (food_id) REFERENCES saved_foods(id) ON DELETE SET NULL`
- `meal_entries_pkey`: `PRIMARY KEY (id)`
- `meal_entries_relationship_id_fkey`: `FOREIGN KEY (relationship_id) REFERENCES coach_clients(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX meal_entries_pkey ON public.meal_entries USING btree (id);
CREATE INDEX meals_owner_date ON public.meal_entries USING btree (client_id, logged_on);
```

- Policy `meals_shared` (SELECT): USING `((client_id = identity.actor_id()) OR (EXISTS ( SELECT 1    FROM coach_clients c   WHERE ((c.id = meal_entries.relationship_id) AND (c.coach_id = identity.actor_id())))))`; CHECK `—`.

</details>

## public.measurements

Historical athlete measurements retained for own-account export.

- Prisma model: `measurements`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `client_id` | `uuid` | no | — | Linked client identity; scope and target are shown in the foreign keys below. |
| `relationship_id` | `uuid` | yes | — | Historical private coach/athlete pair identity. |
| `metric` | `text` | no | — | Historical measurement kind. |
| `measured_on` | `date` | no | — | Historical measurement date. |
| `value` | `numeric` | no | — | Stored metric value paired with its unit/definition. |
| `unit` | `text` | no | — | Measurement unit paired with the stored value. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `measurements_check`: `CHECK ((((metric = 'weight'::text) AND (unit = ANY (ARRAY['kg'::text, 'lb'::text]))) OR ((metric = 'waist'::text) AND (unit = ANY (ARRAY['cm'::text, 'in'::text])))))`
- `measurements_client_id_fkey`: `FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `measurements_metric_check`: `CHECK ((metric = ANY (ARRAY['weight'::text, 'waist'::text])))`
- `measurements_pkey`: `PRIMARY KEY (id)`
- `measurements_relationship_id_fkey`: `FOREIGN KEY (relationship_id) REFERENCES coach_clients(id) ON DELETE CASCADE`
- `measurements_unit_check`: `CHECK ((unit = ANY (ARRAY['kg'::text, 'lb'::text, 'cm'::text, 'in'::text])))`
- `measurements_value_check`: `CHECK (((value > (0)::numeric) AND (value <= (2000)::numeric)))`

```sql
CREATE INDEX measurements_owner_date ON public.measurements USING btree (client_id, measured_on);
CREATE UNIQUE INDEX measurements_pkey ON public.measurements USING btree (id);
```

- Policy `measurements_shared` (SELECT): USING `((client_id = identity.actor_id()) OR (EXISTS ( SELECT 1    FROM coach_clients c   WHERE ((c.id = measurements.relationship_id) AND (c.coach_id = identity.actor_id())))))`; CHECK `—`.

</details>

## public.messages

Historical private pair messages and linked workout/resource references; no standalone thread endpoint.

- Prisma model: `messages`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `sequence` | `bigint` | no | — | Ordered message/provider event position. |
| `relationship_id` | `uuid` | no | — | Historical private coach/athlete pair identity. |
| `sender_id` | `uuid` | no | — | Institution message sender membership. |
| `body` | `text` | no | — | Message/notification content; scoped private data. |
| `session_id` | `uuid` | yes | — | Linked session identity; scope and target are shown in the foreign keys below. |
| `request_id` | `uuid` | yes | — | Linked historical coaching request identity. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `resource_id` | `uuid` | yes | — | Linked resource identity; scope and target are shown in the foreign keys below. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `messages_body_check`: `CHECK (((char_length(body) >= 1) AND (char_length(body) <= 4000)))`
- `messages_check`: `CHECK (((session_id IS NULL) OR (request_id IS NULL)))`
- `messages_pkey`: `PRIMARY KEY (id)`
- `messages_relationship_id_fkey`: `FOREIGN KEY (relationship_id) REFERENCES coach_clients(id) ON DELETE CASCADE`
- `messages_request_id_fkey`: `FOREIGN KEY (request_id) REFERENCES coaching_requests(id) ON DELETE SET NULL`
- `messages_resource_id_fkey`: `FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL`
- `messages_sender_id_fkey`: `FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `messages_sequence_key`: `UNIQUE (sequence)`
- `messages_session_id_fkey`: `FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL`

```sql
CREATE INDEX messages_conversation ON public.messages USING btree (relationship_id, sequence DESC);
CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);
CREATE UNIQUE INDEX messages_sequence_key ON public.messages USING btree (sequence);
CREATE TRIGGER notification_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION capture_domain_notification();
```

- Policy `messages_participant` (SELECT): USING `(EXISTS ( SELECT 1    FROM coach_clients c   WHERE ((c.id = messages.relationship_id) AND ((identity.actor_id() = c.coach_id) OR (identity.actor_id() = c.client_id)))))`; CHECK `—`.

</details>

## public.notification_events

Per-user notification inbox and delivery checkpoints; not proof of external delivery.

- Prisma model: `notification_events`; domain: Communication and feedback; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/notifications.ts](../../../apps/backend/server/notifications.ts).
- Referenced by: [public.notification_intercepts](schema.md#publicnotification_intercepts).
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `user_id` | `uuid` | no | — | Global account subject. |
| `institution_id` | `uuid` | yes | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `category` | `text` | no | — | Exercise/notification classification. |
| `source_kind` | `text` | no | — | Notification/reference source category. |
| `source_id` | `uuid` | no | — | Referenced source identity. |
| `source_group` | `uuid` | no | — | Imported reference grouping key. |
| `event_key` | `text` | no | — | Stable notification source deduplication key. |
| `source_revision` | `integer` | yes | — | Referenced content revision. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `read_at` | `timestamp with time zone` | yes | — | User read acknowledgment timestamp. |
| `not_before` | `timestamp with time zone` | no | `now()` | Earliest permitted notification delivery attempt. |
| `expires_at` | `timestamp with time zone` | no | `(now() + '30 days'::interval)` | Expiration instant. |
| `state` | `text` | no | `'pending'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `attempts` | `integer` | no | `0` | Recorded delivery attempts, not proof of delivery. |
| `reason` | `text` | no | `''::text` | Staff explanation for an explicit lifecycle decision, such as a skip. |
| `sequence` | `bigint` | no | — | Ordered message/provider event position. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `notification_events_category_check`: `CHECK ((category = ANY (ARRAY['messages'::text, 'feedback'::text, 'checkins'::text, 'calendar'::text])))`
- `notification_events_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `notification_events_pkey`: `PRIMARY KEY (id)`
- `notification_events_sequence_key`: `UNIQUE (sequence)`
- `notification_events_state_check`: `CHECK ((state = ANY (ARRAY['pending'::text, 'intercepted'::text, 'suppressed'::text, 'failed'::text])))`
- `notification_events_user_id_event_key_key`: `UNIQUE (user_id, event_key)`
- `notification_events_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX notification_events_pkey ON public.notification_events USING btree (id);
CREATE UNIQUE INDEX notification_events_sequence_key ON public.notification_events USING btree (sequence);
CREATE UNIQUE INDEX notification_events_user_id_event_key_key ON public.notification_events USING btree (user_id, event_key);
CREATE INDEX notifications_dispatch ON public.notification_events USING btree (not_before, id) WHERE (state = 'pending'::text);
CREATE INDEX notifications_group_latest ON public.notification_events USING btree (user_id, category, source_group, sequence DESC);
CREATE INDEX notifications_inbox ON public.notification_events USING btree (user_id, created_at DESC, id);
```


</details>

## public.notification_intercepts

Local delivery-adapter interception evidence, not a production email service.

- Prisma model: `notification_intercepts`; domain: Communication and feedback; treatment: **retain-current**.
- Direct server source references: [server/notifications.ts](../../../apps/backend/server/notifications.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `event_id` | `uuid` | no | — | Linked event identity; scope and target are shown in the foreign keys below. |
| `user_id` | `uuid` | no | — | Global account subject. |
| `subject` | `text` | no | — | Support/notification subject. |
| `body` | `text` | no | — | Message/notification content; scoped private data. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `notification_intercepts_event_id_fkey`: `FOREIGN KEY (event_id) REFERENCES notification_events(id) ON DELETE CASCADE`
- `notification_intercepts_pkey`: `PRIMARY KEY (event_id)`
- `notification_intercepts_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX notification_intercepts_pkey ON public.notification_intercepts USING btree (event_id);
```


</details>

## public.notification_preferences

Explicit user category/channel preferences and quiet hours.

- Prisma model: `notification_preferences`; domain: Communication and feedback; treatment: **retain-current**.
- Direct server source references: [server/account-data.ts](../../../apps/backend/server/account-data.ts), [server/notifications.ts](../../../apps/backend/server/notifications.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `user_id` | `uuid` | no | — | Global account subject. |
| `categories` | `jsonb` | no | `'{"calendar": {"email": false, "in_app": true}, "checkins": {"email": false, "in_app": true}, "feedback": {"email": false, "in_app": true}, "messages": {"email": false, "in_app": true}}'::jsonb` | Explicit notification category/channel preferences. |
| `quiet_start` | `integer` | no | `22` | Quiet-hours start hour in the account timezone. |
| `quiet_end` | `integer` | no | `8` | Quiet-hours end hour. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `notification_preferences_pkey`: `PRIMARY KEY (user_id)`
- `notification_preferences_quiet_end_check`: `CHECK (((quiet_end >= 0) AND (quiet_end <= 23)))`
- `notification_preferences_quiet_start_check`: `CHECK (((quiet_start >= 0) AND (quiet_start <= 23)))`
- `notification_preferences_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (user_id);
```


</details>

## public.nutrition_guidance

Historical personal nutrition suggestions retained separately from actual consumption.

- Prisma model: `nutrition_guidance`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `relationship_id` | `uuid` | no | — | Historical private coach/athlete pair identity. |
| `revision` | `integer` | no | — | Optimistic record revision checked before edits. |
| `effective_on` | `date` | no | — | Historical plan-effective calendar date. |
| `targets` | `jsonb` | no | — | Per-set prescribed targets. |
| `guidance` | `text` | no | — | Explicit nutrition guidance. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `meals` | `jsonb` | no | `'[]'::jsonb` | Suggested meal plan, not actual consumption. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `nutrition_guidance_pkey`: `PRIMARY KEY (id)`
- `nutrition_guidance_relationship_id_fkey`: `FOREIGN KEY (relationship_id) REFERENCES coach_clients(id) ON DELETE CASCADE`
- `nutrition_guidance_relationship_id_revision_key`: `UNIQUE (relationship_id, revision)`

```sql
CREATE INDEX guidance_relationship_date ON public.nutrition_guidance USING btree (relationship_id, effective_on DESC, revision DESC);
CREATE UNIQUE INDEX nutrition_guidance_pkey ON public.nutrition_guidance USING btree (id);
CREATE UNIQUE INDEX nutrition_guidance_relationship_id_revision_key ON public.nutrition_guidance USING btree (relationship_id, revision);
```

- Policy `guidance_participants` (SELECT): USING `(EXISTS ( SELECT 1    FROM coach_clients c   WHERE ((c.id = nutrition_guidance.relationship_id) AND ((identity.actor_id() = c.coach_id) OR (identity.actor_id() = c.client_id)))))`; CHECK `—`.

</details>

## public.plan_deliveries

Historical personal-plan delivery receipts retained for lifecycle/reconciliation; no new standalone delivery endpoint.

- Prisma model: `plan_deliveries`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `coach_id` | `uuid` | no | — | Linked coach identity; scope and target are shown in the foreign keys below. |
| `payload` | `jsonb` | no | — | Original operation/provider request payload retained for exact identity/history. |
| `result` | `jsonb` | no | — | Saved operation response returned on an exact retry. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `plan_deliveries_coach_id_fkey`: `FOREIGN KEY (coach_id) REFERENCES identity.users(id) ON DELETE CASCADE`
- `plan_deliveries_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX plan_deliveries_pkey ON public.plan_deliveries USING btree (id);
```


</details>

## public.plan_versions

Immutable personal/reference program versions required by historical workouts and reference fixtures.

- Prisma model: `plan_versions`; domain: Reference library; treatment: **retain-reference**.
- Direct server source references: [server/program-media.ts](../../../apps/backend/server/program-media.ts).
- Referenced by: [public.assignments](schema.md#publicassignments), [public.invitations](schema.md#publicinvitations), [public.sessions](schema.md#publicsessions), [public.team_assignments](schema.md#publicteam_assignments), [public.team_plans](schema.md#publicteam_plans).
- Access: RLS enabled; guest SELECT true; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `plan_id` | `uuid` | no | — | Linked plan identity; scope and target are shown in the foreign keys below. |
| `coach_id` | `uuid` | no | — | Linked coach identity; scope and target are shown in the foreign keys below. |
| `revision` | `integer` | no | — | Optimistic record revision checked before edits. |
| `title` | `text` | no | — | Human-readable title. |
| `prescription` | `jsonb` | no | — | Immutable exercise/program prescription snapshot. |
| `is_public` | `boolean` | no | `false` | Historical/reference snapshot public visibility. |
| `published_at` | `timestamp with time zone` | no | `now()` | Immutable source publication timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `plan_versions_coach_id_fkey`: `FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `plan_versions_pkey`: `PRIMARY KEY (id)`
- `plan_versions_plan_id_fkey`: `FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE`
- `plan_versions_plan_id_revision_key`: `UNIQUE (plan_id, revision)`

```sql
CREATE UNIQUE INDEX plan_versions_pkey ON public.plan_versions USING btree (id);
CREATE UNIQUE INDEX plan_versions_plan_id_revision_key ON public.plan_versions USING btree (plan_id, revision);
```

- Policy `public_sample_read` (SELECT): USING `is_public`; CHECK `—`.
- Policy `published_read` (SELECT): USING `((coach_id = identity.actor_id()) OR (EXISTS ( SELECT 1    FROM assignments a   WHERE ((a.version_id = plan_versions.id) AND (a.client_id = identity.actor_id())))) OR (EXISTS ( SELECT 1    FROM sessions s   WHERE ((s.version_id = plan_versions.id) AND (s.client_id = identity.actor_id())))))`; CHECK `—`.

</details>

## public.plans

Historical personal program drafts and ownership referenced by exported versions.

- Prisma model: `plans`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.plan_versions](schema.md#publicplan_versions).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `coach_id` | `uuid` | no | — | Linked coach identity; scope and target are shown in the foreign keys below. |
| `title` | `text` | no | — | Human-readable title. |
| `draft` | `jsonb` | no | — | Editable program prescription before publication. |
| `draft_version` | `integer` | no | `1` | Optimistic draft revision; distinct from published version number. |
| `archived` | `boolean` | no | `false` | Archived identity/draft flag; archival is not data deletion. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `team_template_id` | `uuid` | yes | — | Historical copied team-plan source identity. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `plans_coach_id_fkey`: `FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `plans_pkey`: `PRIMARY KEY (id)`
- `plans_team_template_id_fkey`: `FOREIGN KEY (team_template_id) REFERENCES team_plans(id) ON DELETE SET NULL`
- `plans_title_check`: `CHECK (((char_length(title) >= 1) AND (char_length(title) <= 100)))`

```sql
CREATE UNIQUE INDEX plans_pkey ON public.plans USING btree (id);
```

- Policy `own_plans` (SELECT): USING `(coach_id = identity.actor_id())`; CHECK `—`.

</details>

## public.platform_grants

Explicit operator authority; institution administration does not imply this grant.

- Prisma model: `platform_grants`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/institution.ts](../../../apps/backend/server/institution.ts), [server/platform.ts](../../../apps/backend/server/platform.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `user_id` | `uuid` | no | — | Global account subject. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `platform_grants_pkey`: `PRIMARY KEY (user_id)`
- `platform_grants_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX platform_grants_pkey ON public.platform_grants USING btree (user_id);
```


</details>

## public.platform_identity_state

Operator-managed account suspension state independent from institution role.

- Prisma model: `platform_identity_state`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/auth.ts](../../../apps/backend/server/auth.ts), [server/platform.ts](../../../apps/backend/server/platform.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `user_id` | `uuid` | no | — | Global account subject. |
| `suspended` | `boolean` | no | `false` | Operator account suspension, separate from membership revocation. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `platform_identity_state_pkey`: `PRIMARY KEY (user_id)`
- `platform_identity_state_revision_check`: `CHECK ((revision > 0))`
- `platform_identity_state_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX platform_identity_state_pkey ON public.platform_identity_state USING btree (user_id);
```


</details>

## public.platform_operations

Exact operator write receipts and actor attribution.

- Prisma model: `platform_operations`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: [server/platform.ts](../../../apps/backend/server/platform.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `actor_id` | `uuid` | yes | — | Account actor responsible for this command/audit. |
| `kind` | `text` | no | — | Entity variant; consult SQL constraints and the relevant handler. |
| `subject_id` | `uuid` | yes | — | Linked subject identity; scope and target are shown in the foreign keys below. |
| `reason` | `text` | no | — | Staff explanation for an explicit lifecycle decision, such as a skip. |
| `payload` | `jsonb` | no | — | Original operation/provider request payload retained for exact identity/history. |
| `result` | `jsonb` | no | — | Saved operation response returned on an exact retry. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `platform_operations_actor_id_fkey`: `FOREIGN KEY (actor_id) REFERENCES identity.users(id) ON DELETE SET NULL`
- `platform_operations_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX platform_operations_pkey ON public.platform_operations USING btree (id);
CREATE INDEX platform_operations_recent ON public.platform_operations USING btree (created_at DESC, id DESC);
```


</details>

## public.profiles

Own account display name, locale, measurement units and timezone; identity bridge for historical subject data.

- Prisma model: `profiles`; domain: Identity and access; treatment: **retain-current**.
- Direct server source references: [server/analytics.ts](../../../apps/backend/server/analytics.ts), [server/athlete-plans.ts](../../../apps/backend/server/athlete-plans.ts), [server/institution.ts](../../../apps/backend/server/institution.ts), [server/notifications.ts](../../../apps/backend/server/notifications.ts), [server/programming.ts](../../../apps/backend/server/programming.ts).
- Referenced by: [public.appointment_slots](schema.md#publicappointment_slots), [public.assignments](schema.md#publicassignments), [public.business_accounts](schema.md#publicbusiness_accounts), [public.coach_clients](schema.md#publiccoach_clients), [public.coaching_forms](schema.md#publiccoaching_forms), [public.conversation_reads](schema.md#publicconversation_reads), [public.exercises](schema.md#publicexercises), [public.invitations](schema.md#publicinvitations), [public.meal_entries](schema.md#publicmeal_entries), [public.measurements](schema.md#publicmeasurements), [public.messages](schema.md#publicmessages), [public.notification_events](schema.md#publicnotification_events), [public.notification_intercepts](schema.md#publicnotification_intercepts), [public.notification_preferences](schema.md#publicnotification_preferences), [public.plan_versions](schema.md#publicplan_versions), [public.plans](schema.md#publicplans), [public.resources](schema.md#publicresources), [public.saved_foods](schema.md#publicsaved_foods), [public.sessions](schema.md#publicsessions), [public.support_cases](schema.md#publicsupport_cases), [public.team_activity](schema.md#publicteam_activity), [public.team_assignments](schema.md#publicteam_assignments), [public.team_clients](schema.md#publicteam_clients), [public.team_invitations](schema.md#publicteam_invitations), [public.team_members](schema.md#publicteam_members), [public.team_plans](schema.md#publicteam_plans), [public.teams](schema.md#publicteams).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `display_name` | `text` | no | — | Account display name. |
| `locale` | `text` | no | `'en'::text` | Account language choice (English/Arabic). |
| `units` | `text` | no | `'kg'::text` | Preferred measurement units. |
| `timezone` | `text` | no | `'Asia/Dubai'::text` | IANA timezone used for date/clock interpretation. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `profiles_display_name_check`: `CHECK (((char_length(display_name) >= 1) AND (char_length(display_name) <= 80)))`
- `profiles_id_fkey`: `FOREIGN KEY (id) REFERENCES identity.users(id) ON DELETE CASCADE`
- `profiles_locale_check`: `CHECK ((locale = ANY (ARRAY['en'::text, 'ar'::text])))`
- `profiles_pkey`: `PRIMARY KEY (id)`
- `profiles_units_check`: `CHECK ((units = ANY (ARRAY['kg'::text, 'lb'::text])))`

```sql
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
```

- Policy `profile_read` (SELECT): USING `((id = identity.actor_id()) OR (EXISTS ( SELECT 1    FROM coach_clients c   WHERE (((c.client_id = profiles.id) AND (c.coach_id = identity.actor_id())) OR ((c.coach_id = profiles.id) AND (c.client_id = identity.actor_id()))))))`; CHECK `—`.

</details>

## public.program_media

Institution program artwork metadata and private-byte identity.

- Prisma model: `program_media`; domain: Files and media; treatment: **retain-current**.
- Direct server source references: [server/program-media.ts](../../../apps/backend/server/program-media.ts).
- Referenced by: No incoming SQL foreign key.
- Access: RLS not enabled; guest SELECT false; user SELECT false; server SELECT true. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `institution_id` | `uuid` | no | — | Institution scope key retained for compatibility; never a browser-selected tenant. |
| `created_by` | `uuid` | yes | — | Attributed creator identity; the foreign key identifies account versus membership scope. |
| `media_type` | `text` | no | — | Validated file MIME type. |
| `bytes` | `integer` | no | — | Declared stored file size in bytes. |
| `digest` | `text` | no | — | Pinned byte/content digest. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `program_media_bytes_check`: `CHECK (((bytes >= 1) AND (bytes <= 2097152)))`
- `program_media_created_by_fkey`: `FOREIGN KEY (created_by) REFERENCES identity.users(id) ON DELETE SET NULL`
- `program_media_institution_id_fkey`: `FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE`
- `program_media_media_type_check`: `CHECK ((media_type = ANY (ARRAY['image/jpeg'::text, 'image/png'::text, 'image/webp'::text])))`
- `program_media_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX program_media_pkey ON public.program_media USING btree (id);
```


</details>

## public.resource_shares

Historical per-relationship resource permissions needed by byte reads/export/deletion.

- Prisma model: `resource_shares`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `resource_id` | `uuid` | no | — | Linked resource identity; scope and target are shown in the foreign keys below. |
| `relationship_id` | `uuid` | no | — | Historical private coach/athlete pair identity. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `resource_shares_pkey`: `PRIMARY KEY (id)`
- `resource_shares_relationship_id_fkey`: `FOREIGN KEY (relationship_id) REFERENCES coach_clients(id) ON DELETE CASCADE`
- `resource_shares_resource_id_fkey`: `FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE`
- `resource_shares_resource_id_relationship_id_key`: `UNIQUE (resource_id, relationship_id)`

```sql
CREATE UNIQUE INDEX resource_shares_pkey ON public.resource_shares USING btree (id);
CREATE UNIQUE INDEX resource_shares_resource_id_relationship_id_key ON public.resource_shares USING btree (resource_id, relationship_id);
```

- Policy `shares_participants` (SELECT): USING `(EXISTS ( SELECT 1    FROM coach_clients c   WHERE ((c.id = resource_shares.relationship_id) AND ((identity.actor_id() = c.coach_id) OR (identity.actor_id() = c.client_id)))))`; CHECK `—`.

</details>

## public.resources

Historical personal file ownership, pending/ready/retired state and byte path; only recovery and cleanup remain exposed.

- Prisma model: `resources`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: [server/files.ts](../../../apps/backend/server/files.ts).
- Referenced by: [public.messages](schema.md#publicmessages), [public.resource_shares](schema.md#publicresource_shares), [public.team_resource_shares](schema.md#publicteam_resource_shares).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `owner_id` | `uuid` | no | — | Owning account/member identity; see its scoped foreign key. |
| `title` | `text` | no | — | Human-readable title. |
| `filename` | `text` | no | — | Original display filename; never an unchecked storage path. |
| `media_type` | `text` | no | — | Validated file MIME type. |
| `bytes` | `bigint` | no | — | Declared stored file size in bytes. |
| `object_path` | `text` | no | — | Historical private-byte storage key. |
| `state` | `text` | no | `'pending'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `resources_object_path_key`: `UNIQUE (object_path)`
- `resources_owner_id_fkey`: `FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `resources_pkey`: `PRIMARY KEY (id)`
- `resources_state_check`: `CHECK ((state = ANY (ARRAY['pending'::text, 'ready'::text, 'retired'::text])))`

```sql
CREATE UNIQUE INDEX resources_object_path_key ON public.resources USING btree (object_path);
CREATE UNIQUE INDEX resources_pkey ON public.resources USING btree (id);
```

- Policy `resources_read` (SELECT): USING `can_read_resource(id)`; CHECK `—`.

</details>

## public.saved_foods

Historical user-created food references retained for account export.

- Prisma model: `saved_foods`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.meal_entries](schema.md#publicmeal_entries).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `owner_id` | `uuid` | no | — | Owning account/member identity; see its scoped foreign key. |
| `name` | `text` | no | — | Display name for this entity. |
| `basis` | `numeric` | no | — | Food nutrient reference amount. |
| `unit` | `text` | no | — | Measurement unit paired with the stored value. |
| `nutrients` | `jsonb` | no | — | Stored nutrient source values; unknown is distinct from zero. |
| `source` | `text` | no | — | Reference provenance identifier. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `archived` | `boolean` | no | `false` | Archived identity/draft flag; archival is not data deletion. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `saved_foods_owner_id_fkey`: `FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `saved_foods_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX saved_foods_pkey ON public.saved_foods USING btree (id);
```

- Policy `foods_owner` (SELECT): USING `(owner_id = identity.actor_id())`; CHECK `—`.

</details>

## public.schedule_exceptions

Historical personal assignment calendar exceptions retained for export.

- Prisma model: `schedule_exceptions`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `assignment_id` | `uuid` | no | — | Linked assignment identity; scope and target are shown in the foreign keys below. |
| `day_id` | `text` | no | — | Published workout day identity. |
| `scheduled_date` | `date` | no | — | Explicit historical scheduled workout date. |
| `target_date` | `date` | no | — | Target local date for the owning guidance/record. |
| `state` | `text` | no | — | Record lifecycle state; SQL constraints and the handler govern valid transitions. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `schedule_exceptions_assignment_id_day_id_scheduled_date_key`: `UNIQUE (assignment_id, day_id, scheduled_date)`
- `schedule_exceptions_assignment_id_fkey`: `FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE`
- `schedule_exceptions_pkey`: `PRIMARY KEY (id)`
- `schedule_exceptions_state_check`: `CHECK ((state = ANY (ARRAY['moved'::text, 'skipped'::text])))`

```sql
CREATE UNIQUE INDEX schedule_exceptions_assignment_id_day_id_scheduled_date_key ON public.schedule_exceptions USING btree (assignment_id, day_id, scheduled_date);
CREATE UNIQUE INDEX schedule_exceptions_pkey ON public.schedule_exceptions USING btree (id);
```

- Policy `participant_schedule` (SELECT): USING `(EXISTS ( SELECT 1    FROM assignments a   WHERE ((a.id = schedule_exceptions.assignment_id) AND ((a.coach_id = identity.actor_id()) OR (a.client_id = identity.actor_id())))))`; CHECK `—`.

</details>

## public.session_operations

Exact historical workout write receipts; prevents uncertain retries from applying twice.

- Prisma model: `session_operations`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT false; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `session_id` | `uuid` | no | — | Linked session identity; scope and target are shown in the foreign keys below. |
| `operation_id` | `uuid` | no | — | Original durable command identity; retries keep this value. |
| `request_hash` | `text` | no | — | Digest of the exact sensitive request; not its cleartext contents. |
| `result` | `jsonb` | no | — | Saved operation response returned on an exact retry. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `session_operations_pkey`: `PRIMARY KEY (session_id, operation_id)`
- `session_operations_session_id_fkey`: `FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX session_operations_pkey ON public.session_operations USING btree (session_id, operation_id);
```


</details>

## public.sessions

Historical personal workout prescriptions/actuals and immutable source links; private read/replay/export remain supported.

- Prisma model: `public_sessions`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.messages](schema.md#publicmessages), [public.session_operations](schema.md#publicsession_operations), [public.set_entries](schema.md#publicset_entries).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `client_id` | `uuid` | no | — | Linked client identity; scope and target are shown in the foreign keys below. |
| `coach_id` | `uuid` | yes | — | Linked coach identity; scope and target are shown in the foreign keys below. |
| `assignment_id` | `uuid` | yes | — | Linked assignment identity; scope and target are shown in the foreign keys below. |
| `version_id` | `uuid` | yes | — | Immutable published program version identity. |
| `day_id` | `text` | no | — | Published workout day identity. |
| `occurrence_key` | `text` | no | — | Historical assignment/date/day replay identity. |
| `local_date` | `date` | no | — | Recorded workout date, independent of UTC day boundaries. |
| `title` | `text` | no | — | Human-readable title. |
| `prescription` | `jsonb` | no | — | Immutable exercise/program prescription snapshot. |
| `status` | `text` | no | `'in_progress'::text` | Workout/support lifecycle status; it is not evidence of attendance. |
| `note` | `text` | no | `''::text` | Scoped user-entered note; not a place to bypass health-record permissions. |
| `coach_note` | `text` | no | `''::text` | Explicit coach review note, separate from athlete actuals. |
| `reviewed_at` | `timestamp with time zone` | yes | — | Coach review timestamp. |
| `started_at` | `timestamp with time zone` | no | `now()` | Workout start timestamp. |
| `completed_at` | `timestamp with time zone` | yes | — | Workout completion timestamp; independent from event attendance. |
| `version` | `integer` | no | `1` | Workout/document version used by exact write/replay checks. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `sessions_assignment_id_fkey`: `FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL`
- `sessions_check`: `CHECK (((status = 'completed'::text) = (completed_at IS NOT NULL)))`
- `sessions_client_id_fkey`: `FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `sessions_client_id_occurrence_key_key`: `UNIQUE (client_id, occurrence_key)`
- `sessions_coach_id_fkey`: `FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE SET NULL`
- `sessions_coach_note_check`: `CHECK ((char_length(coach_note) <= 2000))`
- `sessions_note_check`: `CHECK ((char_length(note) <= 2000))`
- `sessions_pkey`: `PRIMARY KEY (id)`
- `sessions_status_check`: `CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text])))`
- `sessions_version_id_fkey`: `FOREIGN KEY (version_id) REFERENCES plan_versions(id) ON DELETE SET NULL`

```sql
CREATE INDEX sessions_client_feedback ON public.sessions USING btree (client_id, reviewed_at DESC) WHERE (coach_note <> ''::text);
CREATE INDEX sessions_client_history ON public.sessions USING btree (client_id, started_at DESC);
CREATE UNIQUE INDEX sessions_client_id_occurrence_key_key ON public.sessions USING btree (client_id, occurrence_key);
CREATE INDEX sessions_coach_review ON public.sessions USING btree (coach_id, completed_at DESC) WHERE (status = 'completed'::text);
CREATE INDEX sessions_pending_review ON public.sessions USING btree (coach_id, completed_at, id) WHERE ((status = 'completed'::text) AND (reviewed_at IS NULL));
CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);
CREATE TRIGGER notification_workout AFTER UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION capture_domain_notification();
```

- Policy `session_read` (SELECT): USING `((client_id = identity.actor_id()) OR (coach_id = identity.actor_id()))`; CHECK `—`.

</details>

## public.set_entries

Historical per-exercise/set actual measurements belonging to personal workouts.

- Prisma model: `set_entries`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `session_id` | `uuid` | no | — | Linked session identity; scope and target are shown in the foreign keys below. |
| `exercise_key` | `text` | no | — | Stable prescription exercise key. |
| `set_index` | `integer` | no | — | Zero-based exercise set ordinal. |
| `reps` | `integer` | no | — | Actual repetition count. |
| `load` | `numeric(8,2)` | no | — | Actual external load paired with unit. |
| `unit` | `text` | no | — | Measurement unit paired with the stored value. |
| `completed` | `boolean` | no | `false` | History/set completion flag; not automatic group completion. |
| `seconds` | `integer` | yes | — | Actual duration in seconds. |
| `metres` | `numeric(12,2)` | yes | — | Actual distance in metres. |
| `effort` | `numeric(3,1)` | yes | — | Explicit recorded effort value. |
| `exercise_id` | `text` | yes | — | Linked exercise identity; scope and target are shown in the foreign keys below. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `set_entries_effort_check`: `CHECK (((effort >= (1)::numeric) AND (effort <= (10)::numeric)))`
- `set_entries_load_check`: `CHECK (((load >= (0)::numeric) AND (load <= (1000)::numeric)))`
- `set_entries_metres_check`: `CHECK (((metres >= (0)::numeric) AND (metres <= (1000000)::numeric)))`
- `set_entries_pkey`: `PRIMARY KEY (session_id, exercise_key, set_index)`
- `set_entries_reps_check`: `CHECK (((reps >= 0) AND (reps <= 200)))`
- `set_entries_seconds_check`: `CHECK (((seconds >= 0) AND (seconds <= 86400)))`
- `set_entries_session_id_fkey`: `FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE`
- `set_entries_set_index_check`: `CHECK (((set_index >= 0) AND (set_index <= 19)))`
- `set_entries_unit_check`: `CHECK ((unit = ANY (ARRAY['kg'::text, 'lb'::text])))`

```sql
CREATE UNIQUE INDEX set_entries_pkey ON public.set_entries USING btree (session_id, exercise_key, set_index);
```

- Policy `entries_read` (SELECT): USING `(EXISTS ( SELECT 1    FROM sessions s   WHERE ((s.id = set_entries.session_id) AND ((s.client_id = identity.actor_id()) OR (s.coach_id = identity.actor_id())))))`; CHECK `—`.

</details>

## public.support_cases

Locally owned support reports and replies; legacy team scope is retained only for existing cases.

- Prisma model: `support_cases`; domain: Institution and operations; treatment: **retain-current**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `reporter_id` | `uuid` | no | — | Account that created the local support case. |
| `team_id` | `uuid` | yes | — | Historical team scope; not an additional current institution. |
| `subject` | `text` | no | — | Support/notification subject. |
| `detail` | `text` | no | — | Support details or attributed audit detail, depending on this table. |
| `state` | `text` | no | `'open'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `reply` | `text` | no | `''::text` | Explicit support reply content. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |
| `updated_at` | `timestamp with time zone` | no | `now()` | Last recorded update timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `support_cases_detail_check`: `CHECK (((char_length(detail) >= 1) AND (char_length(detail) <= 4000)))`
- `support_cases_pkey`: `PRIMARY KEY (id)`
- `support_cases_reporter_id_fkey`: `FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `support_cases_state_check`: `CHECK ((state = ANY (ARRAY['open'::text, 'resolved'::text])))`
- `support_cases_subject_check`: `CHECK (((char_length(subject) >= 1) AND (char_length(subject) <= 120)))`
- `support_cases_team_id_fkey`: `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL`

```sql
CREATE UNIQUE INDEX support_cases_pkey ON public.support_cases USING btree (id);
```

- Policy `support_participants` (SELECT): USING `((reporter_id = identity.actor_id()) OR (team_role(team_id) = ANY (ARRAY['owner'::text, 'admin'::text])))`; CHECK `—`.

</details>

## public.team_activity

Historical team activity/audit records retained for export and lifecycle checks.

- Prisma model: `team_activity`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `team_id` | `uuid` | no | — | Historical team scope; not an additional current institution. |
| `actor_id` | `uuid` | yes | — | Account actor responsible for this command/audit. |
| `action` | `text` | no | — | Attributed operation/history action. |
| `subject_id` | `uuid` | yes | — | Linked subject identity; scope and target are shown in the foreign keys below. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `team_activity_actor_id_fkey`: `FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL`
- `team_activity_pkey`: `PRIMARY KEY (id)`
- `team_activity_team_id_fkey`: `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX team_activity_pkey ON public.team_activity USING btree (id);
```

- Policy `activity_admin` (SELECT): USING `(team_role(team_id) = ANY (ARRAY['owner'::text, 'admin'::text]))`; CHECK `—`.

</details>

## public.team_assignments

Historical team plan deliveries retained for export.

- Prisma model: `team_assignments`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `group_id` | `uuid` | no | — | Linked group identity; scope and target are shown in the foreign keys below. |
| `actor_id` | `uuid` | yes | — | Account actor responsible for this command/audit. |
| `version_id` | `uuid` | yes | — | Immutable published program version identity. |
| `client_ids` | `uuid[]` | no | — | Historical selected athlete account identities. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `team_assignments_actor_id_fkey`: `FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL`
- `team_assignments_group_id_fkey`: `FOREIGN KEY (group_id) REFERENCES team_groups(id) ON DELETE CASCADE`
- `team_assignments_pkey`: `PRIMARY KEY (id)`
- `team_assignments_version_id_fkey`: `FOREIGN KEY (version_id) REFERENCES plan_versions(id) ON DELETE SET NULL`

```sql
CREATE UNIQUE INDEX team_assignments_pkey ON public.team_assignments USING btree (id);
```

- Policy `group_assignments_scoped` (SELECT): USING `((actor_id = identity.actor_id()) OR (EXISTS ( SELECT 1    FROM team_groups g   WHERE ((g.id = team_assignments.group_id) AND (team_role(g.team_id) = ANY (ARRAY['owner'::text, 'admin'::text]))))))`; CHECK `—`.

</details>

## public.team_clients

Historical team enrollment and assigned-coach ownership retained for export/deletion checks.

- Prisma model: `team_clients`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.team_group_members](schema.md#publicteam_group_members).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `team_id` | `uuid` | no | — | Historical team scope; not an additional current institution. |
| `client_id` | `uuid` | no | — | Linked client identity; scope and target are shown in the foreign keys below. |
| `relationship_id` | `uuid` | no | — | Historical private coach/athlete pair identity. |
| `coach_id` | `uuid` | yes | — | Linked coach identity; scope and target are shown in the foreign keys below. |
| `pending_coach_id` | `uuid` | yes | — | Historical pending reassignment destination. |
| `state` | `text` | no | `'pending'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `last_response_revision` | `integer` | yes | — | Last acknowledged response revision. |
| `last_accept` | `boolean` | yes | — | Last recorded acceptance checkpoint. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `team_clients_client_id_fkey`: `FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `team_clients_coach_id_fkey`: `FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE SET NULL`
- `team_clients_pending_coach_id_fkey`: `FOREIGN KEY (pending_coach_id) REFERENCES profiles(id) ON DELETE SET NULL`
- `team_clients_pkey`: `PRIMARY KEY (id)`
- `team_clients_relationship_id_fkey`: `FOREIGN KEY (relationship_id) REFERENCES coach_clients(id) ON DELETE CASCADE`
- `team_clients_state_check`: `CHECK ((state = ANY (ARRAY['pending'::text, 'active'::text, 'closed'::text])))`
- `team_clients_team_id_fkey`: `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX relationship_one_team ON public.team_clients USING btree (relationship_id) WHERE (state <> 'closed'::text);
CREATE UNIQUE INDEX team_clients_pkey ON public.team_clients USING btree (id);
CREATE UNIQUE INDEX team_one_enrollment ON public.team_clients USING btree (team_id, client_id) WHERE (state <> 'closed'::text);
```

- Policy `clients_scoped` (SELECT): USING `((client_id = identity.actor_id()) OR ((team_role(team_id) IS NOT NULL) AND ((coach_id = identity.actor_id()) OR (team_role(team_id) = ANY (ARRAY['owner'::text, 'admin'::text])))))`; CHECK `—`.

</details>

## public.team_group_members

Historical team group roster links retained for export.

- Prisma model: `team_group_members`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `group_id` | `uuid` | no | — | Linked group identity; scope and target are shown in the foreign keys below. |
| `client_id` | `uuid` | no | — | Linked client identity; scope and target are shown in the foreign keys below. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `team_group_members_client_id_fkey`: `FOREIGN KEY (client_id) REFERENCES team_clients(id) ON DELETE CASCADE`
- `team_group_members_group_id_client_id_key`: `UNIQUE (group_id, client_id)`
- `team_group_members_group_id_fkey`: `FOREIGN KEY (group_id) REFERENCES team_groups(id) ON DELETE CASCADE`
- `team_group_members_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX team_group_members_group_id_client_id_key ON public.team_group_members USING btree (group_id, client_id);
CREATE UNIQUE INDEX team_group_members_pkey ON public.team_group_members USING btree (id);
```

- Policy `group_members_scoped` (SELECT): USING `(EXISTS ( SELECT 1    FROM team_clients c   WHERE ((c.id = c.client_id) AND (team_role(c.team_id) IS NOT NULL) AND ((c.coach_id = identity.actor_id()) OR (team_role(c.team_id) = ANY (ARRAY['owner'::text, 'admin'::text]))))))`; CHECK `—`.

</details>

## public.team_groups

Historical team group definitions retained for export.

- Prisma model: `team_groups`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.team_assignments](schema.md#publicteam_assignments), [public.team_group_members](schema.md#publicteam_group_members).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `team_id` | `uuid` | no | — | Historical team scope; not an additional current institution. |
| `name` | `text` | no | — | Display name for this entity. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `archived` | `boolean` | no | `false` | Archived identity/draft flag; archival is not data deletion. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `team_groups_name_check`: `CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100)))`
- `team_groups_pkey`: `PRIMARY KEY (id)`
- `team_groups_team_id_fkey`: `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX team_groups_pkey ON public.team_groups USING btree (id);
```

- Policy `groups_team` (SELECT): USING `(team_role(team_id) IS NOT NULL)`; CHECK `—`.

</details>

## public.team_invitations

Historical team invitations referenced by lifecycle/account cleanup; no current team acquisition API.

- Prisma model: `team_invitations`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `team_id` | `uuid` | no | — | Historical team scope; not an additional current institution. |
| `email` | `text` | no | — | Account/invitation identifier; not verified by this deployment flow. |
| `role` | `text` | no | — | Historical team role; not a current role-switching control. |
| `token_hash` | `text` | no | — | One-way token hash; never the usable token. |
| `state` | `text` | no | `'pending'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |
| `accepted_by` | `uuid` | yes | — | Account that consumed the invitation. |
| `expires_at` | `timestamp with time zone` | no | `(now() + '7 days'::interval)` | Expiration instant. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `team_invitations_accepted_by_fkey`: `FOREIGN KEY (accepted_by) REFERENCES profiles(id) ON DELETE SET NULL`
- `team_invitations_pkey`: `PRIMARY KEY (id)`
- `team_invitations_role_check`: `CHECK ((role = ANY (ARRAY['admin'::text, 'coach'::text])))`
- `team_invitations_state_check`: `CHECK ((state = ANY (ARRAY['pending'::text, 'accepted'::text, 'revoked'::text])))`
- `team_invitations_team_id_fkey`: `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE`
- `team_invitations_token_hash_key`: `UNIQUE (token_hash)`

```sql
CREATE UNIQUE INDEX team_invitations_pkey ON public.team_invitations USING btree (id);
CREATE UNIQUE INDEX team_invitations_token_hash_key ON public.team_invitations USING btree (token_hash);
```

- Policy `invites_admin` (SELECT): USING `(team_role(team_id) = ANY (ARRAY['owner'::text, 'admin'::text]))`; CHECK `—`.

</details>

## public.team_members

Historical team roles used by existing record access/deletion rules.

- Prisma model: `team_members`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `team_id` | `uuid` | no | — | Historical team scope; not an additional current institution. |
| `user_id` | `uuid` | no | — | Global account subject. |
| `role` | `text` | no | — | Historical team role; not a current role-switching control. |
| `state` | `text` | no | `'active'::text` | Record lifecycle state; SQL constraints and the handler govern valid transitions. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `team_members_pkey`: `PRIMARY KEY (id)`
- `team_members_role_check`: `CHECK ((role = ANY (ARRAY['admin'::text, 'coach'::text])))`
- `team_members_state_check`: `CHECK ((state = ANY (ARRAY['active'::text, 'removed'::text])))`
- `team_members_team_id_fkey`: `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE`
- `team_members_team_id_user_id_key`: `UNIQUE (team_id, user_id)`
- `team_members_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX team_members_pkey ON public.team_members USING btree (id);
CREATE UNIQUE INDEX team_members_team_id_user_id_key ON public.team_members USING btree (team_id, user_id);
```

- Policy `members_team` (SELECT): USING `(team_role(team_id) IS NOT NULL)`; CHECK `—`.

</details>

## public.team_plans

Historical team-shared plan links retained with immutable versions.

- Prisma model: `team_plans`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.plans](schema.md#publicplans).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `team_id` | `uuid` | no | — | Historical team scope; not an additional current institution. |
| `contributor_id` | `uuid` | yes | — | Linked contributor identity; scope and target are shown in the foreign keys below. |
| `source_id` | `uuid` | yes | — | Referenced source identity. |
| `title` | `text` | no | — | Human-readable title. |
| `prescription` | `jsonb` | no | — | Immutable exercise/program prescription snapshot. |
| `archived` | `boolean` | no | `false` | Archived identity/draft flag; archival is not data deletion. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `team_plans_contributor_id_fkey`: `FOREIGN KEY (contributor_id) REFERENCES profiles(id) ON DELETE SET NULL`
- `team_plans_pkey`: `PRIMARY KEY (id)`
- `team_plans_source_id_fkey`: `FOREIGN KEY (source_id) REFERENCES plan_versions(id) ON DELETE SET NULL`
- `team_plans_team_id_fkey`: `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE`

```sql
CREATE UNIQUE INDEX team_plans_pkey ON public.team_plans USING btree (id);
```

- Policy `plans_team` (SELECT): USING `(team_role(team_id) IS NOT NULL)`; CHECK `—`.

</details>

## public.team_resource_shares

Historical team byte-sharing permissions retained for private file access/deletion.

- Prisma model: `team_resource_shares`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: No incoming SQL foreign key.
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Stable record identity; singleton tables constrain this to the one installation row. |
| `team_id` | `uuid` | no | — | Historical team scope; not an additional current institution. |
| `resource_id` | `uuid` | no | — | Linked resource identity; scope and target are shown in the foreign keys below. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `team_resource_shares_pkey`: `PRIMARY KEY (id)`
- `team_resource_shares_resource_id_fkey`: `FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE`
- `team_resource_shares_team_id_fkey`: `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE`
- `team_resource_shares_team_id_resource_id_key`: `UNIQUE (team_id, resource_id)`

```sql
CREATE UNIQUE INDEX team_resource_shares_pkey ON public.team_resource_shares USING btree (id);
CREATE UNIQUE INDEX team_resource_shares_team_id_resource_id_key ON public.team_resource_shares USING btree (team_id, resource_id);
```

- Policy `resource_team` (SELECT): USING `(team_role(team_id) IS NOT NULL)`; CHECK `—`.

</details>

## public.teams

Historical gym/team identity, distinct from the supported installation institution.

- Prisma model: `teams`; domain: Historical compatibility; treatment: **retain-history**.
- Direct server source references: No literal server reference; retained SQL/reference/export dependencies are described in the audit..
- Referenced by: [public.business_accounts](schema.md#publicbusiness_accounts), [public.support_cases](schema.md#publicsupport_cases), [public.team_activity](schema.md#publicteam_activity), [public.team_clients](schema.md#publicteam_clients), [public.team_groups](schema.md#publicteam_groups), [public.team_invitations](schema.md#publicteam_invitations), [public.team_members](schema.md#publicteam_members), [public.team_plans](schema.md#publicteam_plans), [public.team_resource_shares](schema.md#publicteam_resource_shares).
- Access: RLS enabled; guest SELECT false; user SELECT true; server SELECT false. Grants alone never publish an HTTP operation.

| Field | PostgreSQL type | Nullable | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Stable record identity; singleton tables constrain this to the one installation row. |
| `owner_id` | `uuid` | yes | — | Owning account/member identity; see its scoped foreign key. |
| `name` | `text` | no | — | Display name for this entity. |
| `archived` | `boolean` | no | `false` | Archived identity/draft flag; archival is not data deletion. |
| `revision` | `integer` | no | `1` | Optimistic record revision checked before edits. |
| `created_at` | `timestamp with time zone` | no | `now()` | Record creation timestamp. |

<details>
<summary>Relationships, constraints, indexes, policies and triggers</summary>

- `teams_check`: `CHECK ((archived OR (owner_id IS NOT NULL)))`
- `teams_name_check`: `CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100)))`
- `teams_owner_id_fkey`: `FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL`
- `teams_pkey`: `PRIMARY KEY (id)`

```sql
CREATE UNIQUE INDEX teams_pkey ON public.teams USING btree (id);
```

- Policy `teams_members` (SELECT): USING `(team_role(id) IS NOT NULL)`; CHECK `—`.

</details>
