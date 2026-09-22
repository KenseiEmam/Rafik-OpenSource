# Content and asset ownership

The initial exercise catalog is eight authored English/Arabic entries, with two full-body starter sessions. Names, equipment, instructions, prescription values and stable IDs live in `content/starter.json`. They generate the local SQL seed and the web's public sample. This is intentionally a small useful starting set, not an exercise-library migration.

`npm run content` regenerates both outputs. `npm run content:check` detects divergence. Validate the reset and inspect the affected exercise in the plan editor, sample and logger. Keep exercise IDs stable; a spelling/instruction change does not require a new ID. A materially different movement does.

The starter's loads are labelled sample values, editable in the logger. The source distinguishes per-dumbbell recording and bodyweight at zero. Preferred units convert the numerical value; recorded history retains its actual unit. A coach's published plan is a fixed prescription, and later edits do not modify a started session.

## Assets

- `RAFIK-FRONTEND/public/brand/rafik.png`: existing supplied Rafik brand mark, retained from the original repository.
- `RAFIK-FRONTEND/public/images/training.png`: generated during the revamp with the imagegen tool. Decorative gym lifestyle image; it is not a customer photo, testimonial, or exercise demonstration. No training instruction depends on it.
- Manrope Variable and Noto Sans Arabic: self-hosted through pinned Fontsource packages, with their package license files retained in dependencies. Phosphor icons use the pinned Vue package. No external font or icon CDN is needed at runtime.
- No old customer photos, exercise videos, AI food assets or unverified remote media have been migrated.

The local Auth identities and any browser-test sessions are synthetic. Do not migrate them to hosting. The source currently binds the public starter to its local fixture version ID; the hosted release gate must create a production-owned starter and regenerate that binding.

## Maintenance rehearsal

During construction, the unit preference was carried through the new-session command to the actual set values, with a database scenario proving 4 kg becomes 8.82 lb. Another scenario proved that changing a future published load from 8 to 12 leaves the started prescription at 8. These are representative domain changes: one explicit command/validation owner and bounded UI consumers, with no trigger cascade or worker changes.
