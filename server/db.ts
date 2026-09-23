import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Prisma } from "./generated/prisma/client.ts";
export const local = process.env.NODE_ENV !== "production";
if (!local)
  throw new Error(
    "Hosting adapters and release configuration must be configured before production startup.",
  );
export const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://rafik_api:rafik-local-api-only@127.0.0.1:55332/rafik",
  }),
});
export type Actor = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
};
export async function asActor<T>(
  actor: Actor | null,
  run: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL ROLE ${actor ? "rafik_user" : "rafik_guest"}`,
      );
      await tx.$queryRaw`SELECT set_config('rafik.actor',${actor?.id || ""},true),set_config('rafik.claims',${JSON.stringify({ sub: actor?.id, email: actor?.email })},true)`;
      return run(tx);
    },
    { timeout: 15000 },
  );
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const requireActor = (actor: Actor | null): Actor => {
  if (!actor) throw new ApiError(401, "unauthenticated");
  return actor;
};
