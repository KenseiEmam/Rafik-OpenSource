# Design and architecture contract

Reading this as: a complete fitness-product rebuild for coaches and their clients, with calm, precise visual language and immediate useful training.

DESIGN_VARIANCE: 6. MOTION_INTENSITY: 3. VISUAL_DENSITY: 4. Clear left-aligned content, one green accent, Manrope and Noto Sans Arabic, light/dark semantic tokens, tabular workout numbers. Public imagery is generated lifestyle photography, not a claimed customer or movement demonstration. Preserve the supplied Rafik mark. Product UI uses top navigation, focused task pages and inline controls rather than a dense generic dashboard.

The requested design-taste skill guides public surfaces; redesign-existing-projects supplies a review checklist for typography, clarity, states and navigation. Their preservation/targeted-patch defaults are superseded by the founder's explicit clean-rebuild direction. Neither skill changes the chosen Vue/Supabase stack or authorizes fake testimonials, metrics or customer activity.

## Contracts that connect backend and UX

- Preview works without identity. A private assignment requires verified access. No global profile wizard.
- One verified Auth UUID is the person. A coach/client relationship is explicit and does not require an organization.
- Draft save and publication are distinct. Session prescriptions are snapshotted and never rewritten by later publication.
- Only explicit start, save and completion commands write training state. Opening a page does not create activity.
- Save feedback distinguishes durable device storage from server acknowledgment. Queued requests carry stable operation IDs; conflicts preserve the local draft.
- Session start is unique for assignment/local-day/day-slot. Two different session slots may occur on the same day.
- Review is a contextual note on a real completed result. It is not a notification engine or messaging platform.
- Only sample content and synthetic local accounts are seeded. No legacy data or cloud integrations are needed.

## Design verification matrix

Check public preview, email entry/code, wrong invite account, empty Today, starter plan, editing/publishing, invitation link, workout entry/rest/resume/finish, history, review, settings, help and 404. Inspect at desktop and phone widths, Arabic RTL and both themes. Exercise loading, offline, invalid values, failed save, stale edit and account switch. Run browser accessibility checks plus keyboard/focus inspection. Native-device hardware verification remains distinct from browser emulation; no mobile-app work belongs here.
