# Open-source research and product decisions

**R15 correction:** the founder rejected the small exercise scope and manual frame player below. The requested MIT data is now imported in full, with a separately sourced 45-video continuous-motion pack and a rebuilt library/picker. See [ADR0011](../decisions/0011-exercise-catalog-and-motion.md) and the [correction record](r15-exercise-correction.md). R14 findings remain as decision history; its exercise scope is superseded.

Research completed 23 September 2026 using three bounded workers: GPT-5.6 Sol for exercise media, GPT-5.6 Sol for nutrition, GPT-5.6 Terra for coaching workflows. The primary agent audited Rafik, checked key source evidence and owns integration/acceptance. This is source research and developer workflow review, not customer validation or medical advice.

## What the current experience got wrong

1. Numeric nutrition targets existed but were hidden; an empty fixture plus notes-first presentation made the feature appear text-only. A database field is not a useful workflow.
2. Food logging made people find and enter nutrient values themselves. It lacked reusable, trustworthy starting content and readily available portion calculations.
3. Coaches could offer text, but could not turn targets into a structured example day that a trainee could adjust and log.
4. Exercise demonstrations were optional external links. Users left the editing/training task, and the app had no stable media provenance/offline contract.
5. Nutrition drafts and pending writes did not follow the stronger context/recovery conventions established elsewhere. The review found client-selection drift, abandoned helper inputs blocking parent-form validation, and stale units preserving inappropriate nutrient bases. End-to-end source-food submission also exposed the old one-decimal input step rejecting valid two-decimal nutrients inside collapsed details; arbitrary source precision is now accepted while numeric bounds remain enforced.

6. A late save callback could modify the destination query after leaving Nutrition. Sequential save-then-navigate tests missed the interleaving; a held-response regression reproduces it and now verifies that durable acknowledgement finishes without altering the new page.

## Evidence and selections

| Source | Findings and decision |
|---|---|
| [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) | Inspected the requested source. Its [media exception](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/LICENSE) expressly withholds downstream rights to Gym visual images/GIFs. Sample media are 180×180. **Do not import these assets.** |
| [Workout Guide](https://github.com/bryllim/workout-guide/tree/aac599224bb9780305239607ef98540b7e0ce389) | MIT software/docs and separately [CC BY-SA 4.0 assets](https://github.com/bryllim/workout-guide/blob/aac599224bb9780305239607ef98540b7e0ce389/LICENSE-ASSETS). **Adopt 10 exact movement matches, 30 vector poses, 586,741 bytes.** The primary review narrows the worker's 11-item recommendation by excluding treadmill walking as well as bench/floor-press, assault/stationary-cycle and high/low-step mismatches. |
| [USDA FoodData Central](https://fdc.nal.usda.gov/api-guide/) | Public-domain/CC0 food data; a checksum-pinned official SR Legacy archive supplies 15 selected staples and verified gram portions. **Adopt local reference foods with Arabic editorial labels and retained source values.** No runtime provider/key. |
| [Open Food Facts](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/) | Useful barcode and international-product direction, with crowdsourced quality and ODbL/database/image terms. **Defer provider integration** until Gulf-product coverage, source review and cache/redistribution boundaries are designed. |
| [wger](https://github.com/wger-project/wger), [Liftosaur](https://github.com/astashov/liftosaur), [openGym](https://github.com/DuarteSantos8/openGym), [Payload Training App](https://github.com/codee-sh/payload-training-app) | Useful patterns in session evidence, explicit progression, timer controls and prescribed/actual separation. Rafik already has prior performance, persistent rest timing, approved alternatives and immutable programming. **Keep these systems; do not add another logger or progression DSL.** No source copied. |
| [OpenNutriTracker](https://github.com/simonoppowa/OpenNutriTracker), [Waistline](https://github.com/davidhealey/waistline) | Search → select source → adjust portion → save, with manual-entry fallback and independent food/diary lifecycles. **Adopt the interaction pattern with original code**, retaining Rafik's snapshot rules. |
| RepDB, free-exercise-db, ExerciseDB paid offering, FatSecret | Evaluated but not integrated: redistribution restrictions, uncertain media provenance, missing inspectable artifacts, or storage/provider terms conflict with the current architecture. Exact evidence and uncertainty are in the lane reports below. |

## Implemented scope

Nutrition now supports explicit daily calorie/macro targets, optional allocation arithmetic, source-backed food search and portions, structured example days, trainee use/correction, actual-versus-target progress with partial-data labels, and version history. Every write is durable before dispatch and retryable without changing its request. Per-client/per-visibility/date drafts are isolated. Suggestions never count as consumption.

Exercise illustrations are available in the independent and organization library/editor, public routine and shared workout logger. The viewer supports manual positions, explicit play/pause, failure/retry/text fallback and attribution. It never autoplays and pauses when hidden or reduced-motion preference changes. The manifest and stable API keys are reusable by a later mobile implementation. New content does not rewrite historical prescriptions.

## Prioritized follow-on work

1. **Organization nutrition:** define organization-owned plans, assigned trainer authoring, admin oversight and trainee sharing without reusing independent relationships. This remains a distinct missing scope, not implied by the new food API.
2. **Exercise coverage:** exact licensed floor-press, low-step and stationary-bike demonstrations; then expand reviewed catalog coverage using the same import contract. A qualified coach should review instructional accuracy before production use.
3. **Coach review → individual adaptation:** make the existing future-program adjustment discoverable beside actual session evidence; retain explicit approval and immutable past sessions. No automatic load changes.
4. **Regional food usefulness:** measure UAE/Gulf dishes and brands, then add rights-cleared sources and a correction flow. Do not call 15 generic foods a comprehensive nutrition database.
5. **Later native experience:** package/cache the versioned asset manifest, choose an SVG renderer or approved raster derivative, use the same portion/snapshot contracts and test on real devices. Native work is still deferred.

## Full research inputs

- [Exercise sources, pins, dimensions, licenses and rejected mappings](../../coordination/outputs/agent1_corpus/exercise-media.md)
- [Nutrition providers, calculator boundaries and workflow comparisons](../../coordination/outputs/agent2_annotation/nutrition.md)
- [Coaching repositories, existing-feature audit and ranked gaps](../../coordination/outputs/agent3_engine/coaching.md)
- [Architecture decision](../decisions/0010-reference-content-and-nutrition.md)

Research reports retain worker recommendations as evidence. This synthesis and ADR record the primary agent's final selection; shipped scope and test outcomes belong in the implementation ledger and verification record.
