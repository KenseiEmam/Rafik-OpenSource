# R10: Scoped communication and notification delivery

Local implementation contract, 23 September 2026. No outbound provider, hosting or native push.

## Organization communication

Organization channels are explicit group spaces, separate from independent direct coach/client conversations. A channel has named current participants and managers, an immutable message history, per-person observed read sequence, and the same persisted exact-command recovery as other organization writes. Organization admins manage channel membership but gain message access only by joining explicitly; joining is visible to participants. Trainers can create channels only for themselves and their current assigned trainees. Trainees cannot discover other channels or other organizations. Deactivated memberships lose channel access before command replay. Removed channel participants lose access; history stays with the organization. Participant changes do not silently subscribe new members to earlier external alerts. A group channel does not expose personal files or unrelated coaching history.

The conversation UI uses a compact phone list/detail flow, bounded search and latest/older pages, real unread counts, name/date labels and reachable drafting. No broad organization-global feed, client-acquisition promise, automated message multiplication or live-presence claim.

## Notifications

One personal notification inbox contains generic prompts with authorized links and explicit organization/independent context. Supported categories are messages, feedback, check-ins and calendar changes/reminders. In-app read state is separate from delivery state. Preferences are per person/category, with optional intercepted-email opt-in and quiet hours in the saved profile timezone. Authentication codes remain separate from optional reminders. External preview text contains no message, result, note, client name or health detail.

Capture a bounded notification intent in the same transaction as authoritative changes. The local dispatcher scans due reminders in bounded batches, suppresses stale/cancelled/revoked items, honors preferences and quiet hours, deduplicates by source event/recipient, and retries with bounded backoff. The local sink has a stable idempotency key; acknowledgment loss cannot create a second sink record. It does not send mail. The domain command does not wait for a provider. A single guarded CLI dispatches; hosting later selects one mechanism and real adapter after separate acceptance.

Keep notification retention bounded without deleting message/workout/result history. Links recheck current audience and return to the authorized context after sign-in. Cancelled/obsolete reminders must never be presented as actionable after refresh.

## Acceptance

Two organizations, unrelated independent identities, combined roles, removed participants/staff, exact send/read retry, long names/messages, phone list/back/search/older pages and drafts. Intent/domain atomicity, duplicate dispatch, lost sink acknowledgment, retry exhaustion, opt-out, quiet hours/timezones, cancelled appointments and answered forms, account export/deletion, generic preview privacy and correct post-login destination. Browser emulation and local interception are explicitly not real-device or external-delivery evidence.
