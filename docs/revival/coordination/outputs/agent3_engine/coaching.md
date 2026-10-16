# Coaching workflow research — R14 input

**Date:** 23 September 2026

**Scope:** Open-source coaching and workout workflow mechanics only. Exercise media and nutrition are deliberately out of scope. This is research input, not an implementation decision.

## Finding

RAFIK already covers the headline mechanics found in the strongest sources: a durable per-exercise previous-performance lookup, a local persisted rest countdown, coach-approved same-kind alternatives, immutable publication and started-session snapshots, individual adaptation, and reviewed atomic delivery. The useful next work is therefore about reducing the steps between an observed session and a deliberate coach decision, plus small execution controls. It is not a reason to add a generic progression engine, a new logger, or another bulk-delivery system.

The source comparison supports three bounded candidates, in this order:

| Rank | Candidate | Why it is useful now | Scope boundary |
| --- | --- | --- | --- |
| 1 | **Review-to-adaptation fast path with evidence** | A coach reviewing a completed session can see target and actual, but the current review surface has no direct, evidence-carrying route to an individual future-session adaptation. Make the next decision discoverable where the evidence is. | A suggestion opens an explicit individual adaptation draft; it never changes a published version, a started session, another recipient, or targets automatically. |
| 2 | **Rest-timer adjustment and interruption polish** | RAFIK starts and persists the countdown, but the logger exposes only Skip. Small `+15s`/`−15s` controls and correct reload/background recovery reduce friction while preserving the existing local state model. | Keep it device-local and inside the existing workout queue. Do not add a provider, background service, push promise, or make a timer a completion signal. |
| 3 | **Substitution context for coach review** | RAFIK correctly limits choices to coach-approved, same-kind alternatives, but a review cannot distinguish an equipment constraint from an intentional variation. An optional, structured reason makes the resulting history actionable. | Do not auto-suggest a medical substitute or modify prescription targets. The choice remains an actual-record fact and corrections retain their existing lifecycle. |

## Current RAFIK baseline — do not reimplement

This read-only source check is important because the repositories below can otherwise make an already-complete mechanic look like a backlog item.

| Mechanic | Current evidence | Consequence for R14 |
| --- | --- | --- |
| Previous performance | `docs/implementation/revamp-coverage.md` records actuals/choices/previous performance. `../RAFIK-FRONTEND/src/features/training/WorkoutPage.vue` loads it per performed exercise and displays it in the logger. | Do not build a second history lookup or prefill system. |
| Rest timer | `WorkoutPage.vue` stores `restUntil` in the existing local session, starts it after the appropriate set/group completion, renders the countdown and allows Skip. | Improve controls and recovery only, after a rendered interruption audit. |
| Exercise alternatives | The same logger lets a trainee choose only alternatives carried in the immutable prescription; `docs/implementation/architecture.md` specifies a maximum of three accessible same-kind choices and records actual identity separately. | Do not add similarity-based automatic substitution. |
| Coach adaptation and delivery | `docs/implementation/r8-contract.md` specifies individual future-program adaptation, bounded recipient review and immutable started snapshots. `DeliverPlan.vue` retains selections across search/reload, shows each recipient's current assignment, and revalidates the batch at confirmation. | Do not add cohorts, another delivery queue, or mutable mass edits without a demonstrated workflow failure. |

## Primary-source comparison

Repository activity is an **observed signal**, not a longevity guarantee: GitHub repository metadata was read on 23 September 2026; each listed repository was non-archived at that check. Licence treatment below is a product decision aid, not legal advice.

| Source | Exact workflow evidence | Licence / activity observed | RAFIK use |
| --- | --- | --- | --- |
| [wger](https://github.com/wger-project/wger) and its [routine documentation](https://github.com/wger-project/docs/blob/master/docs/manual/routines.rst) | Routine days can be weekly or an explicit cycle with rest days. A `needs logs to advance` option prevents the next day progressing until work is logged. The same docs specify per-set rest and conditional progression requirements. | Application code: AGPL-3.0-or-later; repo metadata reported push `2026-09-22T23:22:42Z`. Its README separately says exercise/ingredient data have individual Creative Commons terms and documentation is CC-BY-SA-4.0. | **Inspire only.** The useful pattern is an explicit, user-visible progression/advance condition. RAFIK already has skip/move/restore schedule exceptions, so do not add wger-style automatic advancement without a validated coach need. No code, catalogue data or media reuse. |
| [Liftosaur](https://github.com/astashov/liftosaur) and [Liftoscript documentation](https://github.com/astashov/liftosaur/blob/master/docs/content/liftoscript.md) | Its README combines last-result context, per-exercise rest timers and same-muscle substitution. Its documentation makes progression rules and timer behaviour programmable, including automatic next-set movement. | AGPL-3.0; repo metadata reported push `2026-09-23T12:37:50Z`. | **Inspire only.** It supports the review-to-adaptation evidence card and small timer controls. Do not port or embed its script DSL: that would conflict with RAFIK's explicit immutable prescription and no-automatic-progression direction, as well as create a much larger security/UX surface. No code/data/media reuse. |
| [openGym](https://github.com/DuarteSantos8/openGym) | Its README describes previous-session prefill, explicit per-exercise rest, skip and rest adjustments, optional progression rules that say why a target changed, deload exclusion, and mid-session swaps. It is a useful example of explanatory microcopy around a live logger. | AGPL-3.0; repo metadata reported push `2026-09-20T19:26:40Z`. | **Inspire only.** Use its clear, local controls as a reference for timer adjustment and explanation, while preserving RAFIK's coach-approved alternatives and no automatic recommendation. Do not import its code, seeded exercise data, graphics or demonstrations. |
| [Payload Training App](https://github.com/codee-sh/payload-training-app) | Its README separates a coach-authored plan layer from client workout/set/exercise logs. Logs point to the precise prescribed exercise row, and plan structure with recorded sessions cannot be deleted. This is a clear coach/client audit model. | MIT; repo metadata reported push `2026-09-13T21:04:36Z`. | **Reference and potentially reuse isolated patterns only after normal review.** RAFIK already has the stronger immutable version/start snapshot contract, so retain that model. MIT covers the repository software, not exercise data, upload content or media rights; do not import those assets by default. |
| [Forge](https://github.com/bndct-devops/forge) | Its README describes prior-workout values as tap-to-accept ghosts and a rest timer that auto-starts after a set, can be adjusted or skipped, and survives reload/cross-tab use. This is the most directly relevant interaction reference for rank 2. | GitHub metadata reported push `2026-09-13T13:05:47Z`, but no SPDX licence or `LICENSE` file was found in the repository metadata/tree check. | **Behavioural inspiration only.** Treat all source, seed data and assets as unavailable for reuse until the upstream publishes an applicable licence. |

### Source-rights rule

The AGPL repositories are not candidates for copying into RAFIK's Vue/Prisma application or for in-process integration. Their user-facing patterns can inform a clean-room design. The MIT repository is less restrictive for source, but it is still not an authorization to import external exercise data, videos, images, user records or branded assets. Forge lacks a declared licence at the observed revision, so it receives no source reuse at all.

## Ranked candidates in enough detail to validate

### 1. Review-to-adaptation fast path with evidence — recommend discovery slice first

**Observed gap.** The review page shows planned and actual set values, and saves feedback. It does not expose a direct link to the existing individual-adaptation workflow. A coach can still navigate there, but has to reconstruct why a change is warranted.

**Proposed interaction.** On a completed, authorized session review, show a compact `Plan the next session` action. It opens the existing individual-adaptation entry with the trainee/context/session IDs already selected. The draft displays, per affected exercise, the original target, performed exercise, latest actual and optional effort; the coach must choose a change or leave it unchanged, add a short rationale, choose the effective future occurrence/date, review its scope, then confirm. The review remains a draft until the existing bounded command acknowledges it.

**Why this is bounded.** It is a routing and draft-context improvement over the existing individual-adaptation model, not an algorithm. It avoids a Liftosaur/openGym-style automatic progression, which would contradict the documented rule that completion corrections do not create progression and would be unsafe across strength, timed and distance exercises.

**Required acceptance.** Test independent coach, organization trainer and organization admin roles; a reassigned trainer; a trainee's own review URL; an old/revoked tab; a completed session using an approved alternative; a correction after the review; and conflict/reload during the adaptation draft. Assert that the original review, published version, started occurrence, other recipients and historical actuals remain unchanged. Inspect English/Arabic, desktop/phone, keyboard, empty/error and long-record states.

### 2. Rest-timer adjustment and interruption polish — recommend after a real rendered audit

**Observed gap.** RAFIK's `restUntil` model already survives logger reload in the local session and starts after the intended completion boundary. The present UI exposes elapsed countdown and Skip but not a small extension/reduction control or an explicit expiry/re-entry cue.

**Proposed interaction.** Add labelled `−15 seconds`, `+15 seconds` and `Skip` controls beside the existing timer, with one non-modal `Rest complete` status when it reaches zero. Preserve the state in the same local workout row; perform calculations from the persisted deadline, never from a second in-memory timer. If a session is already complete/correcting/conflicted, the control follows the existing logger lock state.

**Why this is bounded.** It borrows Forge/openGym's ergonomic detail while reusing RAFIK's durable local session and no new API. It deliberately excludes push, sound, vibration and background scheduling until native/physical-device evidence exists.

**Required acceptance.** Repeat reload, cross-tab, offline/reconnect, timer expiry while navigating away/back, group final-set trigger and correction flows. Test short phone height, landscape, Arabic/RTL, both themes, keyboard activation and live announcement behaviour. A browser result does not certify suspended-device timing.

### 3. Optional substitution reason visible in review — recommend only with coach validation

**Observed gap.** RAFIK safely records which approved alternative was performed, but a coach cannot tell from the review whether the exercise changed because equipment was unavailable, comfort changed, time was limited, or the trainee simply chose a variation.

**Proposed interaction.** When an alternative is selected, offer an optional short reason from a fixed neutral set (`equipment`, `comfort`, `time`, `preference`, `other`) plus bounded free text. Store it with the actual exercise record through the existing save/correction receipt, and show it in coach review next to `planned` and `performed`. The field defaults to absent; do not force an explanation during a workout.

**Why this is bounded.** It closes the review loop without asserting clinical diagnosis, generating a substitute, widening the alternative list, or rewriting frozen targets. The choice continues to be constrained by the immutable snapshot and same recording kind.

**Required acceptance.** Verify the option is unavailable without a prescribed alternative, survives local draft/retry/reload, has truthful correction history, is restricted to the current workspace, and remains readable to an organization trainer only while responsible. Include forged choice/reason payloads and stale authorization.

## Explicit non-recommendations

- **Do not add a generic progression scripting language or automatic load changes.** The closest sources use them, but RAFIK intentionally has coach-authored immutable versions and correction semantics that must not create another progression.
- **Do not build a new substitution recommender.** Similar-muscle matching cannot safely decide a trainee's appropriate exercise; RAFIK's approved same-kind list is the correct authorization boundary.
- **Do not build a second recipient/cohort delivery feature now.** The existing flow already retains selected identities across paged search/reload, displays current assignment, reviews replacement versus first assignment, revalidates atomically and limits one command to 50 recipients. Validate actual coach pain before adding saved cohorts or a wider batch tool.
- **Do not import upstream exercise data, media or code.** See the licence/data separation above.

## Evidence and limits

All external claims in this document were checked against the linked upstream repositories, their linked documentation, `LICENSE` files where present, and GitHub repository metadata on 23 September 2026. “Active” means only that the recorded repository had a recent push and was not archived at that time; it does not establish security, release quality, support commitments or suitability for RAFIK. The current RAFIK statements are read-only observations of the cited implementation/architecture sources, not new acceptance evidence.

## Addendum — in-progress nutrition workflow review (read only)

**Reviewed:** 23 September 2026, against the working changes in `../RAFIK-FRONTEND/src/features/nutrition/` and `prisma/migrations/202609231500_nutrition_meal_plans/migration.sql`. This is a source review only: no browser suite, database migration or application edit was run. It intentionally does not assess the completeness of the bundled food catalogue or exercise/media work.

### Highest-risk findings

| Priority | Finding | Precise behaviour and risk | Recommended correction / proof |
| --- | --- | --- | --- |
| P1 | **Coach draft recovery does not bind its selected client to a stable route/key.** | `NutritionPage.vue` uses one coach-wide `draftKey` (line 31) and its deep synchronous watcher includes both `scope` and guidance fields (lines 172–195). In the client `<select>`, Vue updates `scope` before `selectScope()` resets targets, meals, revision and ID (lines 415–423, 126–139), so the code relies on two unawaited IndexedDB writes settling in the intended order. On reload, draft restoration assigns `scope` after `selectScope()` without replacing the route query (lines 342–370). A recovered B draft can therefore coexist with an A URL, and an interruption between the two writes can preserve a mixed transition snapshot. Structured example meals make that failure more visible, but the scope-recovery gap also applies to existing guidance. | Key coach guidance drafts by relationship, or serialize/generate writes and reset the new scope before any persisted form state changes. Restore the route/context together with the draft, then server-revalidate it. Add an A/B test: edit A, immediately switch to B, force reload between queued IndexedDB writes, and prove B never shows/saves A's targets, prose or meals. |
| P1 | **Optional calculator/editor fields participate in the outer Save form's native validation.** | `MacroPlanner.vue` calculator inputs use `min`/`max` inside the coach's guidance `<form>` (lines 60–72); `MealPlanEditor.vue` has the same pattern for an unadded manual item or amount (lines 140–173). The user can enter an invalid helper value, decide not to apply/add it, then find `Save guidance` blocked by browser validation. The disabled helper button does not remove the invalid control from the form. This makes an optional tool unexpectedly block a valid manual nutrition plan. | Keep draft-only helper controls outside the submitted form, disable them unless their helper is active, or explicitly manage validation so only the committed guidance fields gate Save. Test invalid then abandoned macro input, invalid manual-food input, and invalid catalogue amount in Chromium/WebKit at phone width; each must still allow saving valid plan targets/meal rows. |
| P1 | **Meal actuals still have no explicit uncertain-result retry state.** | Guidance now uses `useCommand`, which persists the exact pending request before dispatch and offers retry. `saveMeal` remains a direct RPC call (`NutritionPage.vue` lines 249–274). After a dropped acknowledgement, it shows a generic error and relies on the visible form remaining unchanged; the user can alter date/scope or fields before retrying. The server's ID/revision guards prevent a silent duplicate, but they can turn the recovery path into a conflict and do not tell the user whether a meal was saved. | Give meal create/correction the same persisted-command contract: retain the immutable request, distinguish sending from unconfirmed, lock scope/editing, and offer only an exact retry until it settles. Exercise private and shared meal scopes, reload, dropped acknowledgement and a correction. Do not use a background queue. |
| P1 | **Changing a planned manual meal's unit retains values whose basis now means something else.** | In `MealPlanEditor.vue`, a manual item begins as `1 serving` (lines 12–20). Changing `custom.unit` at lines 148–153 leaves `custom.basis` and `custom.nutrients` intact (lines 156–160). A coach can enter nutrients per 100 g, switch the unit to serving, then add a snapshot labelled “per 100 serving” with g-based values. `validate_nutrition_meals` correctly accepts that structurally valid but semantically stale combination (migration lines 12–20). | On a unit change, clear nutrient values/source and set an explicit basis default, or require a deliberate conversion with a confirmation. State the basis in the item preview. Add transitions `g → serving`, `serving → g` and `ml → g`; assert that stale nutrient values cannot become a plan snapshot. |

### Additional workflow issue

`NutritionPage.vue` handles an actual meal's unit change by clearing the selected-food link, nutrients and source (lines 141–148), which avoids the stale-unit error above. It also silently resets the entered quantity to the new basis. That is safer than retaining values, but it is destructive after a user chose a saved/catalog food or typed values. Before implementation is accepted, make the reset explicit in the control's copy or require confirmation when non-empty nutritional values would be discarded; preserve the draft and focus. This is a usability/recovery issue, not a request for unit conversion.

### Scope and lifecycle observations that are sound

- The migration validates each suggested-meal object, bounds the list and JSON size, includes meals in exact idempotency comparison, and keeps the guidance version append-only (migration lines 3–43).
- The guidance command's pending request contains the selected relationship and is disabled while unresolved, so its *command* retry does not retarget after a normal scope switch. The generic form draft is the remaining cross-scope weakness.
- `useSuggestedFood` copies a suggestion into a new actual draft rather than creating an actual record automatically (`NutritionPage.vue` lines 243–247), which preserves the intended distinction between illustrative guidance and client-reported intake.
- The public food endpoint exposes only the bundled reference catalogue before identity lookup; no user, organization or saved-food record is returned (`server/index.ts` lines 153–155 and `server/public-catalog.ts`). This review does not treat catalogue depth or provenance presentation as a defect.
