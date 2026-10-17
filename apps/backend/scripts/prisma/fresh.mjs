// Rehearse a fresh installation in a new disposable database; never reset the preview.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { composeFile, dockerCompose, repositoryRoot } from "./docker.mjs";
const root = resolve(import.meta.dirname, "../.."),
  name = "rafik_check_" + Date.now();
if (
  !readFileSync(composeFile, "utf8").startsWith(
    "name: ${RAFIK_INSTANCE_ID:-rafik-prisma-local}",
  )
)
  throw Error("Local guard failed");
const sql = (database, input) =>
  dockerCompose(
    [
      "exec",
      "-T",
      "db",
      "psql",
      "-U",
      "rafik_migrate",
      "-d",
      database,
      "-v",
      "ON_ERROR_STOP=1",
    ],
    {
      cwd: root,
      input,
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    },
  );
let created = false;
try {
  sql("rafik", `create database ${name};`);
  created = true;
  execFileSync(
    process.execPath,
    [
      resolve(repositoryRoot, "node_modules/prisma/build/index.js"),
      "migrate",
      "deploy",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        MIGRATION_DATABASE_URL: `postgresql://rafik_migrate:rafik-local-migrations-only@127.0.0.1:55332/${name}`,
      },
      stdio: "inherit",
    },
  );
  sql(name, readFileSync(resolve(root, "prisma/seed.sql"), "utf8"));
  const roleMigration = readFileSync(
    resolve(
      root,
      "prisma/migrations/202610171100_single_membership_roles/migration.sql",
    ),
    "utf8",
  );
  sql(
    name,
    `BEGIN;
ALTER TABLE public.workspace_members DROP CONSTRAINT workspace_members_single_role_check;
ALTER TABLE public.workspace_invitations DROP CONSTRAINT workspace_invitations_single_role_check;
ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_legacy_roles_check CHECK (cardinality(roles) BETWEEN 1 AND 3 AND roles <@ ARRAY['admin','trainer','trainee']::text[]);
ALTER TABLE public.workspace_invitations ADD CONSTRAINT workspace_invitations_legacy_roles_check CHECK (cardinality(roles) BETWEEN 1 AND 3 AND roles <@ ARRAY['admin','trainer','trainee']::text[]);
UPDATE public.workspace_members SET roles=ARRAY['trainer','trainee']::text[] WHERE id='13000000-0000-4000-8000-000000000003';
INSERT INTO public.workspace_invitations(id,workspace_id,email,roles,token_hash,created_by,expires_at)
VALUES ('15000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','legacy-multi@rafik.test',ARRAY['trainer','trainee']::text[],repeat('a',64),'11000000-0000-4000-8000-000000000001',now()+interval '1 day');
${roleMigration}
DO $$ BEGIN
  IF (SELECT roles FROM public.workspace_members WHERE id='13000000-0000-4000-8000-000000000003') IS DISTINCT FROM ARRAY['trainer']::text[] THEN RAISE EXCEPTION 'membership role normalization failed'; END IF;
  IF (SELECT trainer_id FROM public.workspace_members WHERE id='13000000-0000-4000-8000-000000000003') IS NOT NULL THEN RAISE EXCEPTION 'trainer assignment was not cleared'; END IF;
  IF (SELECT roles FROM public.workspace_invitations WHERE id='15000000-0000-4000-8000-000000000001') IS DISTINCT FROM ARRAY['trainer']::text[] THEN RAISE EXCEPTION 'invitation role normalization failed'; END IF;
END $$;
ROLLBACK;`,
  );
  console.log(
    "Legacy combined membership/invitation normalization and assigned-athlete cleanup pass (rolled back).",
  );
  for (const suite of [
    "core",
    "daily_coaching",
    "ongoing_coaching",
    "service_delivery",
    "team_business",
    "exercise_choices",
    "daily_workspace",
    "exercise_catalog",
  ])
    sql(name, readFileSync(resolve(root, `tests/sql/${suite}.sql`), "utf8"));
  console.log(
    "Fresh Prisma migrations, fixtures and eight SQL suites pass. Preview database unchanged.",
  );
} finally {
  if (created) sql("rafik", `drop database ${name} with (force);`);
}
