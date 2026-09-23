import {
  randomBytes,
  randomInt,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { db, local, ApiError, type Actor } from "./db.ts";
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const actor = (u: {
  id: string;
  email: string | null;
  raw_user_meta_data: unknown;
}): Actor => ({
  id: u.id,
  email: u.email,
  user_metadata: u.raw_user_meta_data as Record<string, unknown>,
});
export async function identify(req: IncomingMessage): Promise<Actor | null> {
  const token = req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("rafik_session="))
    ?.slice(14);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.identity_sessions.findUnique({
    where: { token_hash: hash(token) },
    include: { users: true },
  });
  return session && session.expires_at > new Date()
    ? actor(session.users)
    : null;
}
async function session(res: ServerResponse, user: Actor) {
  const token = randomBytes(32).toString("hex"),
    expires = new Date(Date.now() + 7 * 86400000);
  await db.identity_sessions.create({
    data: { token_hash: hash(token), user_id: user.id, expires_at: expires },
  });
  res.setHeader(
    "Set-Cookie",
    `rafik_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${local ? "" : "; Secure"}`,
  );
  return { user };
}
function emailOf(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
    throw new ApiError(400, "invalid_email");
  return value.trim().toLowerCase();
}
async function rateLimit(key: string, limit: number, seconds: number) {
  const rows = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO identity.rate_limits(key,count,window_start) VALUES(${hash(key)},1,now()) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN identity.rate_limits.window_start<now()-make_interval(secs=>${seconds}) THEN 1 ELSE identity.rate_limits.count+1 END,window_start=CASE WHEN identity.rate_limits.window_start<now()-make_interval(secs=>${seconds}) THEN now() ELSE identity.rate_limits.window_start END RETURNING count`;
  if (rows[0].count > limit) throw new ApiError(429, "rate_limited");
}
export async function authRoute(
  path: string,
  body: Record<string, unknown>,
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (path === "session") return { user: await identify(req) };
  if (path === "logout") {
    const token = req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("rafik_session="))
      ?.slice(14);
    if (token)
      await db.identity_sessions.deleteMany({
        where: { token_hash: hash(token) },
      });
    res.setHeader(
      "Set-Cookie",
      "rafik_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
    );
    return { user: null };
  }
  const email = emailOf(body.email);
  if (path === "local-preview") {
    if (
      !local ||
      ![
        "coach",
        "client",
        "coach2",
        "other",
        "orgadmin",
        "orgtrainer",
        "orgtrainee",
        "orgadmin2",
      ].some((n) => email === `${n}@rafik.test`)
    )
      throw new ApiError(403, "forbidden");
    const u = await db.users.findUnique({ where: { email } });
    if (!u) throw new ApiError(404, "preview_unavailable");
    return session(res, actor(u));
  }
  await rateLimit(`auth:${req.socket.remoteAddress}`, 100, 600);
  if (path === "request-code") {
    await rateLimit(`code:${email}`, 1, 60);
    const code = String(randomInt(100000, 1000000)),
      expires = new Date(Date.now() + 10 * 60000);
    await db.$transaction(async (tx) => {
      await tx.challenges.upsert({
        where: { email },
        create: { email, code_hash: hash(email + code), expires_at: expires },
        update: {
          code_hash: hash(email + code),
          expires_at: expires,
          sent_at: new Date(),
          attempts: 0,
        },
      });
      await tx.mail_messages.deleteMany({
        where: { email, subject: "Your Rafik sign-in code" },
      });
      await tx.mail_messages.create({
        data: {
          email,
          subject: "Your Rafik sign-in code",
          body: code,
          expires_at: expires,
        },
      });
    });
    return { sent: true };
  }
  if (path === "verify-code") {
    if (typeof body.token !== "string" || !/^\d{6}$/.test(body.token))
      throw new ApiError(400, "invalid_code");
    // Lock before increment/check/delete: simultaneous verification cannot reuse a code.
    const u = await db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { code_hash: string; expires_at: Date; attempts: number }[]
      >`SELECT code_hash,expires_at,attempts FROM identity.challenges WHERE email=${email} FOR UPDATE`;
      const challenge = rows[0];
      if (
        !challenge ||
        challenge.expires_at < new Date() ||
        challenge.attempts >= 5
      )
        return null;
      await tx.challenges.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      if (
        !timingSafeEqual(
          Buffer.from(challenge.code_hash),
          Buffer.from(hash(email + body.token)),
        )
      )
        return null;
      await tx.challenges.delete({ where: { email } });
      return tx.users.upsert({
        where: { email },
        create: { email, email_confirmed_at: new Date() },
        update: { email_confirmed_at: new Date() },
      });
    });
    if (!u) throw new ApiError(400, "invalid_code");
    return session(res, actor(u));
  }
  throw new ApiError(404, "not_found");
}
