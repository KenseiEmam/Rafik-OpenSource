# Product and UX blueprint

This is a complete redesign specification for the proposed core, not validated customer demand or an implemented prototype. The founder's account makes activation and immediate usefulness the starting point. The business recommendation is an existing-plan workout companion distributed through coaches who already have clients; document 00 explains the alternatives and the evidence needed to choose differently.

**Sequence requested by the founder:** finish this analysis and the architecture/business plan first, then design and prototype. Future visual work will use `design-taste-frontend` instead of `frontend-design`. That skill explicitly scopes itself to marketing/landing-page work rather than dashboards or native apps: apply it fully to Rafik's public pages and use its relevant visual principles alongside product interaction and established product interaction conventions for the application. Use Vue/TypeScript for the fresh web product unless an evidence-backed requirement changes that choice; the skill's default stack is not a migration instruction. Work locally on `codex/revamp`. Mobile-app work is deferred until the web/backend is revamped and ready.

## 1. Define the product in one sentence

**Rafik helps coaches give each client a clear training plan, see what actually happened, and respond where it matters.**

The client promise is equally direct: **Open Rafik, see today's training, record what you did, and get guidance from your coach.**

“Fitness Squire” can remain brand language, but it should not carry the burden of explaining the product. Avoid guarantees of performance improvement and generic “all-in-one” claims. Show the real plan, logging experience, and coach response.

## 2. Choose the first customer deliberately

| Candidate | Fit with existing work | What the pilot would need | Recommendation |
|---|---|---|---|
| Independent coach with an existing roster | Plans, client management, workout logging, chat | Import one existing plan, share, log, review; simple paid continuation | Recommended narrow experiment, with no lead-generation promise; the earlier generic coach beta did not validate it |
| Small coaching team or one club | Existing organization roles and groups | Same core plus a roster and coach assignment | Conditional extension if the same workflow serves a committed operator; avoid team administration in the proof |
| School/varsity program | Current homepage's stated audience and assessments | Buyer/procurement discovery, readiness and appropriate consent/access arrangements, cohort operations | Select only with an engaged institution; validate required safeguards before enrolling minors |
| Uncoached consumer | Existing workout content and logging | Useful starter session, return reason and distribution | Small comparison test using the same starter slice; defer a separate consumer platform |

The deciding evidence is access to customers with a painful recurring job and a willingness to change tools. Introductory meetings and downloads alone have already failed that test. Record the selected buyer, end user, acquisition channel, top three jobs, and explicit exclusions on one page. Do not wait for this research to address broken routes, misleading feedback, unreadable controls or excessive setup: those defects are established independently.

Trainerize already advertises workout, nutrition, and habit coaching; Everfit offers workout programming and client progress tracking. Those basic capabilities alone are not a persuasive differentiation. A candidate advantage for Rafik is a simpler Arabic/English coaching experience with reliable gym-floor logging and local onboarding support. That advantage must be demonstrated through task tests and pilot purchases. [Trainerize](https://www.trainerize.com/independent-trainers/), [Everfit](https://everfit.io/training/).

## 3. Decide what belongs in the first release

| Capability | Decision | Simplified form | Re-entry condition for deferred work |
|---|---|---|---|
| Coach/client authentication | Rebuild | One session lifecycle; invitation-aware sign-in | Core |
| Client invitation and roster | Rebuild workflow | Invite client; resend/cancel; clear pending/active status | Core |
| Exercise library/media | Keep and curate | Search by name/equipment; recent exercises | Core; audit asset rights and broken media |
| Program builder | Keep domain, redesign UI | Templates, days, exercises, sets/reps/load, preview and assign | Core; advanced prescription controls progressively disclosed |
| Client plan and workout logging | Rebuild critical path | Today, start, record set, resume, finish | Core; offline durability is required |
| Check-ins and progress | Simplify | History/last performance in the proof; one short check-in in the funded pilot | Add check-ins when coaches use the review loop; bespoke form builder later |
| Direct messaging | Conditional | A session note and coach response first; no old conversation import | Full inbox only if moving communication into Rafik helps the pilot |
| Nutrition | Conditional | Exclude from the initial core; later optional coach-set habits if useful | Build further only if pilot users repeatedly need it |
| Calendar/booking | Conditional | Upcoming session and simple reschedule | Full recurring/bulk booking only if the selected service depends on it |
| Organization roles/groups | Defer | Simple direct coach/client relationship first | Add organizational controls when a buyer needs them |
| Assessments/templates | Defer most customization | One agreed pilot assessment only if essential | Repeat usage and a named buyer requirement |
| Marketplace and public reviews | Defer | Clients join their own coach | Evidence of both coach supply and client discovery demand |
| Entitlement packs/auto-reroll | Retire from new UX | Simple later paid offer, outside the training flow | No legacy-credit migration and no replacement credit-trading system |
| AI chat/RAG and food estimation | Defer | Direct coach contact; manual/catalog entry | Proven task benefit, provenance, isolation, evaluation and cost ceiling |
| Trophies and rankings | Defer | Personal progress and completion acknowledgement | Evidence of retention benefit without misleading comparisons |
| Custom support-ticket product | Simplify | Help entry and one existing support channel | A real support volume justifies an in-app ticket interface |
| Health integrations | Defer until after web/backend readiness | Consider only in a later native phase | Measured demand and successful native-device tests |

“Defer” means do not carry the feature into the new product. The founder confirms the old product is inactive and legacy compatibility/data migration are unnecessary. The new UX is a clean replacement. Old resources can remain untouched during local construction; retirement is a later bounded operational task.

## 4. Information architecture

### Coach workspace

**Today → Clients → Plans; Inbox only when in-app messaging is retained.** Put workspace settings, billing, exercise-library maintenance, and help in secondary navigation. For a team, add a roster filter rather than a separate parallel product shell. In the first proof, a client list, a plan and its result can be sufficient; do not build empty navigation destinations to resemble a mature SaaS product.

Today is a short work queue: unanswered client messages, check-ins awaiting review, missed planned sessions, and clients without a next plan. Show why an item appears and when the underlying data last synced. Completing a review removes it from the queue; it should not return without new evidence.

A client's page has Overview, Plan, and History, with a contextual message action. Overview answers “How is this client doing?” using scheduled versus completed activity and recent feedback. Avoid “overall performance” until its definition is meaningful and agreed. Missing data is labeled missing, not zero effort.

Plans distinguish reusable templates from client assignments. A coach can duplicate a template, adapt it, preview the client's view, then assign. One explicit revision action controls which future sessions change.

### Client app

**Today → Progress → Coach**, as those capabilities are introduced. The proof starts with the workout and its history; a contextual coach action can precede a separate Coach tab. Profile/preferences live under the account menu. Today shows the next assigned session, estimated time where available, a single primary action, and a compact check-in reminder when applicable. On a rest day, explain the plan without pretending a workout was completed.

Progress shows personal session history and selected trends; it does not rank clients against each other. Coach contains messages and completed/pending check-ins. Food or booking gets its own navigation position only if its daily use in the selected cohort earns that space.

## 5. Redesign the complete journeys

### Journey A — A coach gets to first value

1. Show a real, labeled sample of the client experience before asking the coach to configure a business profile. Explain that Rafik helps deliver training to existing clients.
2. Offer manual setup of their first existing plan during the pilot. Alternatively, let them try a starter draft. Do not require learning a blank builder before they can assess value.
3. Authenticate to save/share private work; create the simple coach profile with a display name and editable locale/timezone defaults. Reuse an existing new-system account when present; no workspace-configuration step.
4. Add the client's contact, choose the plan/start date, and preview exactly what the recipient can see. “Share routine” publishes a non-private template; “Invite client” protects the personal assignment. Keep those meanings explicit.
5. Send the invitation; show Pending, delivery status, resend and cancel. On acceptance, show the client and next session. Profile marketing fields and optional billing setup follow demonstrated value.

**Acceptance target:** at least four of five representative coaches can invite and assign unaided in five minutes using a provided starter plan. This is a proposed usability target, not a current measurement.

**Recovery:** invitation email failure does not lose the assignment; retries do not duplicate it. An existing account joins the intended coach context without a second account. Expired or revoked invitations explain the next action. An email mismatch requires an explicit account switch or new invite.

### Journey B — An invited client sees their plan

1. Open a link on phone or desktop. A public reusable routine shows duration, equipment, exercise list and “Try this workout” immediately. An invitation to a private plan shows public coach identity and explains why verification is needed.
2. A sample/guest workout can start before an account, with device-local progress and clear limits. Private assignments require authentication; preserve the invitation through email confirmation. Do not expose a client's name, health notes or personalized prescription on a public preview.
3. Ask only for information necessary to deliver that particular service. Optional diet, body-composition, photo and notifications wait until relevant. Where individualized coaching needs readiness information, explain the purpose and keep it separate from marketing profile completion.
4. Open directly to the assigned workout. Offer account-backed history/coach connection to a guest at a meaningful point, preserving their local work on successful signup.

**Recovery:** make the browser flow useful without installation. Validate a responsive web logger in the first slice before committing to rebuilding the native client as well; the architecture plan defines that decision. A returning user should not repeat onboarding. A no-program state says who is preparing the plan and offers contact, with an explicitly separate public sample if useful.

### Journey C — Log a workout in a real gym

1. Today displays the session and an honest availability state.
2. Start downloads the prescription and necessary text data for the session. Videos may stream; text and logging must still work if video fails.
3. Each exercise shows prescribed sets/reps/load, a short instruction, and previous actual performance when available. Use numeric keyboards and explicit units.
4. Logging a set acknowledges a local durable save immediately. Background synchronization has a visible status; ordinary recording does not open a modal.
5. Pause/leave/terminate the app and resume the same session. Finish gives a concise summary and optional note; double taps cannot create duplicate completion.
6. A failed sync leaves an actionable “Saved on this device; waiting to sync” state. The coach sees completion only after server acknowledgement.

**Recovery:** edits to a plan cannot rewrite a started session's prescription or completed history. A session completed offline can sync after the assignment expires or is archived if the verified participant had legitimately started it; define a bounded policy and audit it. Account switching must not attach one client's pending data to another.

### Journey D — Review and adjust

1. A coach opens Today and sees sessions/check-ins needing attention, sorted by actionable recency.
2. Open a client with planned work, actual sets, and their note together.
3. Reply, acknowledge, or adjust the next plan revision. Show the effective date and affected future sessions before publication.
4. Notify the client once with a direct link to the update. Previously completed sessions remain unchanged.

**Acceptance target:** four of five coaches locate a missed session and make an appropriate next-plan adjustment unaided within three minutes in a seeded scenario.

### Journey E — Account and support recovery

Password/session recovery, wrong-account invitations, archived plans, subscription grace periods, export, and deletion must be designed with the happy path. Clients retain access to their own historical records under the agreed retention policy even when active coaching ends. Deletion previews what will be removed versus retained for an established obligation; server authorization cannot rely on the submitted user ID.

## 6. Screen-level design specification

The check-in and full inbox rows are conditional extensions, not required destinations in the initial navigation. The core uses session notes/review and no general form or messaging platform.

| Screen | Primary content and action | States that must be designed |
|---|---|---|
| Landing | One audience, real product example, clear coach start/client sign-in | Mobile navigation, language switch, valid policy/help links |
| Coach Today | Actionable clients with reasons; review next item | First-use setup, all caught up, stale/offline data, load failure |
| Clients | Name, assignment, last meaningful activity; invite | Empty, pending, active, archived, filtered no-match, pagination |
| Plan editor | Day list and exercise editor; preview/assign | Draft, saving, saved, invalid prescription, failed save, revision conflict |
| Client Today | Next workout; start/resume | Waiting for coach, future session, rest day, in progress, completed, no connection |
| Set logger | Prescription/previous result and actual values; log set | Pending local write, saved locally, synced, retry, invalid units, unavailable video |
| Check-in | Small agreed question set; submit | Due, draft, submitted, reviewed, interrupted, validation error |
| Progress | Personal history and explainable trends | No records yet, sparse data, date-range filtering, updated/corrected record |
| Inbox | Contextual coach/client messages | Empty, sending, failed/retry, unread, attachments unavailable |
| Settings | Language, units, reminders, account, help | Saving, failure, export pending/ready, deletion confirmation |

## 7. A small design system

- **Foundations:** semantic colors for canvas, surface, primary/secondary text, action, border, success, warning, and error. Gold is an accent with a tested foreground, not a global SVG/text rule. Keep the existing identity where it helps recognition.
- **Typography:** one readable UI family per script; preserve Arabic quality rather than mechanically matching Latin letter spacing. Use a restrained hierarchy, 16px-equivalent body text as a starting point, and tabular figures for sets and metrics. Display typography belongs in limited brand moments.
- **Layout:** consistent 4/8-based spacing, clear content-width limits, normal document flow, and touch-friendly layouts from 320px upward. Dense coach tables can transform into prioritized rows on phones. Do not force decorative imagery into authentication screens.
- **Components:** button, field, select, search, tabs, client row, status, notice, sheet/dialog, skeleton, empty state, metric, and set entry. Keep variants explicit and few. One form-validation and notification pattern.
- **Feedback:** status near the action; validation near the field; confirmation for destructive actions; no success toast after a failed save. Reserve modals for genuine decisions or focused subflows.
- **Accessibility:** target WCAG 2.2 AA, including keyboard use, accessible labels, contrast, reflow, and visible focus. Use approximately 44px touch targets as a design preference; WCAG 2.2's minimum target criterion is 24 × 24 CSS pixels with exceptions, so do not conflate the two. Respect reduced motion and text scaling. [W3C](https://www.w3.org/TR/WCAG22/).
- **Localization:** one locale authority, logical spacing, explicit unit formatting, stable LTR treatment for email/numeric inputs where appropriate, and mirrored directional controls. Test full journeys in Arabic, not only translated labels.

After this analysis is complete, create a compact component reference and clickable prototypes of the four core journeys before broad implementation. Do not build a large design-system product, a new icon library, or decorative animation framework.

## 8. Validate value and commercial viability

Interview former users about the last real task they abandoned: what they attempted, where they stopped, what replaced Rafik, and what they would pay to avoid. Observe coaches using their current spreadsheets/messages/apps. An interview preference is weaker evidence than repeated pilot use.

Start with the smaller commitment/usability tests in document 00. Only after those pass, recruit a proposed expansion cohort of five coaches and roughly 25 clients for four weeks. If the selected buyer is a team, use one real team's operational unit and report its results separately. Offer hands-on initial plan import, then measure use without daily founder prompting.

Use one coach/team subscription with an understandable active-client allowance; clients do not have to understand purchasable monthly units. Test willingness to pay through an explicit pilot price and a renewal decision. Do not infer willingness from free signups. Avoid inventing a price before learning service intensity and support costs.

Acquisition starts with existing relationships and founder-led outreach, with permission to contact people. This audit did not send outreach. Publish a focused demonstration only after its workflow is real. Delay paid acquisition until activated users return and support load is sustainable.

Track acquisition → invited coach → activated coach → clients completing sessions → week-four retained coach → paid continuation. Diagnose each break before adding features. A successful smaller product is the basis for later expansion; a visually polished broad product is not evidence of demand.

## 9. Before-and-after redesign brief

This is the required design work, even if the business experiment remains small. The observations below distinguish rendered public pages from source-reviewed authenticated screens; they do not pretend that every current screen was tested live.

### Additional visual evidence from existing assets

Four product images bundled with the website were visually inspected. Their date/version is unverified and they may be marketing/design snapshots; they are evidence of Rafik's existing visual approach, not proof of today's signed-in runtime.

| Existing asset | Specific visual/interaction problem | Design response |
|---|---|---|
| [Mobile home](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/assets/homescr.jpeg) | AI action competes near the greeting; a large program image includes price/expiry; nutrition follows below; the workout start is a text action rather than the dominant control. A calorie value is very difficult to read against the dark track | Make the next workout and Start/Resume dominant; reduce the program to useful context; remove commercial metadata and AI from daily training; give values a tested foreground |
| [Set logging](/Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/assets/setlog.jpeg) | A large video and details occupy much of the first view. Repeated large cards state the prescription in prose while actual inputs show zero. Previous/Next exercise controls compete with the logging task | Collapse instruction media behind an accessible preview; show compact numbered sets, clear prescribed/previous/actual values and explicit completion. Prefill sensible suggestions without counting them as performed until confirmed |
| [Workout breakdown](</Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/assets/Workout Breakdown.png>) | Large uppercase header and many equally weighted metrics consume space; intensity/performance percentages have no definition visible in the image | Lead with planned versus actual work and the client note; explain any retained metric; use session date/title without an oversized decorative summary |
| [Client statistics](</Users/sami/Developer/GitHub/RAFIK-FRONTEND/src/assets/Client Statistics.png>) | Design asset includes revenue/weather-style labels and placeholder prose among health charts. The mixed cards do not establish a coach's next action | Design around one real review question at a time and realistic synthetic fixtures. Remove generic analytics decoration; do not infer that these asset placeholders are live customer data |

### Required screen changes

| Surface and present problem | Required replacement | Concrete interaction/design rule |
|---|---|---|
| Homepage: several audiences, oversized decoration, scrambling headline, performance guarantees | One intelligible offer, a real workout example, coach and client entry paths | First viewport explains the benefit and has one main action, “Try a sample workout”; secondary “I coach clients.” No decorative effect delays comprehension |
| Registration: affiliate terminology and password criteria displayed before effort has value | Invitation-aware verification or saving a guest session | Explain the reason for this step; preserve context and work. No account for public preview. Use the existing supported auth method with a clear resend/recovery path rather than adding multiple providers |
| Coach onboarding: profile/marketing data before useful work | Preview the client experience; import a first plan; create workspace when saving | No bio, certificate, headshot, client-type survey or nutrition questionnaire in the core first-use path |
| Client onboarding: chained profile/experience/diet/goals | Open the relevant workout after necessary private-access verification | Ask a question only when its answer changes the current service; show why. Collect optional profile information later, without a recurring completion nag |
| Phone entry: width gate routes to blank page | Responsive preview and private invite page; coach actions remain usable on phone | No screen-size redirect. App promotion is dismissible and appears after demonstrated value |
| Coach dashboard: sample counts/charts and generic status | A short, truthful review list | Every row answers who, what happened and what to do; empty state offers the next useful setup action, not fake analytics |
| Client home: many product areas and domain work triggered by opening the screen | One next session and explicit Start/Resume | No food setup, store or entitlement decision required to train. Secondary history and coach contact remain available |
| Workout logger: persistence and recovery not demonstrated | Exercise list plus focused set entry with previous result and units | One tap marks a prefilled set done; values remain editable. No modal or success toast per set. Local/synced status is visible and honest |
| Completion: multiple writes/progression risk | A single acknowledged completion with a small useful summary | Show what was done and next planned session; offer one optional note. Allow correction; do not invent calories or progress percentages |
| Plan builder: large editor and unreliable save feedback | Days/exercises with clear draft → preview → assign states | Start from a template/import; show advanced prescription options on demand. Failed save keeps all edits and an explicit retry |
| Invitations/entitlements: credit concepts leak into training workflow | “Invite client,” “Plan,” “Pending/Accepted” | Any later billing limits belong in account/business settings. No old credit concepts or reconciliation flow enter the new product |
| Progress: risk of metrics with little meaning | Session history and previous actual performance | Start with raw understandable facts; trends need sufficient data and units. Missing data is not zero and no global performance score is invented |
| Settings/support: fragmented account lifecycle | Small, predictable account page | Language, units, reminders, account/help. Session expiry returns users to their task after login; export/deletion states are explicit |

### Information requested and when

| Information | Earliest justified moment | Default |
|---|---|---|
| Language | First visit if device default is wrong | Editable EN/AR control, no onboarding screen |
| Email/authentication | Access private assignment or save to an account | One contextual verification path |
| Display name | When needed for the coach relationship | Reuse a verified existing profile; allow correction |
| Units | Workout entry | Clear kg/lb selection with safe conversion; never reinterpret old numbers silently |
| Timezone | Scheduling | Device default, editable; preserve logical session dates |
| Readiness/service suitability | Before relevant individualized coaching | Minimum service-specific questions with a purpose; not a marketing survey |
| Height, body mass, diet, photos | When a retained feature actually uses them | Optional otherwise; no blank mandatory profile form |
| Notifications | After choosing a useful reminder | Explain the reminder, then request permission once; respect refusal |
| Coach certificates/bio | If publicly listing a coach later | Not needed for managing an existing private roster |
| Billing details | Explicit paid continuation | Hosted checkout or clear manual invoice; no disabled card form |

## 10. Design direction and interaction budgets

**Visual direction:** calm, legible training guidance. Use Rafik's green as a recognizable primary action color, a warm/light neutral working canvas, dark readable text, and restrained gold for emphasis. Exact color values are a design output to contrast-test, not a new palette to freeze in this audit. Remove the global yellow-SVG rule. Use photography only where it explains a movement or supports a real offer; authentication does not need stock-athlete decoration. The product should feel purposeful on a crowded phone screen, with clear alignment and space around the next action.

The public landing page can have a more distinctive editorial composition. The workout logger needs stable controls, familiar patterns and clear numbers. These surfaces share tokens and identity but need not share a decorative layout. Arabic needs deliberate line-height and type selection, with human copy review. Do not force all headings and links into the current condensed Latin display face.

| Task | Proposed design budget | How to evaluate it |
|---|---|---|
| Understand the offer | A visitor can explain who it helps and the immediate benefit after a brief look | Ask in their own words; do not coach them with the desired answer |
| View a public routine | Zero required fields, no install, no permission prompt | Open the shared link on a fresh phone session |
| Start a sample session | One primary action from its preview | Measure all intervening screens and waits |
| Mark an ordinary prescribed set complete | One tap if values are correct; inline edit if not | Observe in a realistic gym task with one hand |
| Resume after interruption | Resume the same session from the entry surface | Reopen after app/browser termination; verify actual values |
| Coach sees first usable client plan | Manual import or a starter avoids a blank editor | Measure setup labor separately from customer clicks |
| Know whether work is saved | No interpretation of transient toasts required | Ask user to identify local-only, syncing, synced and error states |

These are design constraints to test, not proof of achieved usability. Do not optimize tap count at the expense of clarity, safety or correcting an error. Account confirmation/email-delivery time should be reported separately from user interaction time.

## 11. Required state and content contract

Use plain, specific microcopy: “Saved on this device,” “Synced with your coach,” “We couldn't save this change. Your edits are still here,” “This invitation has expired,” and “Your coach hasn't assigned your next workout yet.” These are draft English strings requiring Arabic equivalents and testing. Avoid “something went wrong” as the only recovery instruction.

Every core screen must define loading, empty, populated, failed and permission/session-expired states. The logger additionally needs unsynced, reconnecting, conflicting and recovered states. The plan editor needs draft, saving, saved, publish preview and failed-save states. Navigation away from unsaved work must not silently discard it. Confirmation is for genuine destructive decisions, not routine recording.

Use a visible focus ring and semantic labels; ensure error information is not color-only. Test 200% text zoom, small screens, long Arabic labels, keyboard operation on the web and screen-reader labeling on the selected surface. Check numbers and units together: an RTL layout must not change whether a value means reps, kilograms or minutes.

## 12. Design deliverables after analysis

1. A written Design Read and current-screen audit, preserving useful identity and listing deliberate changes; apply the requested `design-taste-frontend` skill within its scope.
2. Low-fidelity flows for public sample, private invite, logging/resume, coach setup and review; include failures before polishing visuals.
3. A small token/component specification and high-fidelity core screens at desktop and phone widths, plus Arabic equivalents of the critical journey.
4. A clickable prototype with realistic but explicitly synthetic plans and users. It must demonstrate the complete task, not only a visually appealing dashboard.
5. Five-client and five-coach task sessions where practical, a severity-ranked issue log, and a revised design addressing every blocking issue.
6. Implementation acceptance criteria tied to the states above, followed by actual-device verification of the working slice. A prototype cannot prove offline durability or backend authorization.

No prototype is part of this analysis delivery. The next design phase starts from the decisions and evidence in the completed package.

## 13. Backend lessons that must be visible in the new UX

- An open session survives a coach changing a future plan. Show which prescription the client is following; no silent replacement or lost entries.
- Correcting a completed-session note is an ordinary edit. It does not announce a new plan, advance a week or prescribe extra load.
- Progress means performed activity with understandable units. A screen visit, generated rest-day row or automated form is not a completed workout.
- If a short check-in is later justified, show one meaningful due item and its review state. Do not import the old pending-form backlog.
- Verification/recovery preserves the intended task. One successful authentication must not lead into an unrelated signup/profile/login sequence.

These requirements follow the [live backend audit](/Users/sami/Developer/GitHub/rafik-api/docs/revival/06-live-backend-audit.md); they belong in the prototype states and implementation checks, not just SQL tests. They apply to a fresh system without legacy migration or native-app work in this phase.
