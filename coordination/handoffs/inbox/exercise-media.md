# HANDOFF-001: Exercise media source decision

**From:** agent1_corpus

**To:** root

**Date:** 23 September 2026

**Related Task:** TASK-001

## Delivered Artifacts

- `coordination/outputs/agent1_corpus/exercise-media.md`
- `coordination/outputs/agent1_corpus/wger-video-manifest-2026-09-23.json`
- `coordination/outputs/agent1_corpus/wger-video-pack-46-2026-09-23.json`
- `coordination/outputs/agent1_corpus/wger-video-pilot-30-2026-09-23.json`
- `coordination/outputs/agent1_corpus/wger-exercise-records-46-2026-09-23.json`
- `coordination/outputs/agent1_corpus/wger-english-supplement-9-2026-09-23.json`
- Lifecycle task: `coordination/tasks/done/TASK-001_exercise_media_research.md`

## What Is Ready

The continuous-motion follow-up supersedes the original still-frame recommendation for demonstration UI. The report now recommends a 46-exercise wger video pilot and MoveKit as the strongest reviewed procurement candidate for hundreds-scale motion coverage. It also defines the exact MIT-covered `hasaneyldrm` metadata/text import boundary while excluding its Gym visual files.

The dated wger manifest selects the smallest source video for every one of the 46 distinct exercise UUIDs in the live catalog. All carry CC BY-SA 4.0 and identify Goulart as author. The selected source pack is 1,462,437,726 bytes: 35 HEVC/MOV and 11 H.264/MOV. All 46 source URLs returned HTTP 200 with a byte length matching the API record. Root can transcode them to muted, fast-start MP4/H.264 derivatives, then add exact hashes and modification notices.

The companion exercise snapshot carries the full English translation and its license/author fields, category, equipment, muscle dictionaries, variation UUID and exercise-level provenance for all 46 records. A separate supplement fills the nine blank descriptions: eight are English translations tied to a specific German, Spanish or Portuguese source translation UUID/license/author; the one record with no usable source text is explicitly Rafik-authored.

Eleven of Rafik's fourteen starter exercises have reviewed source mappings and exact SVG paths/hashes. The selected pack is 33 frames totaling 798,756 bytes of SVG; upstream 512px PNG equivalents total 1,129,600 bytes. A final fetch verified all 33 recorded SHA-256 values.

The accepted mappings are `goblet-squat`, `one-arm-dumbbell-row`, `dumbbell-romanian-deadlift`, `split-squat`, `glute-bridge`, `seated-dumbbell-press`, `dead-bug`, `plank`, `walking`, `incline-push-up` and `banded-row`. Rafik retains its own stable IDs. `floor-press`, `stationary-cycle` and `low-step-up` remain text-only because the available bench press, assault bike and high weighted step-up artwork changes the prescribed movement or setup.

The original report still preserves the lawful 11-item `workout-guide` still pack for contexts that need posters, but three-frame playback must not be presented as continuous exercise motion.

## Known Gaps

- The artwork still needs a qualified coach/content review for pose accuracy and frame order in Rafik's actual interface.
- All selected SVGs use white artwork on transparency. They require a fixed dark media tile or a documented CC BY-SA 4.0 color adaptation.
- Three still frames do not encode timing or cadence. Any cycling UI must honor reduced motion and avoid presenting the sequence as calibrated technique timing.
- The safety scan covered the 36 considered starter candidates, not all 906 upstream SVGs. Repeat hash and active-content checks for every future pack update.
- Repository licensing evidence is strong but does not independently prove every contributor's chain of title. Preserve the pinned provenance and attribution inventory.
- wger currently covers only 46 distinct exercises and almost all selected sources require conversion. Its optional external object/author/derivative source URLs are empty even though every video names Goulart and carries CC BY-SA 4.0.
- The MoveKit commercial license prohibits public raw URLs and user extraction. Keep paid assets out of the public repository and confirm native offline packaging before procurement.

## Recommended Next Step

Root can build the 46-item wger pack from the dated manifest, compute source and derivative hashes, preserve the CC BY-SA attribution/change record and add each movement as a distinct `wger-*` exercise. The catalog should state that professional technique validation is not claimed. Separately, validate MoveKit's two-clip sample in the real player and compare its 412-item list with Rafik's intended catalog before purchasing broad coverage.
