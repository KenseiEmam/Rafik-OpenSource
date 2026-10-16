import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Prisma } from "./generated/prisma/client.ts";
export const local = process.env.NODE_ENV !== "production";
const localConnection =
  "postgresql://rafik_api:rafik-local-api-only@127.0.0.1:55332/rafik";
const connectionString = process.env.DATABASE_URL || localConnection;
const target = new URL(connectionString);
if (local) {
  if (
    target.hostname !== "127.0.0.1" ||
    target.port !== "55332" ||
    !/^\/(rafik|rafik_browser_\d+)$/.test(target.pathname) ||
    target.username !== "rafik_api"
  )
    throw Error(
      "The local API accepts only the isolated Rafik database or a disposable browser database.",
    );
} else {
  const origin = process.env.RAFIK_PUBLIC_ORIGIN || "";
  const email = process.env.RAFIK_BOOTSTRAP_EMAIL || "";
  const smtpHost = process.env.RAFIK_SMTP_HOST || "";
  const smtpPort = Number(process.env.RAFIK_SMTP_PORT || 0);
  const smtpTlsMode = process.env.RAFIK_SMTP_TLS_MODE || "";
  const sender = process.env.RAFIK_MAIL_FROM || "";
  const files = process.env.RAFIK_PRIVATE_FILES_DIR || "";
  const apiPassword = process.env.RAFIK_API_PASSWORD || "";
  const problems: string[] = [];
  if (process.env.RAFIK_RUNTIME_MODE !== "self-hosted-university")
    problems.push("RAFIK_RUNTIME_MODE");
  if (target.protocol !== "postgresql:" && target.protocol !== "postgres:")
    problems.push("DATABASE_URL");
  if (
    target.hostname !== "db" ||
    target.port !== "5432" ||
    target.pathname !== "/rafik" ||
    target.username !== "rafik_api" ||
    target.password !== apiPassword ||
    !/^[a-f0-9]{64}$/.test(apiPassword)
  )
    problems.push("DATABASE_URL/RAFIK_API_PASSWORD");
  try {
    const publicUrl = new URL(origin);
    if (
      publicUrl.protocol !== "https:" ||
      publicUrl.pathname !== "/" ||
      publicUrl.search ||
      publicUrl.hash
    )
      problems.push("RAFIK_PUBLIC_ORIGIN");
  } catch {
    problems.push("RAFIK_PUBLIC_ORIGIN");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    problems.push("RAFIK_BOOTSTRAP_EMAIL");
  if (!/^[A-Za-z0-9.-]+$/.test(smtpHost)) problems.push("RAFIK_SMTP_HOST");
  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535)
    problems.push("RAFIK_SMTP_PORT");
  if (!new Set(["starttls", "implicit"]).has(smtpTlsMode))
    problems.push("RAFIK_SMTP_TLS_MODE");
  if (!process.env.RAFIK_SMTP_USER) problems.push("RAFIK_SMTP_USER");
  if (!process.env.RAFIK_SMTP_PASSWORD) problems.push("RAFIK_SMTP_PASSWORD");
  if (
    !sender ||
    /[\r\n]/.test(sender) ||
    !/^(?:[^<>]*<)?[^\s<>@]+@[^\s<>@]+(?:>)?$/.test(sender)
  )
    problems.push("RAFIK_MAIL_FROM");
  if (!files.startsWith("/")) problems.push("RAFIK_PRIVATE_FILES_DIR");
  if (process.env.HOST !== "0.0.0.0") problems.push("HOST");
  if (problems.length)
    throw new Error(
      `Self-hosted production configuration is incomplete or invalid: ${[...new Set(problems)].join(", ")}`,
    );
}
export const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
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
