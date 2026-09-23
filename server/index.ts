import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { db, ApiError, requireActor, local } from "./db.ts";
import { identify, authRoute } from "./auth.ts";
import {
  command,
  query,
  loadContracts,
  messages,
  upcoming,
} from "./commands.ts";
import { fileOperation } from "./files.ts";
import {
  contexts,
  createWorkspace,
  workspaceView,
  workspaceCommand,
  invitation,
  requirePractice,
} from "./workspaces.ts";
import { localInbox } from "./local-inbox.ts";
const origins = new Set([
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5173",
  "http://127.0.0.1:55331",
]);
function send(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? Number(v) : v)),
  );
}
async function body(req: IncomingMessage, limit: number) {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > limit) throw new ApiError(413, "payload_too_large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
await loadContracts();
const server = createServer(async (req, res) => {
  try {
    const origin = req.headers.origin;
    if (origin && !origins.has(origin))
      throw new ApiError(403, "origin_not_allowed");
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "content-type,x-rafik-client",
      });
      res.end();
      return;
    }
    if (
      !["GET", "HEAD"].includes(req.method || "") &&
      req.headers["x-rafik-client"] !== "web"
    )
      throw new ApiError(403, "client_header_required");
    const url = new URL(req.url || "/", "http://127.0.0.1"),
      path = url.pathname.replace(/^\/api/, "");
    if (path === "/health" && req.method === "GET") {
      await db.$queryRaw`SELECT 1`;
      send(res, 200, { ok: true, runtime: "prisma-postgresql" });
      return;
    }
    if (path === "/local/inbox" && local && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      });
      res.end(await localInbox());
      return;
    }
    if (path === "/local/mail" && local && req.method === "GET") {
      send(
        res,
        200,
        await db.mail_messages.findMany({
          where: { expires_at: { gt: new Date() } },
          orderBy: { created_at: "desc" },
          take: 100,
        }),
      );
      return;
    }
    const actor = await identify(req);
    if (path.startsWith("/v1/conversations/") && req.method === "GET") {
      send(
        res,
        200,
        await messages(actor, path.slice(18), url.searchParams.get("before")),
      );
      return;
    }
    if (path === "/v1/appointments/upcoming" && req.method === "GET") {
      send(
        res,
        200,
        await upcoming(actor, url.searchParams.get("coach") === "true"),
      );
      return;
    }
    if (path.startsWith("/v1/files/")) {
      const result = await fileOperation(
        requireActor(actor),
        req.method || "",
        decodeURIComponent(path.slice(10)),
        await body(req, 10485760),
        String(req.headers["content-type"] || ""),
      );
      if ("bytes" in result) {
        res.writeHead(200, {
          "Content-Type": result.type,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": "attachment",
        });
        res.end(result.bytes);
      } else send(res, 200, result);
      return;
    }
    if (path.startsWith("/v1/queries/") && req.method === "GET") {
      send(res, 200, await query(actor, path.slice(12), url.searchParams));
      return;
    }
    let input: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        input = JSON.parse((await body(req, 1048576)).toString() || "{}");
      } catch (e) {
        if (e instanceof ApiError) throw e;
        throw new ApiError(400, "invalid_json");
      }
      if (!input || Array.isArray(input) || typeof input !== "object")
        throw new ApiError(400, "invalid_request");
    }
    if (path === "/v1/contexts" && req.method === "GET") {
      send(res, 200, await contexts(requireActor(actor)));
      return;
    }
    if (path === "/v1/workspaces" && req.method === "POST") {
      send(res, 200, await createWorkspace(requireActor(actor), input));
      return;
    }
    const workspaceMatch = path.match(/^\/v1\/workspaces\/([a-f0-9-]{36})$/);
    if (workspaceMatch) {
      if (req.method === "GET") {
        send(
          res,
          200,
          await workspaceView(
            requireActor(actor),
            workspaceMatch[1],
            url.searchParams.get("view") || "admin",
          ),
        );
        return;
      }
      if (req.method === "POST") {
        send(
          res,
          200,
          await workspaceCommand(requireActor(actor), workspaceMatch[1], input),
        );
        return;
      }
    }
    if (path.startsWith("/v1/organization-invitations/")) {
      if (!["GET", "POST"].includes(req.method || ""))
        throw new ApiError(405, "method_not_allowed");
      send(
        res,
        200,
        await invitation(path.slice(29), actor, req.method === "POST"),
      );
      return;
    }
    if (
      path.startsWith("/v1/auth/") &&
      (req.method === "POST" ||
        (req.method === "GET" && path.endsWith("/session")))
    ) {
      send(res, 200, await authRoute(path.slice(9), input, req, res));
      return;
    }
    if (path.startsWith("/v1/commands/") && req.method === "POST") {
      if (
        [
          "save_plan",
          "publish_plan",
          "save_exercise",
          "create_invitation",
          "create_team",
          "save_coaching_form",
          "publish_availability",
        ].includes(path.slice(13))
      )
        await requirePractice(actor);
      send(res, 200, await command(actor, path.slice(13), input));
      return;
    }
    throw new ApiError(404, "not_found");
  } catch (e) {
    const err = e as {
      message?: string;
      meta?: {
        code?: string;
        message?: string;
        driverAdapterError?: {
          cause?: { originalMessage?: string; originalCode?: string };
        };
      };
    };
    const detail =
      err.meta?.driverAdapterError?.cause?.originalMessage ||
      err.meta?.message ||
      "";
    const match = detail.match(/(?:ERROR: )?([a-z][a-z0-9_]{2,70})$/);
    const databaseCode =
      err.meta?.code || err.meta?.driverAdapterError?.cause?.originalCode;
    const mapped =
      databaseCode === "23505"
        ? { status: 409, message: "conflict" }
        : databaseCode === "42501"
          ? { status: 403, message: "forbidden" }
          : databaseCode?.startsWith("22") ||
              databaseCode === "23514" ||
              databaseCode === "23503"
            ? { status: 400, message: "invalid_request" }
            : null;
    const status =
      e instanceof ApiError ? e.status : mapped?.status || (match ? 400 : 500);
    if (status === 500) console.error("API operation failed", err.message);
    send(res, status, {
      message:
        e instanceof ApiError
          ? e.message
          : mapped?.message || match?.[1] || "service_unavailable",
    });
  }
});
server.requestTimeout = 20000;
server.listen(Number(process.env.PORT || 55331), "127.0.0.1", () =>
  console.log(
    "Rafik API ready on http://127.0.0.1:" + (process.env.PORT || 55331),
  ),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () =>
    server.close(() => void db.$disconnect().then(() => process.exit(0))),
  );
