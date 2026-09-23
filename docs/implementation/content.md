# Content and asset ownership

The shared catalog now contains fourteen authored English/Arabic entries, with two full-body starter sessions. R1 adds plank, walking, cycling, incline push-up, step-up and band row; each has an explicit recording kind. Coaches can also create private exercises through the web library. Names, equipment, instructions, prescription values and stable IDs live in `content/starter.json`. They generate the local SQL seed and the web's public sample. This is intentionally a small useful starting set, not an exercise-library migration.

`npm run content` regenerates both outputs. `npm run content:check` detects divergence. Use `npm run test:fresh` to validate new migrations/fixtures without resetting the preview, and inspect the affected exercise in the plan editor, sample and logger. Keep exercise IDs stable; a spelling/instruction change does not require a new ID. A materially different movement does.

The starter's loads are labelled sample values, editable in the logger. The source distinguishes per-dumbbell recording and bodyweight at zero. Preferred units convert the numerical value; recorded history retains its actual unit. A coach's published plan is a fixed prescription, and later edits do not modify a started session.

## Assets

- `RAFIK-FRONTEND/public/brand/rafik.png`: existing supplied Rafik brand mark, retained from the original repository.
- `RAFIK-FRONTEND/public/images/training.png`: generated during the revamp with the imagegen tool. Decorative gym lifestyle image; it is not a customer photo, testimonial, or exercise demonstration. No training instruction depends on it.
- Manrope Variable and Noto Sans Arabic: self-hosted through pinned Fontsource packages, with their package license files retained in dependencies. Phosphor icons use the pinned Vue package. No external font or icon CDN is needed at runtime.
- No old customer photos, exercise videos, AI food assets or unverified remote media have been migrated.

The local Auth identities and any browser-test sessions are synthetic. Do not migrate them to hosting. The source currently binds the public starter to its local fixture version ID; the hosted release gate must create a production-owned starter and regenerate that binding.

## Maintenance rehearsal

During construction, the unit preference was carried through the new-session command to the actual set values, with a database scenario proving 4 kg becomes 8.82 lb. Another scenario proved that changing a future published load from 8 to 12 leaves the started prescription at 8. These are representative domain changes: one explicit command/validation owner and bounded UI consumers, with no trigger cascade or worker changes.

## Reference pack maintenance (R14)

- `content/foods.json`: 15 USDA SR Legacy records with original descriptions/FDC IDs, canonical nutrients per 100 g, exact portion weights and editorial Arabic names. The file records the official archive URL and SHA256. `scripts/content/extract-usda-foods.sh` reproduces the source extraction; compare records before approving an update. Preserve source kcal (e.g. olive oil 884 kcal/100 g), not a reconstructed macro estimate. This is not a complete branded/regional database.
- `content/exercise-media.json`: immutable keys, exercise mapping, source pin, dimensions, hashes, frame paths and per-item attribution/lineage. `content/exercise-media/` holds 30 unchanged SVGs (586,741 bytes). Full licenses/source metadata are in `content/upstream/workout-guide/`. Asset CC BY-SA terms are separate from MIT software terms.
- `npm run content:media` verifies local file digests and safe self-contained SVG structure. `node scripts/content/exercise-media.mjs --fetch` downloads only missing allowlisted pinned files and verifies them before writing. It is a maintenance operation, never runtime fetching.
- `npm run content` emits the existing seed/sample plus the web media manifest, static SVG pack and `public/exercise-media/CREDITS.txt`. `content:check` rejects drift. Do not edit generated files. `test:catalog` checks source values, portions, source-byte mapping, public responses and cache/security headers.

For a new illustration: review the exact equipment/movement and rights first; retain full asset attribution and any derivative sources, pin a commit and hash every frame. Assign a new immutable key, never overwrite old media referenced by history. Update the shared exercise through a forward migration; content generation alone does not update an existing database, and preview reseeding is forbidden. Add a mapping/byte/snapshot test, regenerate the web pack, and inspect library/editor/logger in both engines and languages. New custom exercise illustrations use the same allowlist. Images are reference positions, not cadence or qualified technique certification.

The public API returns the same keys/frames for future native use. Native must retain attribution and use a suitable SVG renderer or a reviewed raster derivative, preserve offline version compatibility and pass physical-device checks. No native support is claimed from web rendering alone.

## Broad exercise catalog and motion (R15)

The starter remains small. Separate imports add 1,324 MIT metadata/instruction records and 46 wger entries through forward migrations. The library therefore starts with 1,384 shared source entries, with 45 actual video previews. Source overlap is not deduplicated by name. `category`, `body_part`, `target_muscle` and immutable `source_ref` support discovery and attribution; recording type is separately reviewed (90 requested-source entries are timed, including stretches/static holds).

- `content/exercise-dataset.json`: source pin/digest, retained MIT notice, English content and controlled vocabulary. `npm run content:exercise-dataset -- --check` validates the generated import. The upstream GIF/JPEG fields are deliberately absent because their media exception is separate.
- `content/upstream/wger/exercise-snapshot.json`: dated per-record licenses, source IDs, author and instruction provenance. `editorial-overrides.json` fixes necessary names/equipment/incomplete instructions; `wger-english-supplement-9` retains source translations for eight missing English entries plus one explicitly authored instruction. `npm run content:wger-exercises -- --check` checks the snapshot against its reviewed sources and the immutable first-import migration. Corrections after that migration use a new forward migration only.
- `content/exercise-videos.json`: 45 hashed H.264/MP4 clips and WebP posters, totaling 50,958,403 bytes. Each points only to its own wger exercise identity. `media-review.json` excludes the ambiguous assisted-pull-up duplicate and records two camera-introduction trims. Full source footage is unchanged apart from those disclosed trims, scaling, encoding and audio removal.
- `npm run content:videos` verifies hashes, canonical paths, identity counts, source attribution and generated migration/web manifest. `--generate` is for the initial reviewed pack generation; once applied, never regenerate an old migration with new bytes. Add a new forward migration and new media version instead.
- The optional `scripts/content/import-exercise-videos.py --ffmpeg /path/to/ffmpeg --source-cache /path/to/cache` reproduces the dated derivative pack with FFmpeg 7.1/libx264/libwebp. Python is standard-library-only; FFmpeg is a content-maintenance tool, not a runtime dependency. The original download is approximately 1.4 GB; retain it outside Git. Normal development and CI use committed assets and require no FFmpeg or network fetching. The first pack was encoded with the macOS ARM FFmpeg 7.1 binary distributed by imageio-ffmpeg 0.6.0; another encoder build may differ and must not overwrite immutable published hashes.
- `npm run content` also generates the web video manifest and compact instruction credits. Both player and written guidance carry source attribution through copied exercises and snapshots. Public full-file downloads satisfy the asset redistribution terms; videos are not wrapped in access restrictions.

Video playback loads on visibility and handles byte ranges, reduced motion, off-screen/background pauses and retry. The 49 MiB motion pack is **not** precached in the offline app shell. Existing small illustrations remain precached; written instructions remain the fallback. Before adding any new asset, inspect its actual setup and legibility, compare it with the named movement, preserve license/author/change notice, and test its real player in both engines. Missing Arabic exercise text is visibly English, not an asserted translation.
