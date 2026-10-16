# HANDOFF-002: Nutrition research
**From:** Agent 2 — nutrition_research

**To:** Root implementation and synthesis agent

**Date:** 2026-09-23

**Related Task:** TASK-002

## Delivered Artifacts

- `coordination/outputs/agent2_annotation/nutrition.md`
- `coordination/outputs/agent2_annotation/nutrition-foods.json`
- `coordination/outputs/agent2_annotation/extract-usda-foods.sh`
- `coordination/tasks/done/TASK-002_nutrition_research.md`

## What Is Ready

The report recommends a bounded vertical slice: visible coach-entered targets and known consumed/remaining values; a locally shipped bilingual 15-food USDA starter catalog; structured example meals within immutable guidance versions; and 4/4/9 macro-allocation arithmetic that does not estimate individual energy needs. It compares USDA FoodData Central, Open Food Facts, fatsecret, and FAO/INFOODS across data license, reliability, units/portions, international/Arabic suitability, offline/mobile behavior, API cost, and Rafik fit. It separately reviews the code/data licenses and reusable workflow concepts in OpenNutriTracker, Waistline, PANTS, and wger.

`nutrition-foods.json` is the implementation-ready research packet. Each item includes Rafik names, exact source nutrients per 100 g, selected portion options, the full source portion list, FDC ID, original USDA description, publication/data type, and source URL. Top-level metadata records the source archive, CC0 status, SHA-256, nutrient IDs, and the rule to retain source calories.

`extract-usda-foods.sh` downloads the official 13 MB compressed archive, verifies its pinned SHA-256, streams the JSON, and emits the 15 raw USDA records with named nutrient IDs/units and portions. It requires `curl`, `shasum`, `unzip`, and `jq`.

Verification performed:

- Parsed the normalized JSON and checked 15 unique foods, 100 g basis, non-negative numeric nutrients, provenance, and positive portions.
- Ran the extractor from a fresh download and verified its archive checksum.
- Compared all 15 original descriptions plus kcal/protein/carbohydrate/fat values between the raw extraction and normalized catalog; all matched exactly.
- Checked licensing, limits, reliability, and caching claims against first-party provider documentation.
- Checked repository workflow/license claims against repository READMEs/license declarations.
- Checked 4/4/9 against USDA/FDA sources and the Mifflin–St Jeor limitation against the primary PubMed record.

## Known Gaps

- SR Legacy is the final 2018 release and is US/English-oriented. These are generic reference values, not exact UAE brands or recipes.
- Arabic names are editorial translations for search/display; they do not establish equivalence for every regional preparation.
- FDC IDs identify the selected source records. The pinned archive/version must remain part of provenance; an ID is not a timeless identity for every version of a food.
- No UAE/Arabic catalog hit rate, real-coach usefulness, medical outcome, physical-device behavior, or production provider availability was tested.
- Open Food Facts requires ODbL design/legal review before combining or caching its records. FAO sources require per-dataset third-party rights checks. fatsecret's current caching and guidance restrictions make it unsuitable for this slice.

No blocker remains for the bounded local USDA catalog and workflow implementation.

## Recommended Next Step

Implement and verify the bounded slice against the report's acceptance checks. In particular, preserve source calories rather than deriving food energy with 4/4/9; use 4/4/9 only for the coach's chosen calorie-budget allocation helper. After real use produces search misses, create a separate rights-reviewed Gulf-food research task rather than expanding the initial catalog speculatively.
