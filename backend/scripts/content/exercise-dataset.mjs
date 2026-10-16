// Build the media-free shared exercise catalogue from a pinned upstream export.
// The checked-in JSON is the offline source of truth; --from-raw is only needed
// when deliberately refreshing to another reviewed upstream commit.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const snapshotPath = resolve(root, "content/exercise-dataset.json");
const migrationPath = resolve(
  root,
  "prisma/migrations/202609231530_exercise_dataset/migration.sql",
);
const sourceCommit = "7455efae41b330c265e7cd4b78dfa848e7ce5ebd";
const sourceRepository = "https://github.com/hasaneyldrm/exercises-dataset";
const expectedRawSha256 =
  "656634224b8977b99a6d765470ee123260d4979715eaa4e7c0b7c8bb0d79f93d";
const bodyParts = {
  waist: { name: "Waist", nameAr: "الخصر", kind: "strength" },
  "upper legs": { name: "Upper legs", nameAr: "الفخذان", kind: "strength" },
  back: { name: "Back", nameAr: "الظهر", kind: "strength" },
  "lower legs": {
    name: "Lower legs",
    nameAr: "أسفل الساقين",
    kind: "strength",
  },
  chest: { name: "Chest", nameAr: "الصدر", kind: "strength" },
  "upper arms": {
    name: "Upper arms",
    nameAr: "أعلى الذراعين",
    kind: "strength",
  },
  cardio: { name: "Cardio", nameAr: "تمارين القلب", kind: "timed" },
  shoulders: { name: "Shoulders", nameAr: "الكتفان", kind: "strength" },
  "lower arms": {
    name: "Lower arms",
    nameAr: "أسفل الذراعين",
    kind: "strength",
  },
  neck: { name: "Neck", nameAr: "الرقبة", kind: "strength" },
};
const equipment = {
  assisted: { name: "Assisted", nameAr: "بمساعدة" },
  band: { name: "Band", nameAr: "شريط مقاومة" },
  barbell: { name: "Barbell", nameAr: "بار حديد" },
  "body weight": { name: "Bodyweight", nameAr: "وزن الجسم" },
  "bosu ball": { name: "BOSU ball", nameAr: "كرة بوسو" },
  cable: { name: "Cable", nameAr: "كابل" },
  dumbbell: { name: "Dumbbell", nameAr: "دمبل" },
  "elliptical machine": {
    name: "Elliptical machine",
    nameAr: "جهاز إليبتيكال",
  },
  "ez barbell": { name: "EZ barbell", nameAr: "بار إي زد" },
  hammer: { name: "Hammer", nameAr: "مطرقة" },
  kettlebell: { name: "Kettlebell", nameAr: "كيتل بيل" },
  "leverage machine": { name: "Leverage machine", nameAr: "جهاز مقاومة" },
  "medicine ball": { name: "Medicine ball", nameAr: "كرة طبية" },
  "olympic barbell": { name: "Olympic barbell", nameAr: "بار أولمبي" },
  "resistance band": { name: "Resistance band", nameAr: "شريط مقاومة" },
  roller: { name: "Roller", nameAr: "بكرة" },
  rope: { name: "Rope", nameAr: "حبل" },
  "skierg machine": { name: "SkiErg machine", nameAr: "جهاز سكي إرج" },
  "sled machine": { name: "Sled machine", nameAr: "جهاز زلاجة" },
  "smith machine": { name: "Smith machine", nameAr: "جهاز سميث" },
  "stability ball": { name: "Stability ball", nameAr: "كرة ثبات" },
  "stationary bike": { name: "Stationary bike", nameAr: "دراجة ثابتة" },
  "stepmill machine": { name: "Stepmill machine", nameAr: "جهاز صعود الدرج" },
  tire: { name: "Tire", nameAr: "إطار" },
  "trap bar": { name: "Trap bar", nameAr: "بار تراب" },
  "upper body ergometer": {
    name: "Upper-body ergometer",
    nameAr: "دراجة الذراعين",
  },
  weighted: { name: "Weighted", nameAr: "أوزان" },
  "wheel roller": { name: "Wheel roller", nameAr: "عجلة تمرين" },
};
// The original shared movements retain their existing movement taxonomy. These
// fields make their filter facets comparable with the imported catalogue.
const legacyMetadata = {
  "goblet-squat": ["upper legs", "quadriceps"],
  "dumbbell-row": ["back", "lats"],
  "floor-press": ["chest", "pectorals"],
  "romanian-deadlift": ["upper legs", "hamstrings"],
  "split-squat": ["upper legs", "quadriceps"],
  "glute-bridge": ["upper legs", "glutes"],
  "overhead-press": ["shoulders", "delts"],
  "dead-bug": ["waist", "abs"],
  "forearm-plank": ["waist", "abs"],
  "brisk-walk": ["cardio", "full body"],
  "stationary-cycle": ["cardio", "quads"],
  "incline-pushup": ["chest", "pectorals"],
  "low-step-up": ["upper legs", "quadriceps"],
  "band-row": ["back", "lats"],
};
// These source IDs were reviewed as static stretches/holds. Keep this explicit
// rather than inferring a recording type from an arbitrary future name edit.
const timedSourceIds = new Set([
  "1512",
  "1708",
  "1709",
  "1710",
  "1713",
  "1714",
  "1716",
  "1712",
  "1405",
  "1259",
  "1407",
  "1377",
  "1378",
  "1548",
  "1271",
  "1272",
  "0257",
  "1167",
  "1559",
  "1339",
  "1341",
  "1342",
  "1560",
  "1745",
  "1511",
  "1564",
  "1419",
  "1297",
  "0500",
  "1346",
  "1576",
  "0613",
  "1403",
  "0643",
  "1388",
  "1389",
  "0669",
  "2571",
  "2208",
  "2205",
  "2202",
  "2207",
  "1585",
  "1390",
  "1424",
  "0690",
  "2567",
  "1358",
  "0716",
  "0721",
  "1363",
  "1398",
  "1599",
  "0794",
  "0817",
  "1365",
  "3642",
  "1604",
  "3544",
  "3665",
  "2135",
]);
const recordingKind = (id, bodyPart) =>
  bodyPart === "cardio" || timedSourceIds.has(id) ? "timed" : "strength";
const hash = (value) =>
  createHash("sha256")
    .update(
      Buffer.isBuffer(value) || typeof value === "string"
        ? value
        : JSON.stringify(value),
    )
    .digest("hex");
const quote = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const stableJson = (value) => JSON.stringify(value, null, 2) + "\n";

function fromRaw(rawPath) {
  const rawBytes = readFileSync(rawPath);
  if (hash(rawBytes) !== expectedRawSha256)
    throw Error(
      "Unexpected upstream export digest; review the source pin before replacing the catalogue.",
    );
  const raw = JSON.parse(rawBytes);
  if (!Array.isArray(raw) || raw.length !== 1324)
    throw Error("Expected the reviewed 1,324-record upstream export.");
  const sourceIds = new Set();
  const exercises = raw.map((row) => {
    if (!/^\d{4}$/.test(row.id) || sourceIds.has(row.id))
      throw Error(`Invalid or duplicate source ID: ${row.id}`);
    sourceIds.add(row.id);
    const part = bodyParts[row.body_part];
    const tool = equipment[row.equipment];
    const instructions = row.instructions?.en;
    if (
      !part ||
      !tool ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      typeof instructions !== "string" ||
      !instructions.trim()
    )
      throw Error(`Incomplete or unmapped record: ${row.id}`);
    if (row.name.length > 120 || instructions.length > 2000)
      throw Error(`Record exceeds exercise column limits: ${row.id}`);
    return {
      id: `dataset-${row.id}`,
      sourceId: row.id,
      name: row.name.trim(),
      nameAr: null,
      category: row.category,
      categoryAr: part.nameAr,
      bodyPart: row.body_part,
      targetMuscle: row.target,
      equipment: tool.name,
      equipmentKey: row.equipment,
      equipmentAr: tool.nameAr,
      instructions: instructions.trim(),
      instructionsAr: null,
      movement: row.body_part,
      kind: recordingKind(row.id, row.body_part),
    };
  });
  return {
    schema: 1,
    source: {
      repository: "hasaneyldrm/exercises-dataset",
      repositoryUrl: sourceRepository,
      commit: sourceCommit,
      license: "MIT",
      licenseUrl: `${sourceRepository}/blob/${sourceCommit}/LICENSE`,
      rawSha256: expectedRawSha256,
      rawRecordCount: raw.length,
      retainedFields: [
        "id",
        "name",
        "category",
        "body_part",
        "equipment",
        "target",
        "instructions.en",
      ],
      excludedFields: [
        "image",
        "gif_url",
        "media_id",
        "instruction_steps",
        "instructions.* (except en)",
        "muscle_group",
        "secondary_muscles",
        "created_at",
        "attribution",
      ],
      mediaPolicy:
        "No upstream image, video, GIF, media identifier, or source attribution asset is imported or served.",
      languagePolicy:
        "English source names and instructions are retained. Arabic exercise names and instructions are unavailable and represented as null; only controlled category and equipment vocabulary is localized.",
    },
    mappings: {
      movement: "body_part",
      kindPolicy: {
        cardioBodyPart: "timed",
        reviewedStaticSourceIds: [...timedSourceIds].sort(),
        default: "strength",
      },
      bodyParts: Object.entries(bodyParts).map(([key, value]) => ({
        key,
        name: value.name,
        nameAr: value.nameAr,
      })),
      equipment: Object.entries(equipment).map(([key, value]) => ({
        key,
        name: value.name,
        nameAr: value.nameAr,
      })),
    },
    recordsSha256: hash(exercises),
    exercises,
  };
}

function validate(snapshot) {
  if (
    snapshot?.schema !== 1 ||
    snapshot?.source?.commit !== sourceCommit ||
    snapshot?.source?.rawSha256 !== expectedRawSha256
  )
    throw Error("Unexpected exercise catalogue provenance.");
  if (!Array.isArray(snapshot.exercises) || snapshot.exercises.length !== 1324)
    throw Error("Expected exactly 1,324 checked-in exercise records.");
  if (snapshot.recordsSha256 !== hash(snapshot.exercises))
    throw Error(
      "Exercise catalogue record digest does not match its snapshot.",
    );
  const ids = new Set();
  for (const exercise of snapshot.exercises) {
    if (!/^dataset-\d{4}$/.test(exercise.id) || ids.has(exercise.id))
      throw Error(`Invalid or duplicate catalogue ID: ${exercise.id}`);
    ids.add(exercise.id);
    if (exercise.nameAr !== null || exercise.instructionsAr !== null)
      throw Error(
        `Arabic source text must remain explicitly unavailable: ${exercise.id}`,
      );
    if (
      !bodyParts[exercise.bodyPart] ||
      !equipment[exercise.equipmentKey] ||
      typeof exercise.targetMuscle !== "string" ||
      !exercise.targetMuscle ||
      exercise.movement !== exercise.bodyPart ||
      exercise.kind !== recordingKind(exercise.sourceId, exercise.bodyPart)
    )
      throw Error(`Invalid controlled mapping: ${exercise.id}`);
    if (
      !exercise.name ||
      !exercise.instructions ||
      exercise.name.length > 120 ||
      exercise.instructions.length > 2000
    )
      throw Error(`Invalid English exercise text: ${exercise.id}`);
  }
}

function migration(snapshot) {
  const columns = [
    "id",
    "owner_id",
    "name",
    "name_ar",
    "equipment",
    "equipment_ar",
    "instructions",
    "instructions_ar",
    "movement",
    "kind",
    "media_url",
    "media_ref",
    "category",
    "body_part",
    "target_muscle",
  ];
  const rows = snapshot.exercises.map(
    (exercise) =>
      "(" +
      [
        quote(exercise.id),
        "NULL",
        quote(exercise.name),
        quote(""),
        quote(exercise.equipment),
        quote(exercise.equipmentAr),
        quote(exercise.instructions),
        quote(""),
        quote(exercise.movement),
        quote(exercise.kind),
        quote(""),
        "NULL",
        quote(exercise.category),
        quote(exercise.bodyPart),
        quote(exercise.targetMuscle),
      ].join(",") +
      ")",
  );
  const legacyRows = Object.entries(legacyMetadata)
    .map(
      ([id, [bodyPart, target]]) =>
        `(${quote(id)},${quote(bodyPart)},${quote(bodyPart)},${quote(target)})`,
    )
    .join(",\n");
  return `-- GENERATED by npm run content:exercise-dataset. Shared, media-free metadata from ${snapshot.source.repository}@${snapshot.source.commit}.\n-- Source MIT license: ${snapshot.source.licenseUrl}\n-- Retained fields only; source media and non-English source text are deliberately excluded.\nalter table public.exercises add column category text;\nalter table public.exercises add column body_part text;\nalter table public.exercises add column target_muscle text;\nupdate public.exercises as exercise set category=metadata.category,body_part=metadata.body_part,target_muscle=metadata.target_muscle\nfrom (values\n${legacyRows}\n) as metadata(id,category,body_part,target_muscle)\nwhere exercise.id=metadata.id and exercise.owner_id is null;\ninsert into public.exercises(${columns.join(",")}) values\n${rows.join(",\n")}\non conflict (id) do nothing;\n`;
}

const fromRawPath = process.argv.indexOf("--from-raw");
let snapshot;
if (fromRawPath >= 0) {
  const rawPath = process.argv[fromRawPath + 1];
  if (!rawPath) throw Error("Pass the reviewed raw export after --from-raw.");
  snapshot = fromRaw(rawPath);
  validate(snapshot);
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, stableJson(snapshot));
} else snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
validate(snapshot);
const rendered = migration(snapshot);
if (process.argv.includes("--check")) {
  if (readFileSync(migrationPath, "utf8") !== rendered)
    throw Error("Regenerate the exercise dataset migration.");
} else {
  mkdirSync(dirname(migrationPath), { recursive: true });
  writeFileSync(migrationPath, rendered);
}
console.log(
  `Validated ${snapshot.exercises.length} media-free exercises (${snapshot.recordsSha256}).`,
);
