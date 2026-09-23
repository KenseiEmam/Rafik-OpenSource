# Exercise media source decision for Rafik

Checked 23 September 2026. This is a source and integration assessment, not an import. No full media repository was cloned and no application source was changed.

## Decision

### Continuous-motion follow-up — supersedes the still-frame choice for demonstration UI

The three-frame `workout-guide` pack below remains a lawful still-image fallback, but it does **not** satisfy Rafik's continuous-motion requirement. Do not cycle its frames as a substitute for an exercise video.

For an immediate open-licensed motion pilot, use the dated 46-exercise wger snapshot in [`wger-video-pack-46-2026-09-23.json`](./wger-video-pack-46-2026-09-23.json), paired with [`wger-exercise-records-46-2026-09-23.json`](./wger-exercise-records-46-2026-09-23.json). It selects one smallest video for every distinct wger exercise that had live video on 23 September 2026. All 46 video objects identify `Goulart` as author and use CC BY-SA 4.0; all source URLs returned HTTP 200 and their `Content-Length` exactly matched the API byte count. The pack is real motion, but it is only 46 exercises and 1,462,437,726 source bytes. Thirty-five files are HEVC/MOV and eleven are H.264/MOV, so every chosen source should be converted to a muted, fast-start MP4/H.264 derivative capped for the product surface. Record the conversion as a modification and keep the derivative under CC BY-SA 4.0.

For broad production coverage in the hundreds, the most concrete reviewed option is commercial procurement, not another GitHub GIF fork. **MoveKit Complete** currently documents 412 high-resolution, loopable MP4 exercises and a binding [License Agreement v1.0](https://movekit.com/license) that expressly permits commercial mobile/web/coaching use and editing. It warrants that the content was created by or for the licensor and that the licensor holds the necessary rights. Its [two-clip free sample](https://movekit.com/free-sample) uses full-resolution H.264 MP4 and the same 18-field schema as paid packs, so Rafik can validate playback, mapping and quality before purchase. The license permits display and streaming to end users but prohibits public raw-file URLs and extractable/downloadable raw assets; this means paid files must stay out of Rafik's public source repository and be delivered through controlled product storage. Confirm the intended native-offline packaging pattern with the licensor before relying on an extractable app bundle.

The practical sequence is therefore:

1. ship the 46 distinct wger exercises as a clearly attributed open pilot after transcode, hash capture and normal editorial checks;
2. keep each as its own `wger-*` Rafik exercise rather than inferring an exact existing-catalog match from its label;
3. validate MoveKit's free sample in the real web/native player and inspect the complete pack's exercise list for Rafik coverage;
4. procure a broad pack only after the licensee entity and controlled-delivery design are settled.

The reviewed alternatives did not produce a free, open, rights-traceable continuous-motion library with hundreds of app-ready exercises. wger is open but small. The 1,324 Gym visual GIFs are broad but not sublicensed by the repository. Other GitHub forks repeat those same files or apply a software license without proving authority over the media.

### Wger motion evidence

- Live endpoints checked: [`video`](https://wger.de/api/v2/video/), [`exerciseinfo`](https://wger.de/api/v2/exerciseinfo/) and [`license`](https://wger.de/api/v2/license/). The API implementation is separately pinned to [`80d4a989cf7b0e98eb8817e1b725161857980803`](https://github.com/wger-project/wger/tree/80d4a989cf7b0e98eb8817e1b725161857980803); the local JSON files are the dated catalog snapshot because the live database can change independently of that source commit.
- The live set contained 78 video objects across 46 exercise UUIDs: all 78 video records were license ID 2 (`CC-BY-SA 4`) with author `Goulart`. wger's own [changelog](https://github.com/wger-project/docs/blob/master/docs/changelog.rst) also credits Goulart with contributing exercise videos under CC BY-SA.
- The complete set was 3,570,623,823 bytes: 54 HEVC and 24 H.264 objects; 75 MOV and three MP4. Only three objects were already MP4/H.264, spanning three exercises. Format labels, durations, dimensions and sizes came from the API, not filename inference.
- The 46-item selection always chooses the smallest source object for each exercise UUID. It totals 1,462,437,726 bytes before conversion. The source URLs and exact API metadata are in the manifest; SHA-256 values must be added during acquisition because this research pass intentionally did not download 1.46 GB of video.
- The media records have a usable license, named author, UUID and wger-hosted object URL. Their optional `license_object_url`, `license_author_url` and `license_derivative_source_url` fields are empty. Preserve that limitation instead of inventing external provenance.
- All selected records have an English name. The companion exercise snapshot preserves the full English translation record, exercise-level and translation-level licenses/authors, category, equipment, primary/secondary muscles, variation UUID and update timestamps. Nine of the 46 English descriptions are empty; Rafik supplies traced translations or clearly labeled Rafik-authored wording without claiming professional technique certification.
- The exercise/translation text licenses are separate from the video license and span CC BY-SA 3.0, CC BY-SA 4.0 and CC0. Preserve the exact per-record license and author instead of applying the videos' CC BY-SA 4.0 label to every text field. [`wger-english-supplement-9-2026-09-23.json`](./wger-english-supplement-9-2026-09-23.json) supplies eight traced English translations from non-English wger records and one clearly marked Rafik-authored description where upstream text was blank/unusable.
- CC BY-SA requires attribution, a license link, modification notice and ShareAlike for derivatives. It also disallows added effective technological measures that restrict recipients' licensed rights. Keep an unencumbered copy of each included source/derivative available with its credit and license information when distributing an app build that may apply platform DRM.

### `hasaneyldrm` metadata/text import boundary

The repository's [`LICENSE`](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/LICENSE) expressly applies MIT to code, tooling, dataset structure and instruction text/translations while excluding `images/` and `videos/`. Its [`NOTICE.md`](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/NOTICE.md) says the visual media remains Gym visual property, was included through separate written permission, and gives downstream users no media license. A lawful metadata-only import must therefore omit `image`, `gif_url` and `attribution` as usable assets; `media_id` may be retained only as source lineage, not as permission or a runtime media locator.

At pinned commit [`7455efae41b330c265e7cd4b78dfa848e7ce5ebd`](https://github.com/hasaneyldrm/exercises-dataset/tree/7455efae41b330c265e7cd4b78dfa848e7ce5ebd), [`data/exercises.json`](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/data/exercises.json) is an array of 1,324 records. The exact contract in [`data/exercises.schema.json`](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/data/exercises.schema.json) is:

- `id`: four-digit string, `^[0-9]{4}$`; source identity only, so namespace it rather than replacing Rafik IDs;
- `name`, `category`, `body_part`, `equipment`, `muscle_group`, `target`: strings; `category` mirrors `body_part`;
- `secondary_muscles`: string array;
- `instructions`: strings keyed by `en`, `es`, `it`, `tr`, `ru`, `zh`, `hi`, `pl`, `ko`, `fr`;
- `instruction_steps`: ordered string arrays under the same ten language keys;
- `media_id`, `image`, `gif_url`, `attribution`: media reference/notice fields that must not cause media acquisition;
- `created_at`: ISO 8601 timestamp;
- no additional properties are allowed by the upstream schema.

Importing those MIT-covered text/data fields is legally distinct from using the GIFs. It still requires editorial review: MIT permission does not certify biomechanical accuracy, translation quality, duplicates or suitability for a prescribed movement. Store the upstream commit and source ID; normalize into Rafik's taxonomy; keep published prescriptions immutable; and do not let later upstream corrections silently change historical snapshots.

There is also an upstream-provenance qualification: [issue #5](https://github.com/hasaneyldrm/exercises-dataset/issues/5), opened by an AscendAPI/ExerciseDB representative, identifies the v1 IDs, media and base instruction structure as ExerciseDB-derived. The representative said building on the v1 dataset was acceptable and asked for attribution, but that issue comment is not a complete standalone license instrument. Preserve attribution to both `hasaneyldrm/exercises-dataset` and ExerciseDB/AscendAPI, and treat the repository's explicit MIT grant as the stated permission for the checked revision rather than proof that every upstream contributor's chain of title was independently audited.

### Other motion options checked

| Source | Motion/coverage | Rights finding | Decision |
|---|---|---|---|
| [MoveKit](https://movekit.com/packs) | 104 / 220 / 288 / 412 high-resolution loopable MP4 packs; sample documents H.264 MP4 and an 18-field JSON/CSV schema. | [Binding license](https://movekit.com/license) permits commercial applications, editing and end-user display/streaming; warrants original/licensable work. Raw public downloads, extraction and standalone redistribution are prohibited. | **Best reviewed broad procurement candidate.** Validate sample, exact exercise list and native offline delivery before purchase. |
| [Vital Animations](https://vitalanimations.com/terms) | Advertises 400 / 800+ / 1,500+ 1080p MP4 exercises and self-hosting for paid apps. | Published terms permit app/SaaS/web use and prohibit raw-dataset redistribution. The GitHub pin still did not expose the promised sample assets or a complete downloadable EULA for independent inspection. | Lower-cost procurement lead, but obtain the checkout EULA, sample archive and licensor warranty before choosing it over MoveKit. |
| [RepDB](https://repdb.co/license/) | Commercial site advertises a 608-exercise Standard bundle with animations; the free GitHub dataset contains still WebP only. | License v1.2 clearly permits in-product image delivery and restricts bulk redistribution, but the displayed Standard license scope names WebP image assets while the separate media addendum mentions animation clips. | Do not assume animation-app rights from the marketing page. Obtain written clarification and the exact animation license delivered at checkout. |
| [wger](https://wger.de/api/v2/) | 78 current objects / 46 exercises; continuous video but inconsistent containers/codecs and large sources. | Every current video object is CC BY-SA 4 with author Goulart. Attribution/source-detail fields beyond the author are sparse. | Use as the open pilot, not the hundreds-scale library. |
| `hasaneyldrm` and its GIF forks | 1,324 180×180 looping GIFs. | Repository MIT grant expressly excludes the Gym visual media; the repository's private redistribution permission is not sublicensed. Forks cannot repair that rights gap by adding MIT/AGPL labels. | **Reject all copied GIFs.** Metadata/text only under the explicit MIT boundary. |

### Prior still-image fallback

Use a **small, locally vendored pack from `bryllim/workout-guide`**, pinned to commit [`aac599224bb9780305239607ef98540b7e0ce389`](https://github.com/bryllim/workout-guide/commit/aac599224bb9780305239607ef98540b7e0ce389), for the 11 starter exercises that have an honest movement/equipment match. Keep Rafik's own exercise IDs and content. Record the upstream ID, commit, asset path, SHA-256, creator, source lineage and CC BY-SA 4.0 obligations in a versioned manifest.

Do not hotlink the upstream files. Vendor the selected assets into Rafik-controlled, versioned storage/build output. The selected pack is 33 frames: 798,756 bytes of SVG or 1,129,600 bytes of the upstream 512px PNG equivalents. Both formats together are about 1.84 MiB before repository/build compression.

Leave `floor-press`, `stationary-cycle` and `low-step-up` text-only for now. The available bench press, assault bike and weighted high step-up artwork describes a materially different movement or setup.

The strongest reasons for this choice are:

- `workout-guide` expressly separates MIT code/documentation from **CC BY-SA 4.0 visual assets** in [`LICENSES.md`](https://github.com/bryllim/workout-guide/blob/aac599224bb9780305239607ef98540b7e0ce389/LICENSES.md) and [`LICENSE-ASSETS`](https://github.com/bryllim/workout-guide/blob/aac599224bb9780305239607ef98540b7e0ce389/LICENSE-ASSETS).
- Its checked-in [`manifest.json`](https://github.com/bryllim/workout-guide/blob/aac599224bb9780305239607ef98540b7e0ce389/packages/workout-guide/manifest.json) gives stable source IDs, paths, dimensions, format and per-exercise provenance. The project records the Everkinetic-derived subset in [`ATTRIBUTION.md`](https://github.com/bryllim/workout-guide/blob/aac599224bb9780305239607ef98540b7e0ce389/ATTRIBUTION.md).
- It ships exactly three consistent 512×512 frames per exercise in both SVG and PNG. The entire corpus is 302 exercises / 906 frames; Rafik does not need the entire corpus.
- Pinning and vendoring remove upstream uptime, branch mutation and mobile-network dependencies while keeping the license chain reviewable.

CC BY-SA 4.0 permits copying, adaptation and commercial use when attribution, license link and change notices are preserved; adaptations must use the same license and no additional legal/technical restrictions may prevent recipients from exercising those rights. See the [official deed](https://creativecommons.org/licenses/by-sa/4.0/) and [legal code](https://creativecommons.org/licenses/by-sa/4.0/legalcode). Rafik should ship a copy/link of the asset license and the attribution/provenance data. The application code and Rafik-authored catalog remain under their own terms; any modified artwork must remain CC BY-SA 4.0.

## What was checked

The GitHub [`workout` topic](https://github.com/topics/workout) listed `hasaneyldrm/exercises-dataset`, `wger-project/wger` and `bryllim/workout-guide` among current relevant repositories. Additional exercise-database candidates with explicit media offerings were checked directly.

Evidence methods:

- resolved each repository's default branch to a full commit SHA;
- read repository licenses, notices, manifests, schemas and source files at that commit;
- enumerated Git tree paths and blob sizes through the GitHub API without cloning the binary history;
- downloaded only small representative media samples and the 36 SVGs considered for the starter mapping;
- measured sample file headers/dimensions and inspected representative renders;
- queried the live wger API on 23 September 2026, while separately pinning the implementation source;
- scanned the 36 considered SVGs for scripts, `foreignObject`, event handlers, `href`/`xlink:href`, CSS imports/URLs and SVG animation elements.

Repository size values from the GitHub repository API are not used as transfer-size claims. All media footprint figures below are sums of the pinned Git tree's blob sizes.

## Source comparison

| Source | Pinned evidence and catalog contract | Media measured at the pin | License/provenance finding | Rafik decision |
|---|---|---|---|---|
| [`bryllim/workout-guide`](https://github.com/bryllim/workout-guide/tree/aac599224bb9780305239607ef98540b7e0ce389) | 302 manifest entries. Stable `exercise-*` ID plus slug, name, exercise type, equipment, primary/secondary muscles and exactly three frame records. | 906 SVGs, 25,898,785 bytes; 906 PNGs, 30,985,307 bytes. Manifest declares every frame 512×512 SVG. A sampled upstream PNG was 512×512 RGBA. Consistent monochrome transparent artwork. | Code/docs MIT; assets explicitly CC BY-SA 4.0. Bryl Lim is the named creator; 76 first-pose frames record Everkinetic lineage and changes. The manifest's Everkinetic source URLs use `main`, so Rafik must resolve and store a source commit too. | **Choose a curated 11-exercise subset.** Best traceability and lowest integration footprint. |
| [`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset/tree/7455efae41b330c265e7cd4b78dfa848e7ce5ebd) | 1,324 JSON records. String numeric ID, name, body part/category, equipment, target/muscles, ten-language instructions, `media_id`, local image/GIF paths and attribution. See its [`README`](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/README.md). | 1,324 JPEG thumbnails, 8,875,057 bytes; 1,324 GIFs, 128,741,397 bytes; JSON is 17,391,530 bytes. Sample JPEG and GIF were both 180×180; the GIF had 12 frames and 3,000 ms total declared duration. Sharp enough for small cards, visibly low-resolution for detail views. | The repository's [`LICENSE`](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/LICENSE) says MIT covers code, structure and instruction text, **not** `images/` or `videos/`. [`NOTICE.md`](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/NOTICE.md) says Gym visual granted the repository separate written permission but that cloning gives downstream users no media rights. Gym visual's own [terms](https://gymvisual.com/content/3-terms-and-conditions-of-use) restrict redistribution and license media to the purchaser/account owner. | **Reject media.** Metadata can be a discovery/reference source after editorial review; do not copy, serve or derive from the GIF/JPEG files without a Rafik-specific Gym visual license. |
| [`RepDB/exercise-dataset`](https://github.com/RepDB/exercise-dataset/tree/9ed9357f09c7566ea0256c57ebd6374ebb8b575e) | 601 JSON records claimed and encoded in one object with schema version/count. URL-safe slug IDs; multilingual EN/DE/ES names, descriptions, instructions and tips; classification, goals/tags, MET and image paths. | 1,056 flat WebP files, 17,460,738 bytes. Sample confirmed 512×512 WebP; catalog allows start/peak or one `main` pose and deliberate image aliases. Consistent colored illustration style. | The custom [`LICENSE-DATA.md`](https://github.com/RepDB/exercise-dataset/blob/9ed9357f09c7566ea0256c57ebd6374ebb8b575e/LICENSE-DATA.md) expressly permits personal/commercial **in-application** use with visible attribution. It forbids republishing the dataset/API, restricts derived dataset distribution and forbids generative-AI derivation. It says the images were AI-generated as original works commissioned by RepDB. Viewer code is separately MIT. | **Viable negotiated fallback, not the default.** A deployed in-app copy fits the stated grant, but an open source asset pack or general catalog API risks becoming prohibited dataset redistribution. Obtain written clarification or a paid license before putting its full data/assets in a public repository. |
| [`wger-project/wger`](https://github.com/wger-project/wger/tree/80d4a989cf7b0e98eb8817e1b725161857980803) plus [live API](https://wger.de/api/v2/) | Source code pin shown at left. Live API observed 910 exercise-base info records, 374 image objects and 78 video objects. Exercise, translation, image and video records carry UUIDs and license/author/source fields; [`sync.py`](https://github.com/wger-project/wger/blob/80d4a989cf7b0e98eb8817e1b725161857980803/wger/exercises/sync.py) uses UUIDs and propagates replacement/deletion logs. | Image API exposes originals plus 200px/400px thumbnails. Sample original was an 800×357 transparent PNG. Video records include size, duration, dimensions and codec; observed results included 640×352 to 3840×2160, MOV/MP4 and H.264/HEVC. Coverage and art style are uneven. | wger application code is AGPL-3.0, while catalog objects are separately licensed per object (the API listed five CC licenses). Per-media attribution can be incomplete; the first image record had a CC BY-SA 3 license ID but empty author/source fields. The live catalog is mutable and is not pinned by the application source commit. | **Good reference/API design, poor default pack.** If used later, take a dated export, retain every object's license/author/source fields and vendor only reviewed objects. Do not treat the AGPL repository license as the media license. |
| [`yuhonas/free-exercise-db`](https://github.com/yuhonas/free-exercise-db/tree/a859101d633a01c4a1a920d6a8ce41dabba0705f) | 876 per-exercise JSON files plus combined output. IDs are name-derived strings; schema covers force, level, mechanic, equipment, primary/secondary muscles, instructions, category and image paths, with several nullable fields. | 1,746 JPEGs, 98,671,281 bytes. Sample was 850×567; tree sizes ranged from 15,378 to 919,342 bytes. Two posed photos are typical. README acknowledges duplicates. | Repository uses the [`Unlicense`](https://github.com/yuhonas/free-exercise-db/blob/a859101d633a01c4a1a920d6a8ce41dabba0705f/LICENSE.md), but its [`README`](https://github.com/yuhonas/free-exercise-db/blob/a859101d633a01c4a1a920d6a8ce41dabba0705f/README.md) says it restructured [`wrkout/exercises.json`](https://github.com/wrkout/exercises.json/tree/5994bea047eee4d39a2c0872be3dd8fdd258ba31). Neither the schema nor README records a creator/source/license for each photograph. A repository-level public-domain dedication by a downstream maintainer does not demonstrate authority over untraced third-party photos. | **Reject media and bulk content import.** Useful for vocabulary comparison only. Do not hotlink its raw GitHub photographs. |
| [`exercisedb-pro/exercisedb-dataset`](https://github.com/exercisedb-pro/exercisedb-dataset/tree/36525388e100765cf4a1341fb2ea2ec057c1299b) | The pinned tree contains one file, `README.md`. It advertises a paid 1,500+ catalog and a free starter, but no machine-readable catalog or sample media is present in the repository at the pin. | README claims 1080p MP4, but no repository media could be measured or inspected. | No repository `LICENSE` was present at the pin. The README's commercial-license statements are marketing summaries, not reviewable contract terms. | **Reject pending procurement evidence.** Reassess only with the actual license, asset sample, manifest/schema, update entitlement and redistribution/offline terms. |

### Evidence boundaries

- Live wger counts are a timestamped observation, not a pinned catalog snapshot. They can change independently of commit `80d4a989...`.
- Visual inspection sampled representative files; it does not certify exercise technique. Every mapped visual still needs a coach/content review in the actual Rafik interface.
- The 36-file SVG safety scan covers the 12 `workout-guide` candidates considered for Rafik's starter set, not all 906 upstream SVGs.
- Repository statements establish the licensor's published claim. They do not independently prove every contributor's chain of title. `workout-guide` is materially stronger than scraped-photo/GIF alternatives because it names the creator, separates licenses and records its known derivative lineage.

## Exact starter mapping

All accepted source paths are under:

```text
https://raw.githubusercontent.com/bryllim/workout-guide/
  aac599224bb9780305239607ef98540b7e0ce389/
  packages/workout-guide/assets/<source-slug>/frame-<1|2|3>.<svg|png>
```

The raw URL is a deterministic acquisition input, not a runtime URL. Fetch during a reviewed update, verify SHA-256, then serve the copied file from Rafik-controlled storage.

| Rafik exercise ID | Upstream ID / slug | Decision | Evidence and caveat |
|---|---|---|---|
| `goblet-squat` | `exercise-goblet-squat` / `goblet-squat` | Accept | Dumbbell goblet squat; exact equipment and movement. |
| `dumbbell-row` | `exercise-one-arm-dumbbell-row` / `one-arm-dumbbell-row` | Accept | Render shows a one-arm dumbbell row supported on a bench, matching Rafik's setup. |
| `floor-press` | none | **No media** | `dumbbell-bench-press` changes support surface and range of motion. Do not substitute. |
| `romanian-deadlift` | `exercise-dumbbell-romanian-deadlift` / `dumbbell-romanian-deadlift` | Accept | Use the dumbbell-specific item, not the upstream generic/barbell Romanian deadlift. |
| `split-squat` | `exercise-split-squat` / `split-squat` | Accept | Source shows dumbbells; Rafik explicitly permits bodyweight **or** dumbbells. |
| `glute-bridge` | `exercise-glute-bridge` / `glute-bridge` | Accept | Exact bodyweight movement. Frame 1 is derived from Everkinetic; retain the source/change record below. |
| `overhead-press` | `exercise-seated-dumbbell-press` / `seated-dumbbell-press` | Accept | Exact seated dumbbell shoulder press. Do not map to barbell `overhead-press`. |
| `dead-bug` | `exercise-dead-bug` / `dead-bug` | Accept | Exact bodyweight movement. |
| `forearm-plank` | `exercise-plank` / `plank` | Accept after render inspection | The source name is generic, but the rendered frames show a forearm plank, matching Rafik. |
| `brisk-walk` | `exercise-walking` / `walking` | Accept with label caveat | Render shows treadmill walking; Rafik permits a route or treadmill. “Brisk” is prescribed intensity and is not inferable from a still frame. |
| `stationary-cycle` | none | **No media** | `assault-bike` adds moving arm handles and is a different machine/movement. |
| `incline-pushup` | `exercise-incline-push-up` / `incline-push-up` | Accept | Exact bodyweight incline push-up on a raised stable surface. |
| `low-step-up` | none | **No media** | Upstream `step-up` shows dumbbells and a high bench; Rafik prescribes a low stable step. |
| `band-row` | `exercise-banded-row` / `banded-row` | Accept | Exact resistance-band row. Rafik's instruction remains authoritative about checking the anchor. |

### Selected-source attribution

For ten selected items the manifest names Bryl Lim as creator and no upstream source. `glute-bridge` additionally records:

- source: Everkinetic `dist/svg/0109-tension.svg`;
- currently resolvable upstream commit: [`446bb9a3d0c3beb6b84f7c9d77dfc8af707a2ab6`](https://github.com/everkinetic/data/commit/446bb9a3d0c3beb6b84f7c9d77dfc8af707a2ab6);
- pinned source file: [`dist/svg/0109-tension.svg`](https://github.com/everkinetic/data/blob/446bb9a3d0c3beb6b84f7c9d77dfc8af707a2ab6/dist/svg/0109-tension.svg);
- upstream license: [`CC BY-SA 4.0`](https://github.com/everkinetic/data/blob/446bb9a3d0c3beb6b84f7c9d77dfc8af707a2ab6/LICENSE.md);
- upstream-recorded changes: rasterized on a transparent 512×512 canvas, recolored for monochrome display, and vector-traced.

The upstream URL embedded in `workout-guide` uses `main`. Rafik's manifest should store the resolved Everkinetic commit and source hash so provenance does not drift when that link is opened later.

### Integrity values for accepted SVGs

Hashes below are frame 1 / frame 2 / frame 3 at the pinned `workout-guide` commit.

| Source slug | SHA-256 values |
|---|---|
| `goblet-squat` | `f94a73243089f6a472e0fdcca604ae26f940b2dae4216b7280cf0f6867a34c63` / `cbe23f873b6d1f4102356553df02b25fdee21897d82c261b8d09bbcdd2b2e10e` / `57a91dd57805784263701ff6363965b40512d919f829840b59b43c4a10f7a90a` |
| `one-arm-dumbbell-row` | `b818e63d8dc40bf3bd1b59aa9fa91fd5c7bdfed99bbb2ac599c4bed328a7de2f` / `0d1000130af10a095a2625e2f0fda0c11a4f8aa126ebf583a100ae21e1b467f7` / `fadaa4327b6c68fcfa52944054a5a8d9e5c87f51504736d718157169ea11eea5` |
| `dumbbell-romanian-deadlift` | `ff05da6e13d1f1cc053af32e37b0cf4c2c47f472bf2f53706c7061b484f9ad05` / `6b34ffe50fb458f1386a06bf953d8c5d711383a3c42656282c65abc857f5cb29` / `69c4840c349b7aee96943f6cebba36e333c4128b19a781d67b8420e1f9a8dc32` |
| `split-squat` | `f90ccc390934a79a9086b0eb7df46e92bcd02bd9fa47b466d3bbdc6e49c21b12` / `60669abf49ce69010f94667c590c2bc900eea033f44b9f84bf0f7199fdf09406` / `909c0cd68f17c2cd37acd1191863f22442bb53d0a1bb0fea875b5a74b80ce01b` |
| `glute-bridge` | `64830d042d3ef122b54391cee0339f60d10dc05a79007893f56f6ba35c344e96` / `4eeffd0c95b32e0306bed86b9cda802ad3b3ac52135bd1f49f4939569f113375` / `693e4d8dc5140804c02caf66fa69df4ac97cbb8f6e41a665d5b6adb7fa3b49f1` |
| `seated-dumbbell-press` | `78d50c1ac770871a58d7637777f60e9b7fcb0c939415ca4c7e1fdd9919e7536e` / `bbc8675ddb73d4131836950ccbf7abefe526b670840473fd363e118d0dc926e9` / `8922a6edac1722d972236bcb85d32fbbcd9e97cbe7123fe43e5c97b4535eb6fe` |
| `dead-bug` | `0e1208250b923348fbf170f163e581be3dcc1ce7f906b14766da59a7801206a2` / `333a91ce60ff475586a813310cffc705231956511f86d1c191b31d0878005842` / `63f83858a148877d987a8b661eca1cc18157595225aa36f07ed2f171f07e77ac` |
| `plank` | `0f65a842d151f80918e4ee45d1a9f659dd5a82e2d9857c9ad6ae06832a872e94` / `00210f9137bfe8e801e9287f1ba9427fe841b1128a4e8f69ea8b1bcb96c9d4a7` / `d768cc8d2ad533e840eece02df9e79ad4836f59990dc6dea5e1b2005b27e892c` |
| `walking` | `bfacc7f4c46f8f682b24f5e645e2e2a5262fc13aaee0a59f95cd8f195ac5ed95` / `8661f5b938bfc6cf0eed3a7b446d7ac835e05d1ec9a7fcef50c80bfc7d4b36a5` / `7e093c58eb2ccdce160ab7d3c898d51ac536ca486239c7eda005b59127d83eff` |
| `incline-push-up` | `14278ef039b0942e06b7aba35a1e5836662c332ece834f83f6828b98edfac22c` / `38ca6cfa445582bca9cd95c0dc44ad1ae8fd1da63d2b650bc3b7e926325aab80` / `7a7aa9ce71bbd1bc0abcdfd240d6bcc3ecb50ccba7cd61eebbc362a29f282cf1` |
| `banded-row` | `76ff5bff05eb6344c4c800a523449c923add18a368b67845c17f7f39171c1cfe` / `66ff0ce671ec604d4ad40006334a7eca1b3476786d91042c44f44ace60f27991` / `fed17d46a373035d8b6697f7d230cb4b3e2ab00844cebfee5cf02e8f47777751` |

## Bounded Rafik manifest contract

The source catalog must not become Rafik's runtime identity model. Keep `goblet-squat` and the other Rafik IDs stable; attach an independently versioned media asset record.

Recommended minimum record:

```json
{
  "schemaVersion": 1,
  "packId": "rafik-starter-exercise-media",
  "packVersion": "2026-09-23.workout-guide-aac5992",
  "exerciseId": "goblet-squat",
  "source": {
    "provider": "bryllim/workout-guide",
    "repository": "https://github.com/bryllim/workout-guide",
    "commit": "aac599224bb9780305239607ef98540b7e0ce389",
    "sourceExerciseId": "exercise-goblet-squat",
    "sourceSlug": "goblet-squat"
  },
  "license": {
    "spdx": "CC-BY-SA-4.0",
    "url": "https://creativecommons.org/licenses/by-sa/4.0/",
    "creator": "Bryl Lim",
    "creatorUrl": "https://bryllim.com",
    "attribution": "Exercise artwork by Bryl Lim, licensed under CC BY-SA 4.0.",
    "modified": false
  },
  "presentation": {
    "frameSemantics": ["start", "middle", "end"],
    "background": "dark-required",
    "motion": "manual-or-reduced-motion-aware"
  },
  "assets": [
    {
      "frame": 1,
      "sourcePath": "packages/workout-guide/assets/goblet-squat/frame-1.svg",
      "localKey": "exercise-media/2026-09-23/goblet-squat/frame-1.svg",
      "mime": "image/svg+xml",
      "width": 512,
      "height": 512,
      "sha256": "f94a73243089f6a472e0fdcca604ae26f940b2dae4216b7280cf0f6867a34c63"
    }
  ]
}
```

For the later native application, add the upstream PNG counterpart to each frame or generate a recorded derivative. Keep the same `exerciseId`, pack/version, source commit and attribution. A generated derivative must set `modified: true`, describe the conversion and remain CC BY-SA 4.0. React Native's standard static image contract is strongest for literal local PNG `require()` calls; Expo also supports SVG through its image/SVG tooling, but SVG rendering has platform caveats. See the official [React Native static-image guidance](https://reactnative.dev/docs/images), [Expo assets guide](https://docs.expo.dev/develop/user-interface/assets/) and [Expo SVG guidance](https://docs.expo.dev/versions/v56.0.0/sdk/svg/).

## Media rendering and safety findings

- The 33 accepted SVGs are 512×512, one self-contained `<svg>` with path data and no text. All considered SVGs use white `#fff` artwork on transparency. They disappear on a plain white surface, so render them on a fixed dark branded tile in both themes or create and record a reviewed color adaptation.
- The 36 considered SVGs contained no `<script>`, `<foreignObject>`, event-handler attributes, `href`/`xlink:href`, CSS `url()`/`@import`, or SVG animation elements. This is a bounded static scan, not a permanent trust exemption: every future source update must repeat it after the hash check.
- Three frames are pose samples, not a time-calibrated animation. If Rafik cycles them, do not imply exact cadence. Offer manual frame selection/pause and honor reduced-motion preferences.
- Use concise alt text derived from Rafik's reviewed exercise label and frame purpose, not from the upstream name alone. The workout remains usable with text when an asset is absent or fails.
- Keep attribution reachable from the exercise detail and centralized Credits/About surface. Store the full provenance in the data record and shipped license inventory even if the visible card uses concise credit.

## Offline, API and immutable-snapshot contract

1. **Acquire at build/content-update time.** A bounded script reads Rafik's allowlist, downloads only the exact commit paths, checks SHA-256, validates MIME/dimensions and scans SVG active content. Branch URLs and runtime GitHub fetches fail the gate.
2. **Serve Rafik-controlled immutable keys.** API/content output refers to `packId`, `packVersion`, `localKey`, width/height, format and frame semantics. It never returns a mutable GitHub `main` URL as the canonical media location.
3. **Separate identity.** Rafik's exercise ID is authoritative. `sourceExerciseId` is provenance only. Upstream rename/delete never rewrites a published Rafik exercise or workout history.
4. **Snapshot the resolved media reference.** Published plan versions and started workout prescriptions are already immutable. Store the resolved pack/version and local asset keys in the exercise snapshot so later catalog refreshes do not silently change old prescriptions.
5. **Cache deliberately.** Web production can precache this bounded starter pack or cache on first use under the versioned URL. A new pack version is additive until no retained snapshot references the old one. Do not delete old bytes merely because a newer catalog exists.
6. **Native packaging.** Generate a literal asset map for accepted PNG/SVG files at build time. For optional later packs, download a signed/hash-verified manifest and bytes before marking the pack available offline; preserve the previous complete pack through interrupted updates.
7. **Failure behavior.** Missing, corrupt, unsupported or unlicensed media degrades to the reviewed exercise name/instructions. Media must not block plan editing, session start, actual entry, completion, history or export.
8. **Attribution export.** Include the pack/version, creators, source repository/commit, license link, changes and upstream lineage in Rafik's third-party notices. If exercise data is exported, include media metadata/credit, not necessarily licensed media bytes.

## Why runtime hotlinking is rejected

- A branch URL can change content without changing Rafik's published plan snapshot or review receipt.
- The upstream owner can rename/delete a file, archive a repository or change hosting behavior.
- Offline web/native use would fail before the external request succeeds.
- Runtime requests disclose device/network access to a third party and make cache invalidation harder to control.
- GitHub reserves the right to throttle excessive file-hosting bandwidth in its [Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies). Raw GitHub is useful for pinned acquisition, not a Rafik production CDN.
- Hotlinking does not solve licensing. A reachable URL is not a redistribution license; `hasaneyldrm` is the clearest example because its media is publicly readable while its license expressly withholds downstream rights.

## Rejected shortcuts

- **Do not infer media permission from a repository badge or top-level software license.** Check the asset directories and per-object fields separately.
- **Do not import all 1,324 Gym visual GIFs because the JSON is MIT.** The repository expressly says the media is excluded and downstream users need their own rights.
- **Do not accept “public domain” photographs without origin records.** `free-exercise-db` does not provide per-photo creator/source/license evidence.
- **Do not substitute a visually similar exercise to maximize coverage.** Floor versus bench press, stationary versus assault bike, and low unweighted versus high weighted step-up change the task the user performs.
- **Do not bind Rafik IDs to upstream names/paths.** Use a source mapping layer so corrections do not mutate history.
- **Do not treat a screenshot or successful render as technique validation.** A qualified coach/content reviewer must approve pose accuracy, equipment, start/end ordering and user-facing instructions in both English and Arabic.

## Next recommended task

Build and review the 11-item allowlisted media pack in the frontend/content repository:

1. fetch from the pinned `workout-guide` commit and verify the hashes above;
2. retain the upstream license/attribution files and generate Rafik's manifest/credits;
3. use a fixed dark media tile, text fallback and reduced-motion-aware three-frame presentation;
4. inspect all 11 exercises in the actual list/detail/session flows at phone/desktop, English/Arabic and both themes;
5. have a coach approve movement identity and frame order;
6. leave the three rejected mappings text-only until purpose-made or explicitly licensed exact media is available.

## Claim verification record

This report's material claims were extracted after drafting and rechecked against the pinned files, Git tree measurements, downloaded samples and live API responses described above. Exact counts and byte totals were re-run from the same commit SHAs. Licensing statements were checked against each source's actual license/notice rather than inferred from GitHub's repository badge. The three mapping exclusions were based on source metadata plus rendered first-frame inspection. Uncertainties and live-data limits are stated in “Evidence boundaries.”

The final acquisition-integrity rerun on 23 September 2026 fetched all 33 accepted SVG paths from commit `aac599224bb9780305239607ef98540b7e0ce389`: every file matched its recorded SHA-256 and the byte sum was 798,756. The pinned `LICENSES.md`, `LICENSE-ASSETS`, `ATTRIBUTION.md` and `manifest.json` URLs, plus the official CC BY-SA 4.0 legal code, returned successfully during the same pass.
