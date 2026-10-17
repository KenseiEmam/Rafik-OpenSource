# ADR 0011: Broad exercise catalog and genuine motion previews

Status: accepted for local implementation, 23 September 2026. Supersedes the exercise-coverage and manual-step-viewer choices in ADR 0010; its nutrition decisions remain unchanged.

## Problem

R14 attached ten illustration sets to fourteen starter exercises. It did not deliver the requested exercise library. Its three-frame step controls added interaction without showing continuous motion. Successful geometry and mechanical tests did not establish content coverage or usefulness. The founder rejected that result.

## Decision

- Import all 1,324 MIT metadata/English-instruction records from the pinned `hasaneyldrm/exercises-dataset`. Exclude its separately restricted Gym visual images/GIFs. Stable `dataset-*` IDs preserve source identity; the fourteen original Rafik IDs remain valid.
- Import 46 separate wger exercises paired with their own source videos. Do not infer equivalence to a Rafik or dataset exercise from similar names. Keep exercise text licenses separate from video licenses and retain source-language provenance for translated instructions.
- Vendor 45 continuous-motion videos matched to their own wger exercises, encoded as muted H.264 MP4 at at most 640px with fast-start metadata. Videos and extracted posters retain CC BY-SA 4.0 attribution, hashes and an unencumbered public download. They are real source footage; no synthesized intermediate poses.
- Use `category`, `body_part` and `target_muscle` metadata for discovery; `kind` remains Rafik's recording contract. Normalize body-area facets for shared content and allow coaches to categorize their own content. Missing Arabic exercise names/instructions fall back visibly to English; translated controlled filters are available.
- Separate catalog breadth from starter content. New shared records enter through forward migrations, not a larger synthetic user seed. Existing assignments, prescriptions and completions are not rewritten.
- Browse compact, paged results next to a selected exercise's visible demonstration and written steps. Phone selection has a clear back action. Filters include body area, equipment, recording type, personal/archive scope and media availability.
- Program pickers search the complete authorized catalog while mounting at most forty matching options. Selected identities and alternative chips survive searches; alternatives retain the same recording type and maximum-three rule.
- Start muted video when visible, pause outside the viewport/background, respect reduced motion and expose play/pause/retry. Static illustrations show their three reference positions together, with no manual slideshow controls.

## Options considered and trade-offs

- **Keep the small starter catalog and frame-by-frame illustrations:** rejected because they do not provide useful library breadth or continuous motion.
- **Copy visual assets from the metadata dataset:** rejected because their rights differ from the dataset text license.
- **Combine separately licensed metadata and video sources with explicit provenance:** selected; the catalog is broad but motion coverage remains partial and source content requires human editorial review.

## Storage and compatibility

`media_ref` remains an immutable string in published/start snapshots. The motion manifest resolves that reference into MIME type, video/poster URLs, attribution and hashes. Public byte-range responses support browser seeking and later native players. Custom and organization-owned exercises resolve explicit references; only shared legacy records use an exact source-ID fallback.

The small original illustration pack remains in the offline shell. The motion pack is fetched on demand from the API; it is not an automatic download during app installation. Offline written instructions and workout recording remain available. Persistent native video downloads are a later, explicit storage policy; no native implementation is claimed here.

## Consequences

1,384 shared exercise entries are available before personal/organization additions: 1,324 requested-source entries, 46 wger entries and 14 original starters. These are source entries, not 1,384 unique biomechanical movements; overlapping sources are retained with distinct identity/provenance. There are 45 continuous-motion videos, not video coverage for the full catalog. Broad commercial media coverage still requires appropriate rights or another verified source. The requested repository's media exception is not a reason to withhold its licensed data.

Source content is not professional technique certification. Imported English content and recorded demonstrations still need editorial/human review before production. The implementation must not describe browser tests as human usability validation.
