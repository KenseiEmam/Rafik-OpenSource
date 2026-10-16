# Rafik nutrition research: from text guidance to actionable coaching

**Research date:** 23 September 2026

**Scope:** product and data research only; no medical personalization, application-code change, hosted integration, or license opinion

**Recommendation:** ship a small bilingual USDA FoodData Central starter catalog locally, expose the targets Rafik already stores, calculate portions and known totals, and let coaches attach structured example meals to immutable guidance. Keep manual label entry and personal saved foods. Do not introduce a live third-party provider in this slice.

## Decision

The useful next step is an extension of Rafik's existing nutrition model, not a replacement tracker:

1. Put the current effective calorie, protein, carbohydrate, and fat targets in the main client view. Show **known consumed**, **target**, and **remaining** for the selected day. If any logged food lacks a nutrient, label the subtotal as partial and show the missing-item count; never interpret an empty day as zero intake.
2. Add a local, searchable starter catalog of 15 common foods. Every food has an English and Arabic search/display name, a 100 g nutrient basis, a record-specific USDA FDC identifier, a source URL, and a few verified household-portion weights. Selecting a food fills an editable draft. Saving still creates Rafik's immutable meal snapshot.
3. Let a coach turn targets into a structured example day: meal slot, food, amount, nutrients, and provenance. The example belongs to the same immutable guidance version. A client may copy a suggestion into the meal form, then correct the portion actually eaten before saving.
4. Add only a **macro arithmetic helper** in this phase: a coach enters an already chosen calorie budget and protein/fat percentages; Rafik derives grams with the 4/4/9 factors. It must not present itself as an estimate of the client's calorie needs.
5. Keep labels such as “reference value” and “coach-entered target.” Food composition varies by preparation and brand. A package label remains the better source for the exact packaged product.

This gives the user an immediate answer to “what should I aim for, what have I recorded, and what can I eat?” while preserving the privacy, retry, correction, sharing, and history semantics already implemented.

## Existing Rafik foundation and observed gap

The repository already has the difficult lifecycle pieces:

- `nutrition_guidance` is append-only by relationship revision and already stores nullable `kcal`, `protein_g`, `carb_g`, and `fat_g` targets.
- A meal copies name, amount, basis, unit, nutrients, source, and optional saved-food ID. Later edits to a saved food cannot change the meal snapshot.
- Personal saved foods remain private; a meal can be private or explicitly shared with one coaching relationship.
- Totals scale each known nutrient by `quantity / basis` and count missing values separately from known zero.
- Meal correction updates the same record with a revision; retry cannot create a second actual.

The baseline experience makes the nutrient fields optional and manual, places target values away from the main task, and provides no reference-food search or household portions. Text guidance can describe a plan but does not give the client a fast path from target to concrete food and then to an accurate actual.

## Data-source comparison

Code licenses and data licenses are deliberately separate below. An open-source client does not make its upstream food data open, and an open dataset does not grant permission to copy an application's code.

| Source | Data license / commercial use | Reliability and provenance | Units and portions | International / Arabic | Offline and mobile | API and cost | Rafik decision |
|---|---|---|---|---|---|---|---|
| [USDA FoodData Central](https://fdc.nal.usda.gov/api-guide/) | FDC states that its data are public domain and published under CC0; attribution is requested, not required. No application code is proposed. | Distinct data types expose different provenance. Foundation Foods includes analytical samples and methods; SR Legacy combines analyses, imputations, and literature; branded values come from data providers and labels. [Data-type documentation](https://fdc.nal.usda.gov/data-documentation/). | Nutrients are normalized per 100 g; portion gram weights can scale `value × grams / 100`. Portions are specific to each data type and food. [Foundation documentation](https://fdc.nal.usda.gov/Foundation_Foods_Documentation/). | Primarily US and English. Arabic names must be Rafik editorial metadata. It is weak for UAE brands and some Gulf mixed dishes. | Official JSON/CSV downloads make a bounded local subset straightforward. Full branded downloads are much too large for this use. | Free API key; default limit 1,000 requests/hour/IP. A key is a server concern, but a shipped subset needs no runtime API or user account. [API guide](https://fdc.nal.usda.gov/api-guide/). | **Use now:** curate 15 generic staples into versioned local content with FDC IDs and exact source values. |
| [Open Food Facts](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/) | Database: ODbL; individual contents: Database Contents License; images: CC BY-SA, with possible additional rights. [License guide](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/). Product Opener code is a separate open-source project. | Global, community-entered product data. Its own API documentation says there are no assurances of accuracy, completeness, or reliability. Images can provide label evidence, but Rafik would still need validation and correction UX. | Standard `_100g` and `_serving` fields exist; `serving_size` itself is free text and `serving_quantity` is normalized to g/ml where possible. [Product schema](https://openfoodfacts.github.io/documentation/docs/Product-Opener/schemas/schemas/product/). | Product names support language-specific fields such as `product_name_ar`; country and language parameters can localize results. Actual Arabic/UAE coverage and completeness must be measured, not assumed. | Direct reads need no login. Downloads/caches are possible, but ODbL obligations and keeping a dynamic cache current add work; OFF warns not to mix its cached database with external product data. [Cache guide](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/creating-a-local-cache-of-open-food-facts-data/). | Free read API; documented limits are 15 product reads/min/IP and 10 searches/min/IP, unsuitable for search-as-you-type without a client cache. [API introduction](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/). | **Evaluate later for barcode lookup**, behind an adapter and data-quality screen. Do not merge it into the CC0 starter catalog until ODbL implications are resolved. |
| [fatsecret Platform](https://platform.fatsecret.com/api-editions) | Proprietary, revocable API/content license. Basic and Premier Free require attribution. Most content not explicitly marked storable indefinitely must be removed or refreshed within 24 hours. [Terms](https://platform.fatsecret.com/terms), [storable fields](https://platform.fatsecret.com/docs/guides/storable-data). | Vendor-curated, but its terms expressly disclaim accuracy and say package information is the more accurate source when products change. | Provides servings and standardized g/ml/oz fields. | Basic and Premier Free are US-only and English. The paid Premier offering covers 62+ country datasets and 26 languages, including Arabic; localized access is a commercial feature. | The short caching window conflicts with Rafik's immutable meal snapshots and meaningful offline history. OAuth credentials must stay server-side. | Basic: free, 5,000 calls/day. Global market pricing is by quote. [Editions](https://platform.fatsecret.com/api-editions). | **Reject for R14.** Besides cost and storage conflict, the current terms prohibit using the API to provide diet/nutrition/health advice or guidance, which is central to Rafik's coach workflow. Legal review would be required before any reconsideration. |
| [FAO/INFOODS](https://www.fao.org/infoods) | FAO corporate statistical databases, including INFOODS, default to CC BY 4.0, but third-party records may have different restrictions that the reuser must check. [Database terms](https://www.fao.org/contact-us/terms/db-terms-of-use/). Publications and linked national tables can have separate terms. | Strong standards for food matching, component definitions, methods, units, denominators, and pre-publication checks. It is a network/directory rather than one uniform consumer catalog. [Standards](https://www.fao.org/infoods/infoods/standards-guidelines/en/). | Typically per 100 g edible portion, but source tables vary; matching must check nutrient definition, analytical method, unit, and denominator. [Food-matching guideline](https://www.fao.org/fileadmin/templates/food_composition/documents/Nutrition_assessment/INFOODSGuidelinesforFoodMatching_version_1_2.pdf). | The Middle East directory includes Bahrain and Gulf tables, some bilingual English/Arabic, plus older Gulf mixed-dish material. [Bahrain](https://www.fao.org/infoods/infoods/tables-and-databases/bahrain/en/), [Middle East](https://www.fao.org/infoods/infoods/tables-and-databases/middle-east/en/). | Generally PDFs, spreadsheets, books, or national databases; no single stable search API. Some listed sources are old or difficult to acquire. | No uniform API price or service level. Acquisition and rights review are per dataset. | **Use as a localization and quality reference.** Later create a rights-cleared Gulf-food lane; do not silently combine heterogeneous tables into the initial catalog. |

USDA is the only candidate here that simultaneously gives a permissive data license, inspectable primary records, stable source identifiers, verified gram weights, a small redistributable subset, and no production provider dependency. Its main weakness is cultural/product coverage, which the bounded design handles through Arabic editorial names and the existing manual/label workflow.

## Open-source workflow review

The GitHub [`nutrition-calculator` topic](https://github.com/topics/nutrition-calculator) is useful for discovery but not a quality gate: it mixes maintained trackers, student calculators, AI demos, clinical tools, and unrelated animal-nutrition projects. The following repositories have concrete patterns worth studying. Use concepts and observed behavior; do not copy copyleft code into Rafik without a license decision.

| Repository | Code/data license check | Useful pattern | What Rafik should take | What Rafik should avoid |
|---|---|---|---|---|
| [OpenNutriTracker](https://github.com/simonoppowa/OpenNutriTracker) | App code GPL-3.0. It separately identifies OFF, USDA FDC CC0, and German BLS CC BY 4.0 as food sources. | Search, barcode, quick-add, local encrypted diary, reusable recipes, goal line, trends, and explicit source references. | Search → inspect source/portion → adjust amount → save; keep search failure from blocking manual entry; later native client can cache chosen foods locally. | Its consumer target estimation and broad micronutrient/fasting/weight scope would overtake the coach product. Do not copy GPL code. |
| [Waistline](https://github.com/davidhealey/waistline) | GPLv3 app; its README separately names Open Food Facts and USDA as external databases. | A personal food list can be populated manually, by barcode, or by online search; diary remains usable offline; export/import is explicit. | Treat catalog foods as draft sources and save a personal reusable copy. Keep the diary usable when lookup fails. | Android-only Cordova implementation and provider-specific integration are not reusable architecture for Vue/Prisma. Do not copy GPL code. |
| [PANTS](https://github.com/dylanleigh/PriceAndNutritionTrackingSystem) | Apache-2.0 application code; bundled ingredient fixture provenance would still need separate inspection before reuse. | Minimum/maximum targets, ingredient/recipe composition, contribution-to-total views, missing-data propagation, and “recipes update; diary doesn't change” crystallized history. | The missing-data rule and immutable-actual rule match Rafik exactly. Structured example meals should update by creating a new guidance version while past meal entries stay fixed. | Its nested-recipe optimizer, cost analytics, and technical-user workflow exceed the current need. The project also describes its code as quick and dirty; use it as UX/domain inspiration, not a dependency. |
| [wger](https://github.com/wger-project/wger) | Application code AGPL-3.0-or-later; exercise/ingredient entries carry individual Creative Commons licenses; docs CC BY-SA 4.0. | Nutrition plans own ordered meals and amount-based ingredients; goal energy/macros sit beside the plan; a diary is separate from the reusable plan. | Preserve plan-versus-actual separation and an ordered example day. | Full recipe, ingredient, gym-management, and public API scope is unnecessary. Per-entry data licenses make its ingredient catalog unsuitable for blind copying. Do not copy AGPL code. |

The strongest shared pattern is small and consistent: reusable food/recipe sources are mutable; a logged diary entry is a snapshot; targets stay visible beside the daily total; lookup never removes manual entry.

## Primary starter catalog

### Extraction receipt

- Primary artifact: [USDA FoodData Central SR Legacy JSON, April 2018 release](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip), linked from the official [download page](https://fdc.nal.usda.gov/download-datasets/).
- Downloaded and inspected on 23 September 2026. Compressed size observed locally: 13 MB; the JSON was streamed rather than retained in the repository.
- Archive SHA-256 observed locally: `0fe8ae486a2c8eb42cb96413f058deb51863a46c8fb8eeb4b1fb45006dd338ef`.
- Nutrient fields copied without recalculation: FDC nutrient ID `1008` Energy (`kcal`), `1003` Protein (`g`), `1005` Carbohydrate by difference (`g`), `1004` Total lipid/fat (`g`). Values are per 100 g edible portion.
- Portion gram weights below come from each record's `foodPortions`. Only a useful, source-supplied subset is retained.
- SR Legacy's final release is static and contains values derived from analyses, imputations, and literature. It is appropriate as a transparent generic reference, not as an exact claim about a brand, recipe, restaurant serving, or every regional preparation. [USDA documentation](https://fdc.nal.usda.gov/data-documentation/).
- Arabic names below are Rafik editorial translations for search and display; USDA does not supply or validate them.

### Ingestible records

The numeric order in each `nutrients` object is source energy, protein, carbohydrate, and fat. Preserve the source precision in content; UI rounding can be presentational.

```json
[
  {"id":"usda-fdc-168878","fdcId":168878,"name":"White long-grain rice, cooked","name_ar":"أرز أبيض طويل الحبة مطبوخ","basis":100,"unit":"g","nutrients":{"kcal":130,"protein_g":2.69,"carb_g":28.2,"fat_g":0.28},"source":"USDA FoodData Central SR Legacy · FDC 168878","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/168878/nutrients","portions":[{"name":"1 cup","grams":158}]},
  {"id":"usda-fdc-171477","fdcId":171477,"name":"Chicken breast, meat only, roasted","name_ar":"صدر دجاج مشوي دون جلد","basis":100,"unit":"g","nutrients":{"kcal":165,"protein_g":31,"carb_g":0,"fat_g":3.57},"source":"USDA FoodData Central SR Legacy · FDC 171477","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/171477/nutrients","portions":[{"name":"1 cup, chopped or diced","grams":140}]},
  {"id":"usda-fdc-173424","fdcId":173424,"name":"Egg, whole, hard-boiled","name_ar":"بيض كامل مسلوق","basis":100,"unit":"g","nutrients":{"kcal":155,"protein_g":12.6,"carb_g":1.12,"fat_g":10.6},"source":"USDA FoodData Central SR Legacy · FDC 173424","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/173424/nutrients","portions":[{"name":"1 large egg","grams":50}]},
  {"id":"usda-fdc-173905","fdcId":173905,"name":"Oats, cooked with water, without salt","name_ar":"شوفان مطبوخ بالماء دون ملح","basis":100,"unit":"g","nutrients":{"kcal":71,"protein_g":2.54,"carb_g":12,"fat_g":1.52},"source":"USDA FoodData Central SR Legacy · FDC 173905","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/173905/nutrients","portions":[{"name":"1 cup","grams":234},{"name":"3/4 cup","grams":175}]},
  {"id":"usda-fdc-171284","fdcId":171284,"name":"Plain whole-milk yogurt","name_ar":"زبادي سادة كامل الدسم","basis":100,"unit":"g","nutrients":{"kcal":61,"protein_g":3.47,"carb_g":4.66,"fat_g":3.25},"source":"USDA FoodData Central SR Legacy · FDC 171284","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/171284/nutrients","portions":[{"name":"1 container (6 oz)","grams":170},{"name":"1 cup (8 fl oz)","grams":245}]},
  {"id":"usda-fdc-173757","fdcId":173757,"name":"Chickpeas, boiled, without salt","name_ar":"حمص مسلوق دون ملح","basis":100,"unit":"g","nutrients":{"kcal":164,"protein_g":8.86,"carb_g":27.4,"fat_g":2.59},"source":"USDA FoodData Central SR Legacy · FDC 173757","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/173757/nutrients","portions":[{"name":"1 cup","grams":164}]},
  {"id":"usda-fdc-172421","fdcId":172421,"name":"Lentils, boiled, without salt","name_ar":"عدس مطبوخ دون ملح","basis":100,"unit":"g","nutrients":{"kcal":116,"protein_g":9.02,"carb_g":20.1,"fat_g":0.38},"source":"USDA FoodData Central SR Legacy · FDC 172421","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/172421/nutrients","portions":[{"name":"1 cup","grams":198},{"name":"1 tablespoon","grams":12.3}]},
  {"id":"usda-fdc-171413","fdcId":171413,"name":"Olive oil","name_ar":"زيت زيتون","basis":100,"unit":"g","nutrients":{"kcal":884,"protein_g":0,"carb_g":0,"fat_g":100},"source":"USDA FoodData Central SR Legacy · FDC 171413","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/171413/nutrients","portions":[{"name":"1 tablespoon","grams":13.5},{"name":"1 teaspoon","grams":4.5}]},
  {"id":"usda-fdc-173944","fdcId":173944,"name":"Banana, raw","name_ar":"موز طازج","basis":100,"unit":"g","nutrients":{"kcal":89,"protein_g":1.09,"carb_g":22.8,"fat_g":0.33},"source":"USDA FoodData Central SR Legacy · FDC 173944","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/173944/nutrients","portions":[{"name":"1 medium banana","grams":118},{"name":"1 cup, sliced","grams":150}]},
  {"id":"usda-fdc-168191","fdcId":168191,"name":"Medjool dates","name_ar":"تمر مجدول","basis":100,"unit":"g","nutrients":{"kcal":277,"protein_g":1.81,"carb_g":75,"fat_g":0.15},"source":"USDA FoodData Central SR Legacy · FDC 168191","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/168191/nutrients","portions":[{"name":"1 pitted date","grams":24}]},
  {"id":"usda-fdc-174915","fdcId":174915,"name":"White pita bread, enriched","name_ar":"خبز عربي أبيض مدعّم","basis":100,"unit":"g","nutrients":{"kcal":275,"protein_g":9.1,"carb_g":55.7,"fat_g":1.2},"source":"USDA FoodData Central SR Legacy · FDC 174915","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/174915/nutrients","portions":[{"name":"1 large pita (6.5 in)","grams":60},{"name":"1 small pita (4 in)","grams":28}]},
  {"id":"usda-fdc-172454","fdcId":172454,"name":"Hummus, home prepared","name_ar":"حمص بالطحينة محضّر منزلياً","basis":100,"unit":"g","nutrients":{"kcal":177,"protein_g":4.86,"carb_g":20.1,"fat_g":8.59},"source":"USDA FoodData Central SR Legacy · FDC 172454","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/172454/nutrients","portions":[{"name":"1 tablespoon","grams":15},{"name":"1 cup","grams":246}]},
  {"id":"usda-fdc-175168","fdcId":175168,"name":"Atlantic salmon, farmed, cooked","name_ar":"سلمون أطلسي مستزرع مطهو","basis":100,"unit":"g","nutrients":{"kcal":206,"protein_g":22.1,"carb_g":0,"fat_g":12.4},"source":"USDA FoodData Central SR Legacy · FDC 175168","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/175168/nutrients","portions":[{"name":"3 oz","grams":85}]},
  {"id":"usda-fdc-171265","fdcId":171265,"name":"Whole milk, 3.25% milkfat","name_ar":"حليب كامل الدسم","basis":100,"unit":"g","nutrients":{"kcal":61,"protein_g":3.15,"carb_g":4.8,"fat_g":3.25},"source":"USDA FoodData Central SR Legacy · FDC 171265","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/171265/nutrients","portions":[{"name":"1 cup","grams":244},{"name":"1 tablespoon","grams":15}]},
  {"id":"usda-fdc-170567","fdcId":170567,"name":"Almonds","name_ar":"لوز","basis":100,"unit":"g","nutrients":{"kcal":579,"protein_g":21.2,"carb_g":21.6,"fat_g":49.9},"source":"USDA FoodData Central SR Legacy · FDC 170567","sourceUrl":"https://fdc.nal.usda.gov/fdc-app.html#/food-details/170567/nutrients","portions":[{"name":"1 oz (23 whole kernels)","grams":28.35},{"name":"1 almond","grams":1.2}]}
]
```

### Catalog cautions

- Do not derive or overwrite a food's source `kcal` from its three displayed macros. USDA explains that energy can use general or food-specific Atwater factors and that carbohydrate/fiber treatment and rounding can differ. [Foundation energy documentation](https://fdc.nal.usda.gov/Foundation_Foods_Documentation/).
- Keep preparation words visible. Raw, cooked, drained, skinless, salted, and branded variants are not interchangeable.
- “Hummus, home prepared” is one reference composition. Arabic naming does not make it representative of every Gulf recipe.
- Portion weights are conveniences for converting to grams, not advice about how much someone should eat.
- Store catalog provenance separately from the user's editable display name. The actual meal snapshot must retain the chosen values and source string even if the catalog later changes.

## Calculator policy

The general metabolizable-energy factors are 4 kcal/g protein, 4 kcal/g carbohydrate, and 9 kcal/g fat. USDA identifies these as the Atwater general factors and FDC nutrient ID `2047`; FDA labeling guidance also prints fat 9, carbohydrate 4, protein 4. [USDA](https://fdc.nal.usda.gov/Foundation_Foods_Documentation/), [FDA food-labeling guide](https://www.fda.gov/media/81606/download).

Rafik may safely use those factors for transparent arithmetic on a coach's chosen calorie budget:

```text
protein grams = calorie budget × protein percent ÷ 4
fat grams     = calorie budget × fat percent ÷ 9
carb grams    = calorie budget × remaining percent ÷ 4
```

The UI should say “Calculate grams from a calorie budget,” not “Calculate your calories.” Require percentages to be non-negative and sum to no more than 100%; display the computed carbohydrate remainder before applying. Applying changes only the unsaved guidance draft.

Do not add an automatic personal calorie prescription in this slice. The primary Mifflin–St Jeor paper derived a resting-energy equation from 498 healthy adults aged 19–78 and reported an `R²` of 0.71; its simplified forms use sex-specific constants and estimate **resting** expenditure, not total daily need. [Primary PubMed record](https://pubmed.ncbi.nlm.nih.gov/2305711/). Current National Academies material uses age/sex/height/weight equations stratified by physical-activity level for adult total energy expenditure, demonstrating that an unexplained multiplier on a resting estimate is not a complete method. [2023 DRI for Energy](https://www.nationalacademies.org/read/26818/chapter/18).

If Rafik later adds an estimator, make it an explicitly labeled coach draft with the named equation/version, input units, population boundary, activity-category definition, timestamp, and manual acceptance. It needs separate rules for minors, pregnancy/lactation, older adults outside validation samples, athletes, and clinical conditions. That is a distinct product and safety task.

## Recommended workflows

### Coach

1. Choose the client and see the active target version plus the last seven days of shared records.
2. Enter or revise targets. The arithmetic helper can translate a chosen calorie budget and macro split into grams; it does not choose the budget or split.
3. Build an optional example day from the local catalog or a manual label food. See the example day's calorie/macro totals while composing it.
4. Add plain-language guidance and an effective date. Review the complete target, example meals, and sources before publishing one immutable version.
5. In history, compare known daily totals with the target and show completeness. Review foods/notes and ask a coaching question; do not manufacture an “adherence score.”

### Client

1. The selected day's target and known progress appear before the log. Each nutrient shows consumed, target, and remaining; partial totals are obvious.
2. “Record a meal” opens search. Search matches English or Arabic names. Results show food, preparation, reference source, and a default 100 g basis.
3. Choose a verified household portion or enter grams, review scaled calories/macros, choose private or shared, then save.
4. Saved foods and recent foods remain the fastest repeat path. Manual label entry remains available when search has no suitable match.
5. A suggested meal from the coach prefills the form but is not an actual until the client reviews the portion and saves it.

### Offline / later native client

The 15-food catalog can ship with the client bundle or be cached after the authenticated application loads it. Search and portion arithmetic require no network. Meal writes still follow Rafik's existing durable command and acknowledgment model; a future native client can queue the exact immutable snapshot. A live provider is unnecessary for this path.

## Acceptance checks for implementation

- Catalog content validation rejects duplicate local IDs/FDC IDs, non-100 g bases, negative nutrients, missing English/Arabic names, missing source URLs, and non-positive portion gram weights.
- A known catalog selection scales every nutrient by `quantity / 100` and copies the source into the saved meal. Editing catalog content later does not change prior meals or guidance versions.
- Source values of zero remain zero; unavailable values remain `null`. Partial daily totals identify the count of meals missing each nutrient.
- The selected catalog food survives result filtering, language changes, paging if introduced, reload of a durable draft, and an interrupted save.
- Search works for English and Arabic food names and preparation terms. Arabic layout, numerals, long labels, native amount controls, 320 px width, short phone height, both themes, Chromium, and WebKit are inspected.
- A catalog-load failure leaves manual entry and saved foods usable. A no-match result explains the fallback.
- Macro allocation rejects invalid numbers and percentages above 100%; known examples are checked exactly. Changing calculator inputs does not mutate saved guidance until publish succeeds.
- Suggested meals remain distinct from actual meals, are bounded, validate the same nutrients/units/source rules, and retry to one guidance version.
- Coach reads only explicitly shared meals. Personal saved foods and private meals remain inaccessible.
- Export includes the immutable meal/guidance snapshot and source text. If public-catalog metadata is exported, include the FDC ID and source URL.

## Bounded follow-on work

After observing whether the starter catalog improves task completion, the next data task should measure missing searches from real use and build a rights-reviewed Gulf-food candidate list. Use FAO/INFOODS matching rules; record original food name, Arabic variants, preparation state, edible portion, nutrient definition, analytical/derived status, source edition, license, and uncertainty. Do not add a broad database because it is available.

A later barcode experiment can test Open Food Facts behind a provider adapter. Acceptance should include UAE/Arabic hit rate, complete macro rate, serving normalization, contradictory-label review, rate-limit behavior, cache/license design, deletion/update behavior, and immutable snapshot attribution. It should remain optional and must never remove manual label entry.

Recipe building, image recognition, AI meal estimation, micronutrient prescriptions, weight-loss target automation, streaks, and generalized meal-plan optimization are outside this recommendation. They add data-quality, safety, licensing, and product scope before the basic coaching loop has been proven useful.

## Evidence and limits

All external factual claims above were checked against the linked first-party documentation, primary paper, official raw dataset, or repository license/README. The 15 food records were extracted mechanically from the official archive and checked for the four named nutrient IDs and selected source-supplied portions. No medical outcome, individual calorie need, UAE catalog coverage rate, human usability result, physical-device behavior, or provider service level was tested.

This report is product and engineering research, not legal or nutritional advice. ODbL database-combination questions, FAO third-party data rights, and any proprietary-provider contract require qualified review before use.
