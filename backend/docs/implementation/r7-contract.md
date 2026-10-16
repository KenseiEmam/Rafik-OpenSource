# R7 — Daily workspace contract

This is an incremental local checkpoint, not final organizational scope. The universal coaching/training selector and R4 team assumptions are superseded as the target by [ADR 0005](../decisions/0005-organization-and-independent-scopes.md); R7A must derive contexts/capabilities from actual memberships.

The workspace uses the existing data owners and commands. Migration 010 adds read projections, not a stored task subsystem.

## Behavior

- Four phone destinations: Today, Clients/Progress, Messages and More. Desktop retains the specialist links. More exposes programming/exercises/check-ins/history alongside service tools; no existing route is removed.
- A labelled workspace selector keeps both coaching and personal training available. The active choice is remembered per account for a subsequent sign-in without an explicit destination; explicit invitation/deep-link destinations take precedence.
- Coach Today reads oldest-waiting workout reviews, submitted check-ins and unread conversations in one ordered queue. Every item identifies the client. Filters are encoded in the URL, reviews preserve the return filter, and a saved workout review offers a direct return to the queue. Opening a review does not mark it reviewed; reading a conversation retains its existing read-cursor semantics.
- Client Today obtains active assignments and their exact versions plus the latest feedback. Scheduled training shows today first, with an explicit upcoming-schedule toggle; flexible assignments retain their choices. Local in-progress work remains first. Appointments appear alongside training.
- Roster search/state are URL-backed. Server keyset pages contain at most 12 clients and active assignments, with an accurate matched total. Search covers the entire authorized roster. Client workspace tabs are URL-backed and its roster return preserves filters.

## Read contracts

`coach_attention(kind, after_time, after_key, limit, search)` returns at most 50 items (UI requests 12), a matched total, active client count and owned-plan count. Cursor order is `(happened_at, key)` ascending. Refresh restarts at the beginning; concurrent changes may alter the queue. It does not mutate reviews or reads.

`coach_roster(search, state, after_name, after_id, limit)` returns a page sorted by lowercased display name and UUID, matching literal case-insensitive substrings. A rename can move a client between pages; refresh is the way to obtain a new current view. The UI prevents stale search responses replacing a newer query.

`client_today()` returns the current caller's relationships, active assignments, only referenced plan versions, coach display names and at most one feedback summary. This avoids downloading the whole session history. Number of active relationships is not artificially capped.

All three functions execute as the invoker under existing RLS and explicitly scope identities; only authenticated users can call them. No authorization is inferred from UI visibility.

## Ownership and remaining consolidation

Web `src/features/workspace` owns navigation and attention types; `src/styles/workspace.css` owns the new shared workspace/daily layouts. Obsolete global navigation rules were removed. Existing public and workout styles remain in `style.css`; this is an incremental extraction, not a claim that the entire stylesheet is modularized.

New browser scenarios use disposable test identities. Older suites still use original sample accounts; completing their isolation and restoring a curated demo belong to R11 and remain outstanding. Invitation/version reads and secondary pages still have broader reads; those are not claimed to be server-paginated by R7. Scroll/focus restoration beyond the existing browser Back behavior also needs continued review in connected service tasks.

See the ledger/verification for actual acceptance results. Native, physical-device, hosted and human usability gates remain distinct.
