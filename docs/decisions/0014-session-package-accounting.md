# ADR 0014: Derive session entitlement balances from calendar outcomes

Status: accepted, 28 September 2026.

The founder requires reservation at booking, consumption at completion, cancellation release, individual no-show decisions and truly independent trial/makeup/prize sessions. A second mutable balance or scheduling service would create reconciliation and retry hazards.

Store organization-owned package entitlements and a same-tenant/same-member funding reference on each calendar participant. Derive reserved/used/available from event and attendance state. Check capacity after tentative booking/correction inside the existing serialized workspace transaction; any failure rolls back the whole series and receipt. Independent rows have no package reference and never enter the balance.

Keep current-membership/roster checks before receipt replay. Use explicit revisions and audit reasons for allowance/completed attendance corrections. Renewal creates a new linked entitlement, not transferred unused sessions or proof of payment. No-show outcomes remain staff choices. This adds scoped tables and constraints, not a billing engine or background reconciliation worker.
