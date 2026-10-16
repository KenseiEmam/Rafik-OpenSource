# R15 exercise library correction

## Acceptance failure and corrective rule

The prior implementation optimized for a small, easily checked asset pack. That decision contradicted the requested broad exercise catalog. Tests covered opening the preview and stepping through poses; they did not ask whether a coach could discover a useful range of movements or immediately understand the demonstration. A feature may pass its implementation tests while failing the requested job.

Acceptance now distinguishes **catalog coverage**, **media coverage**, **discoverability** and **complete workflow integration**. Counts, source licenses and unsupported cases are explicit. A review must exercise a later-page result, compound category filters, a selected preview, keyboard/phone navigation, the program picker, publication/snapshot retention and error recovery. Do not narrow a requested corpus silently to records already present in fixtures.

## Implementation map

- Backend content generators and forward migrations import the catalog without resetting local preview data.
- `content/exercise-dataset.json`: pinned metadata/instructions, source digest and MIT notice.
- `content/upstream/wger/`: dated source records, separate text/video licensing and editorial supplements.
- `content/exercise-videos.json` and `content/exercise-videos/`: immutable motion pack and byte hashes.
- `server/public-catalog.ts` / `server/index.ts`: public source manifests and range-capable video/poster reads.
- Web `ExercisesPage.vue`: paged library, categories, selected details, custom authoring and phone navigation.
- Web `ExercisePicker.vue` / `PlanEditor.vue`: bounded searchable selection and approved alternative chips.
- Web `ExerciseDemo.vue` / `ExerciseVideo.vue`: continuous playback when available; honest static reference and text fallback.
- Web `exercise-catalog.ts` / `exercise-media.ts`: facet labels and reference lookup shared by consumers.

## Verification

The backend passed a disposable installation of 30 migrations and eight rollback SQL suites, six content/media contract tests and three programming/media lifecycle tests. The web production build and 27 unit tests pass. Browser acceptance passed 34 combined cases and six final focused cases after the popup direction fix, across Chromium and phone WebKit. The [receipt](evidence/r15-verification.txt) records exact commands and the final delta; prior R14 results are historical, not acceptance for this correction.

Developer review additionally caught and corrected lossy compound equipment facets, source translator text being shown as a technique step, and phone filters pushing every exercise below the entry viewport. Source correction uses a new forward migration; published instructions stay immutable. Phone filters are collapsed initially and removed from the selected-detail screen, with an explicit return to results. The import corpus has ten body areas; shared equipment normalization is used in the catalog and both program pickers.

### Failures found during acceptance

The initial browser attempts were not accepted: picker query ordering selected the wrong exercise, implicit-label selectors matched option text unexpectedly, and a nutrition test assumed the first “Goblet” match was the old starter after broadening the corpus. Stable exercise identity and accessible control roles replaced those test assumptions. Actual Arabic visual inspection found a scoped `:global` arrow selector compiling to `[dir=rtl]` and rotating the page; the selector is now scoped with `:dir(rtl)`, with an explicit root-orientation regression check. These are recorded as failures and corrections, not successful verification counts.

A subsequent screenshot review caught a second kind of false acceptance: the picker mounted forty options and keyboard selection worked, while wrapped filters consumed the popup height and clipped the list. The final picker starts with results, reveals category controls on request, offers one-click filter reset and uses one scrolling container. Acceptance checks an option's actual intersection with the popup/viewport; screenshots are viewport-sized and named per browser.

The final Arabic popup review also found that Reka Popper Content defaults to LTR without an explicit direction/global provider, even when its Combobox Root has RTL. Both exercise and timezone content now receive locale direction; untranslated exercise names use automatic text direction. Focused acceptance asserts computed popup direction and inspects the resulting Arabic screenshot.
