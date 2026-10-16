// Create the separately licensed WGER shared-exercise import from the reviewed
// dated record snapshot. No WGER video, image URL or HTML is copied here.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const reviewPath = resolve(
  root,
  "coordination/outputs/agent1_corpus/wger-exercise-records-46-2026-09-23.json",
);
const supplementPath = resolve(
  root,
  "coordination/outputs/agent1_corpus/wger-english-supplement-9-2026-09-23.json",
);
const editorialOverlayPath = resolve(
  root,
  "content/upstream/wger/editorial-overrides.json",
);
const snapshotPath = resolve(
  root,
  "content/upstream/wger/exercise-snapshot.json",
);
const migrationPath = resolve(
  root,
  "prisma/migrations/202609231540_wger_shared_exercises/migration.sql",
);
const expectedReviewSha256 =
  "7924e1112642c801c2a6949bd7a8e206f3682687c0136bb85308313685ec022b";
const expectedSupplementSha256 =
  "ce72d9e5459bdbb643ec15eca1cb01a19d7dc9af2061bf12b6ea408ec95af9b3";
const expectedEditorialOverlaySha256 =
  "c2d4fd8351fb4457ad95f88e980108f3b917569699ffc0ee8644d67a02f6e4eb";
const expectedHistoricalMigrationSha256 =
  "1479f9af4c5a719d188a48a9e4e7fb393b676b00dcf4755f79106739646338bd";
const categories = {
  Legs: {
    category: "upper legs",
    bodyPart: "upper legs",
    categoryAr: "الفخذان",
  },
  Chest: { category: "chest", bodyPart: "chest", categoryAr: "الصدر" },
  Shoulders: {
    category: "shoulders",
    bodyPart: "shoulders",
    categoryAr: "الكتفان",
  },
  Arms: {
    category: "upper arms",
    bodyPart: "upper arms",
    categoryAr: "أعلى الذراعين",
  },
  Back: { category: "back", bodyPart: "back", categoryAr: "الظهر" },
  Calves: {
    category: "lower legs",
    bodyPart: "lower legs",
    categoryAr: "أسفل الساقين",
  },
};
const equipmentAr = {
  Barbell: "بار حديد",
  Bench: "مقعد",
  Dumbbell: "دمبل",
  "Cable machine": "جهاز كابل",
  "none (bodyweight exercise)": "وزن الجسم",
  "SZ-Bar": "بار إي زد",
  "Pull-up bar": "بار عقلة",
  "Incline bench": "مقعد مائل",
};
const hash = (value) =>
  createHash("sha256")
    .update(
      Buffer.isBuffer(value) || typeof value === "string"
        ? value
        : JSON.stringify(value),
    )
    .digest("hex");
const stableJson = (value) => JSON.stringify(value, null, 2) + "\n";

function snapshotFromReview(reviewFile, supplementFile, overlayFile) {
  const bytes = readFileSync(reviewFile);
  if (hash(bytes) !== expectedReviewSha256)
    throw Error(
      "Unexpected WGER review snapshot digest; review provenance before replacing it.",
    );
  const review = JSON.parse(bytes);
  if (!Array.isArray(review.records) || review.records.length !== 46)
    throw Error("Expected 46 reviewed WGER exercise records.");
  const supplementBytes = readFileSync(supplementFile);
  if (hash(supplementBytes) !== expectedSupplementSha256)
    throw Error(
      "Unexpected WGER instruction supplement digest; review it before replacing it.",
    );
  const supplement = JSON.parse(supplementBytes);
  if (!Array.isArray(supplement.records) || supplement.records.length !== 9)
    throw Error("Expected nine reviewed WGER instruction supplements.");
  const additions = new Map(
    supplement.records.map((record) => [record.exerciseId, record]),
  );
  const overlayBytes = readFileSync(overlayFile);
  if (hash(overlayBytes) !== expectedEditorialOverlaySha256)
    throw Error(
      "Unexpected WGER editorial overlay digest; review it before replacing it.",
    );
  const overlay = JSON.parse(overlayBytes);
  if (!Array.isArray(overlay.records))
    throw Error("Expected a WGER editorial overlay record list.");
  const overrides = new Map(
    overlay.records.map((record) => [record.id, record]),
  );
  const ids = new Set();
  const records = review.records.map((record) => {
    const translation = record.englishTranslation;
    const category = categories[record.category?.name];
    if (
      !Number.isInteger(record.exerciseId) ||
      ids.has(record.exerciseId) ||
      !translation?.name?.trim() ||
      !category
    )
      throw Error(`Incomplete or unmapped WGER record: ${record.exerciseId}`);
    ids.add(record.exerciseId);
    const tools = record.equipment.map((item) => item.name);
    if (tools.some((item) => !equipmentAr[item]))
      throw Error(`Untranslated controlled equipment: ${record.exerciseId}`);
    const addition = additions.get(record.exerciseId);
    const id = `wger-${record.exerciseId}`;
    const override = overrides.get(id);
    if (
      override &&
      Object.keys(override).some(
        (key) =>
          ![
            "id",
            "name",
            "equipment",
            "equipmentAr",
            "instructions",
            "reason",
          ].includes(key),
      )
    )
      throw Error(`Unexpected editorial override field: ${id}`);
    const sourceInstructions =
      addition?.englishDescription?.trim() ||
      translation.descriptionText?.trim() ||
      "";
    const description = override?.instructions?.trim() || sourceInstructions;
    if (!description)
      throw Error(
        `Missing reviewed English instructions: ${record.exerciseId}`,
      );
    const primary = record.primaryMuscles
      .map((muscle) => muscle.name_en || muscle.name)
      .filter(Boolean)
      .join(", ");
    const isTimed = /\bhold\b|\bisometric\b/i.test(translation.name);
    return {
      id,
      sourceId: record.exerciseId,
      sourceUuid: record.exerciseUuid,
      sourceUrl: record.sourceApiUrl,
      name: override?.name?.trim() || translation.name.trim(),
      nameAr: null,
      instructions: description,
      instructionsAr: null,
      instructionStatus: override?.instructions
        ? "rafik_editorial_overlay"
        : addition
          ? addition.mode.replaceAll("-", "_")
          : "source",
      instructionProvenance: override?.instructions
        ? {
            mode: "rafik-editorial-overlay",
            statement: overlay.provenance,
            reason: override.reason,
          }
        : addition
          ? {
              mode: addition.mode,
              statement: addition.provenance,
              source: {
                translationId: addition.source.translationId || null,
                translationUuid: addition.source.translationUuid || null,
                language: addition.source.language?.short_name || null,
                license:
                  addition.source.license ||
                  addition.source.videoLicense ||
                  null,
                licenseAuthor: addition.source.licenseAuthor || null,
              },
            }
          : {
              mode: "upstream-english",
              source: {
                translationId: translation.id,
                translationUuid: translation.uuid,
                language: "en",
                license: record.exerciseLicense,
                licenseAuthor: translation.licenseAuthor,
              },
            },
      category: category.category,
      categoryAr: category.categoryAr,
      categorySource: record.category.name,
      bodyPart: category.bodyPart,
      targetMuscle: id === "wger-12" ? "unspecified" : primary || "unspecified",
      equipment: override?.equipment?.trim() || tools.join(", "),
      equipmentAr:
        override?.equipmentAr?.trim() ||
        tools.map((item) => equipmentAr[item]).join("، "),
      kind: isTimed ? "timed" : "strength",
      exerciseLicense: record.exerciseLicense,
      exerciseLicenseAuthor: record.exerciseLicenseAuthor,
      translationLicense: {
        id: translation.licenseId,
        title: translation.licenseTitle,
        author: translation.licenseAuthor,
        authorUrl: translation.licenseAuthorUrl,
        derivativeSourceUrl: translation.licenseDerivativeSourceUrl,
      },
      editorialOverlay: override
        ? {
            fields: ["name", "equipment", "equipmentAr", "instructions"].filter(
              (key) => key in override,
            ),
            reason: override.reason,
            provenance: overlay.provenance,
          }
        : null,
    };
  });
  return {
    schema: 1,
    source: {
      project: review.source.project,
      sourceCommit: review.source.sourceCommit,
      liveApiBase: review.source.liveApiBase,
      snapshotDate: review.snapshotDate,
      reviewSha256: expectedReviewSha256,
      instructionSupplementSha256: expectedSupplementSha256,
      editorialOverlaySha256: expectedEditorialOverlaySha256,
      recordCount: records.length,
      policy:
        "Use source English description text, the separately reviewed English supplement where upstream English is blank, and reviewed editorial corrections. No WGER image, video, source-media URL or HTML is imported.",
    },
    licenses: review.licenseDictionary,
    categoryMap: categories,
    recordsSha256: hash(records),
    records,
  };
}

function validate(snapshot) {
  if (
    snapshot?.schema !== 1 ||
    snapshot?.source?.reviewSha256 !== expectedReviewSha256 ||
    snapshot?.source?.instructionSupplementSha256 !==
      expectedSupplementSha256 ||
    snapshot?.source?.editorialOverlaySha256 !==
      expectedEditorialOverlaySha256 ||
    snapshot?.source?.recordCount !== 46 ||
    !Array.isArray(snapshot.records) ||
    snapshot.records.length !== 46
  )
    throw Error("Unexpected WGER catalogue provenance or record count.");
  if (snapshot.recordsSha256 !== hash(snapshot.records))
    throw Error("WGER catalogue digest does not match its records.");
  const ids = new Set();
  for (const record of snapshot.records) {
    if (!/^wger-\d+$/.test(record.id) || ids.has(record.id))
      throw Error(`Invalid or duplicate WGER ID: ${record.id}`);
    ids.add(record.id);
    if (
      record.nameAr !== null ||
      record.instructionsAr !== null ||
      !categories[record.categorySource] ||
      !record.category ||
      !record.bodyPart ||
      !record.targetMuscle ||
      !["strength", "timed"].includes(record.kind)
    )
      throw Error(`Invalid WGER controlled metadata: ${record.id}`);
    if (
      !record.instructions ||
      ![
        "source",
        "rafik_authored",
        "translated_from_upstream",
        "rafik_editorial_overlay",
      ].includes(record.instructionStatus) ||
      !record.instructionProvenance?.mode
    )
      throw Error(
        `Missing reviewed English instruction provenance: ${record.id}`,
      );
    if (
      !record.exerciseLicense?.short_name ||
      !Number.isInteger(record.translationLicense?.id)
    )
      throw Error(`Missing WGER licence provenance: ${record.id}`);
  }
}

const fromReview = process.argv.includes("--from-review");
const generated = snapshotFromReview(
  reviewPath,
  supplementPath,
  editorialOverlayPath,
);
let snapshot;
if (fromReview) {
  snapshot = generated;
  validate(snapshot);
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, stableJson(snapshot));
} else snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
validate(snapshot);
if (process.argv.includes("--check")) {
  if (stableJson(snapshot) !== stableJson(generated))
    throw Error(
      "Regenerate the WGER exercise snapshot from its reviewed sources.",
    );
  if (hash(readFileSync(migrationPath)) !== expectedHistoricalMigrationSha256)
    throw Error(
      "The applied WGER import migration is immutable; create a forward migration for corrections.",
    );
}
console.log(
  `Validated ${snapshot.records.length} WGER shared exercises (${snapshot.recordsSha256}).`,
);
