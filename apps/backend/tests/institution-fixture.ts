import { randomUUID } from "node:crypto";
import { db } from "../server/db.ts";
// Privileged fixture setup exercises legacy scope isolation; this is not a runtime API.
export async function fixtureInstitution(
  actor: { id: string },
  input: Record<string, unknown>,
) {
  if (
    !process.env.RAFIK_TEST_API ||
    !/rafik_(browser|test|field|acceptance)_/.test(
      process.env.DATABASE_URL || "",
    )
  )
    throw Error("Institution fixtures require a disposable test database/API");
  const id = String(input.id),
    kind = input.kind === "institution" ? "organization" : String(input.kind),
    name = String(input.name);
  await db.$transaction(async (tx) => {
    await tx.institutions.create({
      data: { id, kind, name, created_by: actor.id },
    });
    await tx.institution_members.create({
      data: {
        id: randomUUID(),
        institution_id: id,
        user_id: actor.id,
        roles: [kind === "organization" ? "admin" : "trainer"],
        name: "Fixture administrator",
      },
    });
  });
  return { status: 200, data: { id, kind, name } };
}
