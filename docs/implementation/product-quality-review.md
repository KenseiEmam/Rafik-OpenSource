# Product quality review

23 September 2026. This review responds to the reported Messages usability defects and audits the implemented web product before the R5 checkpoint. Preserve Manrope/Noto Arabic, the restrained green palette, semantic controls and existing route structure. No decorative rebrand or added UI framework.

## Method and evidence

Inspected source and rendered coach/client journeys with populated local records. Captured 26 routes at desktop 1440px and phone 390px (52 baseline layouts), including Today, client workspace/roster, plan editor, catalog, check-ins, progress, Messages, nutrition, appointments, resources, teams, business, support and settings. Checked direct screenshots for task hierarchy and realistic content, not just horizontal overflow. Raw baseline artifacts are local ignored `RAFIK-FRONTEND/artifacts/r5-audit-*`; the verification record describes final regression/render evidence.

The existing preview contains accumulated synthetic regression records. That made long-list defects visible, but it is not representative customer data or a human usability study. Fresh temporary-account integration scenarios complement it and clean up after themselves.

## Findings and changes

| Finding | User impact / reproduction | Resolution |
|---|---|---|
| Messages used ordinary document flow for history and composer | At 390×850 the composer began at y=1171; even desktop started at y=952. Long history makes replying increasingly difficult. | Bounded inbox/thread workspace; history scrolls independently; compact composer remains reachable. |
| Phone error state could make a visible Send button untappable in WebKit | A context validation error expanded the thread beyond its clipped container. | Put actionable error copy inside the composer’s bounded scroll area; allow history to shrink. The actual retry/tap scenario is regression-tested. |
| Phone conversation list was a horizontal strip above the full thread | Contacts, introductory copy and refresh consumed most of the first screen; no clear return to inbox. | Phone inbox/thread views with explicit back navigation; desktop split view; searchable names and clear no-match state. |
| Attachment selector/upload link always occupied the composer | A simple text reply required scanning optional controls. | Attachment controls are disclosed on demand and open when a file is already linked. |
| Background refresh marked messages read while reading older history | Unseen incoming messages lost their unread state. | Preserve scroll position, show a new-message action, advance read cursor when the latest history is viewed. |
| A recovered text draft could override a newly opened workout/file context | Discussing new work could attach an old draft context. | Explicit newly opened context takes precedence over an ordinary draft; an unconfirmed pending send keeps its exact original command. |
| Focus was restored before the composer became enabled after send | Keyboard users could not continue typing naturally. | Enable first, then focus after Vue's DOM update; tested explicitly. |
| Today put up to five check-ins ahead of the workout | Optional work displaced the core daily action, especially on a phone. | Training/resume remains first; optional activity follows, with two client requests and an all-requests link. |
| Check-in request/template lists grew without a practical boundary | The populated phone page reached 14,370px and buried scheduling. | Search and 12-request pages; newest-first response history; direct scheduling link; searchable bounded template list. |
| Plans had no search; coach review rendered every pending result | Repeat work becomes harder as records accumulate; archived-only plan collections appeared blank. | Plan search and incremental results, bounded review list with explicit expansion, corrected empty-state condition. |
| Nutrition showed a food-record empty state before choosing a client | Implied absence of meals without any selected person; coach copy referred to “you”. | Explicit choose-client state; coach-specific shared-record wording. |
| Resource empty-state copy addressed a coach as their own client | Role confusion about who should upload/share. | Coach-specific upload/share guidance. |
| Team invitation inherited unrelated workspace navigation | A signed-in staff invite looked like a client workflow. | Invitation route is excluded from ordinary workspace navigation. |
| Engineering docs depended on phase history and contradicted current capabilities | New engineers had to reconstruct the system and could make incorrect assumptions. | Documentation index, contributor workflow/definition of done, ADRs, API conventions, release gate; removed stale scope claim and added local-link checks. |

## Feature-family assessment

- **Entry/account/privacy:** existing real Auth/invitation/guest-adoption flow retained. Local sample access stays explicit. Export and destructive deletion remain distinct actions. Existing browser/database/HTTP lifecycle tests cover the boundary; actual hosted email delivery is not verified.
- **Daily training/history/review:** preserve the focused logger, explicit targets, device/cloud distinction, interruption recovery and correction. R5 alternatives must update actual identity everywhere without rewriting targets or duplicating completion.
- **Coach programming and roster:** keep the existing client workspace tabs, schedule preview and explicit publish/assign distinction. Search/bounded collections address growth. Alternative choice is optional and uses the existing editor rather than a second builder.
- **Progress/measurements/check-ins:** separate actual trends/units and optional personal sharing. Fix request navigation/list growth; preserve response revision/review lifecycle and recoverable drafts.
- **Communication:** structural redesign above; test populated history, paging, unread, draft navigation, dropped acknowledgement, contextual links, archived state and private attachments.
- **Nutrition/booking/resources:** retain optional tools and explicit audience/units/timezone. Fix unselected and role-specific copy. Real local Storage/revocation, booking conflicts and retry tests are necessary in addition to page rendering.
- **Teams/groups/handoff:** retain fixed roles, explicit consent and reviewed bulk selection. Verify copying exercise alternatives as independent receiving-coach content. A team membership must not expose private individual coaching history.
- **Business/support:** local commercial simulator/support limits remain visible and honest. Existing platform/team case audience and ownership tests remain required. Real billing/support staffing are release concerns, not inferred from a demo.

## Durable standard and remaining evidence

Both AGENTS files now require the shared contribution definition of done: user task and failure/recovery first; vertical implementation through storage, authorization, review/history/analytics; actual rendered review; matching documentation; honest completion claims. Tests supplement judgement rather than replace it.

No source review or automated suite can establish that every possible user interaction is correct. Physical keyboards/touch devices, assistive technology, hosted operational behavior and observed unaided use remain release gates. Record any discovered defect as a concrete reproduction and fix/test it before declaring that journey complete. Do not turn business discovery into a substitute for product implementation.

## R6 correction: mobile inbox acceptance was missed

The user's screenshot disproved R5's broad responsive acceptance. Reproduction at 390×844 showed 250px conversation rows and a 478px inbox inside a 352px available area. An obsolete phone `flex: 0 0 250px` rule originally sized horizontal cards; R5 changed the parent to a vertical list without clearing that basis. The mobile grid's automatic minimum and inbox intrinsic width let long names widen the column. The outer rounded `overflow: hidden` hid the defect from the document-overflow assertion.

Process causes: R5's dedicated journey had one short-name contact; the layout matrix used one tall viewport height and Chromium only; generated inbox screenshots were not directly inspected with long contact names. Selected-thread checks and passing Axe scans did not cover inbox usability. The earlier claim of complete local quality acceptance was too broad.

Corrections: delete obsolete horizontal-list rules; use a zero-minimum grid track/inbox, intrinsic-height rows and a bounded vertical list; restore wrapping workspace navigation. Add temporary multi-contact long-name fixtures, explicit row-height/containment assertions, short/tall/landscape/live-resize cases and both browser engines. The shared layout checker inspects internal clipping as well as document overflow. Full-product audit also found WebKit native select text overflowing the roster and Arabic resource filter; constrain/truncate the displayed selection while preserving the full native option menu.

Maintenance review found the runbook's opening verification section still described three migrations/93 assertions despite appended phase updates. It now describes the current nine migrations/six suites/229 assertions. Both AGENTS files and the contribution workflow require state-based render evidence and current, non-append-only maintenance documentation.

See the R6 verification record for the final executed matrix, feature-family coverage, inspected renders and remaining limits. These checks reduce recurrence risk; they do not establish that every possible state or physical device is defect-free.

Additional R6 verification findings: the native select fixes removed WebKit overflow in the client roster and Arabic Resources filter; the roster now renders twelve records at a time with whole-roster search and load-more. A full-suite Axe failure caught temporary low contrast while foreground/background theme colours interpolated; the interpolation was removed without disabling the accessibility check. Release checks also exposed hashing before final bundler transforms and a stale registration after failed first installation. The implementation now hashes final emitted files and permits a fresh registration on retry; real-build and browser fault tests cover these paths.

The local SQL launcher previously called `process.exit()` immediately after writing buffered output. Piping it into the release runner could truncate logs even though Postgres completed successfully. It now sets the exit code and lets streams drain. A piped rerun retained all 229 PASS notices and all six transaction rollbacks.

## R9 rendered review

The 104-state service matrix reported no overflow or checked Axe failures, but actual phone capture inspection still found scaled SVG labels too small to read. Moved range/date labels into normal-size HTML and kept the plot at a useful height. This demonstrates why passing geometry/accessibility scans do not replace visual inspection. A timezone datalist nested in its label also polluted exact accessible naming; suggestions now sit outside the label. Group editors expose removal of unavailable prior members; staff reassignment removes inactive staff from the new proposed selection. Result recovery clears the exact persisted participant draft, not whichever participant happens to be selected after reload.
