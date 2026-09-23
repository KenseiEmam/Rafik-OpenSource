# HANDOFF-001: Exercise media source decision

**From:** agent1_corpus

**To:** root

**Date:** 23 September 2026

**Related Task:** TASK-001

## Delivered Artifacts

- `coordination/outputs/agent1_corpus/exercise-media.md`
- Lifecycle task: `coordination/tasks/done/TASK-001_exercise_media_research.md`

## What Is Ready

The report compares six exercise-media sources using primary licenses, repository files, pinned commits and measured media. It recommends a small locally vendored pack from `bryllim/workout-guide` at commit `aac599224bb9780305239607ef98540b7e0ce389`.

Eleven of Rafik's fourteen starter exercises have reviewed source mappings and exact SVG paths/hashes. The selected pack is 33 frames totaling 798,756 bytes of SVG; upstream 512px PNG equivalents total 1,129,600 bytes. A final fetch verified all 33 recorded SHA-256 values.

The accepted mappings are `goblet-squat`, `one-arm-dumbbell-row`, `dumbbell-romanian-deadlift`, `split-squat`, `glute-bridge`, `seated-dumbbell-press`, `dead-bug`, `plank`, `walking`, `incline-push-up` and `banded-row`. Rafik retains its own stable IDs. `floor-press`, `stationary-cycle` and `low-step-up` remain text-only because the available bench press, assault bike and high weighted step-up artwork changes the prescribed movement or setup.

The report includes the proposed versioned manifest contract, license/attribution fields, Everkinetic lineage for `glute-bridge`, offline/mobile behavior, immutable-snapshot rules, SVG safety findings and hotlink rejection.

## Known Gaps

- The artwork still needs a qualified coach/content review for pose accuracy and frame order in Rafik's actual interface.
- All selected SVGs use white artwork on transparency. They require a fixed dark media tile or a documented CC BY-SA 4.0 color adaptation.
- Three still frames do not encode timing or cadence. Any cycling UI must honor reduced motion and avoid presenting the sequence as calibrated technique timing.
- The safety scan covered the 36 considered starter candidates, not all 906 upstream SVGs. Repeat hash and active-content checks for every future pack update.
- Repository licensing evidence is strong but does not independently prove every contributor's chain of title. Preserve the pinned provenance and attribution inventory.

## Recommended Next Step

Root can import only the 11 allowlisted source slugs at the pinned commit, verify the report's hashes, retain the CC BY-SA 4.0 license/attribution files, and expose a versioned local media manifest. Keep the three excluded exercises text-only. Review all selected frames in English/Arabic, both themes and phone/desktop layouts before treating the pack as accepted product media.
