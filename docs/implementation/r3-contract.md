# R3 service delivery contract

Local implementation, 22 September 2026. Execution owner: Codex. Preserve the R1/R2 runtime, data and accepted design. No hosted/native work or external delivery.

## Nutrition

Optional coach guidance and manual meal recording; no automatic calorie prescription, food AI or external database. Guidance is an immutable version per relationship with an effective client-calendar date, optional kcal/protein/carbohydrate/fat targets and written meal guidance. Changes apply today or later, never rewriting prior versions. A latest applicable version is shown for the selected date. Reusing a coach's guidance copies values into a new relationship-owned version.

Clients own meal entries and reusable foods. An entry is personal or explicitly shared with one relationship; it snapshots name, amount basis, unit, nutrient values and provenance. Updating a saved food cannot rewrite an old meal. Quantity is explicit in g, ml or servings; nutrients refer to a stated base quantity. Unentered nutrients remain unknown, not zero. Summaries show known totals and incomplete-record counts. Corrections/removal are revision checked. No new signup fields.

## Appointments

Appointment availability is distinct from workout schedules. A coach publishes one slot or a bounded series (up to eight weekly/fortnightly local times), with IANA timezone, duration and meeting details. Instants are stored in UTC; the UI displays the selected viewing timezone and the original offer timezone. DST-invalid local times are rejected; ambiguous local times use Postgres's standard-time interpretation and the UI previews the resolved instant.

A booking belongs to one active relationship and one open slot. Participant locks serialize collision checks across both coach and client calendars. One booking command UUID cannot create two appointments. Clients book; either participant can reschedule to another open slot of that coach or cancel an upcoming booking. Coaches record attended/missed only after the appointment ends; this never completes a workout. Withdraw only unbooked availability. Archiving a relationship blocks new booking/rescheduling but permits cancellation and preserves history. External calendar/video providers and reminders remain deferred.

## Private resources and conversation attachments

Enable local Supabase Storage, one private bucket, at most 10 MiB per file; PDF, plain text, JPEG, PNG and WebP only. A resource has an owner and explicit relationship shares. Upload is register → immutable object upload → finalize after metadata verification. Pending uploads are visible only to the owner and can be retried/finalized or removed. Replacing a file means a new resource; no overwrite policy.

Participants can share owned ready resources with their active relationships. Conversation attachment sends verify both participants have access. Downloads use authenticated Storage API requests, not public URLs. Revocation stops subsequent downloads; a previously downloaded copy cannot be revoked. Text coaching continues if storage fails.

Deletion first retires metadata (revoking shares), then deletes bytes via Storage API, then removes metadata once the object is absent. Partial failure remains recoverable. Account deletion requires owned-resource cleanup first; never orphan bytes by deleting only SQL metadata. Export includes resource metadata/shares, not file bytes. No virus-scanning or content-authenticity claim.

## Implementation and verification

New domains: nutrition_guidance, saved_foods, meal_entries, appointment_slots, appointments, resources, resource_shares. Storage manages its own schema; public metadata and explicit commands own product behavior. No generic workflow engine or new worker. A single More hub exposes optional tools; upcoming appointments appear on Today only when relevant.

Verify snapshots, units/unknown totals, ownership/sharing, stale updates/retries, UTC/DST conversion, cross-client double booking, reschedule/cancel/attendance, file size/type/path isolation, upload/download/revoke/delete recovery, account cleanup and existing regressions. Include real local Storage HTTP tests, clean-schema verification, English/Arabic, phone/desktop and light/dark renders. Update READMEs, changelogs, maintainer guide, architecture, runbook, ledger and evidence with actual results.

Storage implementation references checked against the installed SDK and official [access-control](https://supabase.com/docs/guides/storage/security/access-control) and [deletion](https://supabase.com/docs/guides/storage/management/delete-objects) documentation. Delete bytes through the API, never by deleting storage.objects directly.

## Explicit command surface

All commands below run as the signed-in person; a passed relationship is verified against that identity. `p_revision` is the caller's last acknowledged revision (zero for a new editable record). Stable UUIDs belong to the persisted draft/command, not to each retry.

| Command | Payload and result |
|---|---|
| `save_nutrition_guidance` | ID, relationship, latest revision, effective date, targets object, text → new immutable guidance version |
| `save_food` / `archive_food` | ID, name, basis, unit, nutrients, source, revision → editable owner food; archive uses ID/revision |
| `save_meal` / `remove_meal` | ID, optional relationship, date, meal category, explicit snapshot object, revision → actual record; removal uses ID/revision |
| `availability_preview` | Local timestamp, IANA zone, duration, count, interval days → resolved local/UTC instants |
| `publish_availability` | Stable series UUID plus preview fields, title and meeting details → concrete slots |
| `withdraw_availability` | Owned slot UUID → withdraw only if unbooked |
| `book_appointment` | Stable booking UUID, relationship and open slot → one appointment |
| `change_appointment` | Appointment UUID, revision, action, optional new slot, note → reschedule/cancel/attend/miss |
| `register_resource` | Stable UUID, title, filename, MIME type, byte count → pending resource and assigned path |
| `finish_resource` | UUID → ready only after stored size/type metadata agrees |
| `share_resource` | UUID, relationship, explicit boolean → add/revoke share idempotently |
| `retire_resource` / `remove_resource_record` | UUID/revision → retired; after Storage API deletion, UUID → remove metadata |
| `send_message` | Existing text/context payload plus optional resource UUID → immutable message with validated attachment |
| `delete_my_account` | Exact `DELETE` confirmation → refuse while owned resources remain, otherwise delete account and free future client slots |

`can_read_resource` and `can_upload_resource` are policy helpers, not alternative product workflows. Upload authorization holds a share lock on the pending registration row; retirement takes an update lock. Resource registration and account deletion serialize on the owner's profile. Ordinary users receive no direct public-table mutation grants and no Storage overwrite grant.

Primary recoverable errors: `conflict`, `relationship_archived`, `time_unavailable`, `slot_booked`, `invalid_local_time`, `appointment_unavailable`, `upload_incomplete`, `resource_unavailable`, `file_cleanup_required`. Numeric/date/type validation rejects malformed input before publication. Calendar transport failures preserve the exact pending request; confirmed rejection permits correction. Nutrition drafts retain IDs/snapshots; pending files expose finalize/reselect/delete recovery rather than pretending bytes are saved locally.
