import {
  serviceCatalog,
  serviceCatalogCommand,
} from "./organization-catalog.ts";
import {
  calendar,
  calendarPreview,
  calendarCommand,
} from "./organization-calendar.ts";
import {
  organizationAnalytics,
  independentAnalytics,
  assessmentHistory,
} from "./analytics.ts";
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
import {
  programs,
  programCommand,
  catalog,
  delivery,
  deliveryCommand,
  organizationSession,
  sessionCommand,
  previousOrganizationPerformance,
  role,
} from "./programming.ts";
import { scoped } from "./workspaces.ts";
import { organizationAccountData } from "./account-data.ts";
import { getProgramMedia, putProgramMedia } from "./program-media.ts";
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
    const mediaMatch = path.match(/^\/v1\/program-media\/([a-f0-9-]{36})$/);
    if (mediaMatch) {
      if (req.method === "PUT") {
        send(
          res,
          200,
          await putProgramMedia(
            requireActor(actor),
            url.searchParams.get("workspace") || "",
            mediaMatch[1],
            await body(req, 2097152),
            String(req.headers["content-type"] || ""),
          ),
        );
        return;
      }
      if (req.method === "GET") {
        const file = await getProgramMedia(requireActor(actor), mediaMatch[1]);
        res.writeHead(200, {
          "Content-Type": file.type,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": "inline",
        });
        res.end(file.bytes);
        return;
      }
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
    if (path === "/v1/account/organizations" && req.method === "GET") {
      send(res, 200, await organizationAccountData(requireActor(actor)));
      return;
    }
    const previousMatch = path.match(
      /^\/v1\/organization-sessions\/([a-f0-9-]{36})\/previous$/,
    );
    if (previousMatch && req.method === "GET") {
      send(
        res,
        200,
        await previousOrganizationPerformance(
          requireActor(actor),
          previousMatch[1],
        ),
      );
      return;
    }
    if (path === "/v1/contexts" && req.method === "GET") {
      send(res, 200, await contexts(requireActor(actor)));
      return;
    }
    if (path === "/v1/workspaces" && req.method === "POST") {
      send(res, 200, await createWorkspace(requireActor(actor), input));
      return;
    }
    if (path === "/v1/coach/analytics" && req.method === "GET") {
      send(
        res,
        200,
        await independentAnalytics(requireActor(actor), url.searchParams),
      );
      return;
    }
    const serviceMatch = path.match(
      /^\/v1\/workspaces\/([a-f0-9-]{36})\/(services|calendar|calendar-preview|analytics|assessment-history)$/,
    );
    if (serviceMatch) {
      const who = requireActor(actor),
        id = serviceMatch[1],
        domain = serviceMatch[2];
      if (req.method === "GET") {
        const result =
          domain === "services"
            ? await serviceCatalog(who, id, url.searchParams)
            : domain === "calendar"
              ? await calendar(who, id, url.searchParams)
              : domain === "analytics"
                ? await organizationAnalytics(who, id, url.searchParams)
                : domain === "assessment-history"
                  ? await assessmentHistory(who, id, url.searchParams)
                  : null;
        if (result === null) throw new ApiError(405, "method_not_allowed");
        send(res, 200, result);
        return;
      }
      if (
        req.method === "POST" &&
        ["services", "calendar", "calendar-preview"].includes(domain)
      ) {
        send(
          res,
          200,
          await (domain === "services"
            ? serviceCatalogCommand(who, id, input)
            : domain === "calendar-preview"
              ? calendarPreview(who, id, input)
              : calendarCommand(who, id, input)),
        );
        return;
      }
      throw new ApiError(405, "method_not_allowed");
    }
    const programMatch = path.match(
      /^\/v1\/workspaces\/([a-f0-9-]{36})\/(programs|catalog|delivery|sessions)$/,
    );
    if (programMatch) {
      const who = requireActor(actor),
        id = programMatch[1],
        domain = programMatch[2];
      if (req.method === "GET") {
        if (
          domain === "catalog" &&
          role(url.searchParams.get("view")) === "trainee"
        )
          throw new ApiError(403, "forbidden");
        const value =
          domain === "programs"
            ? await programs(who, id, url.searchParams)
            : domain === "delivery"
              ? await delivery(who, id, url.searchParams)
              : domain === "catalog"
                ? await scoped(
                    who,
                    id,
                    [role(url.searchParams.get("view"))],
                    (tx) => catalog(tx, id),
                  )
                : null;
        if (value === null) throw new ApiError(405, "method_not_allowed");
        send(res, 200, value);
        return;
      }
      if (req.method === "POST") {
        send(
          res,
          200,
          await (domain === "programs" || domain === "catalog"
            ? programCommand(who, id, input)
            : domain === "delivery"
              ? deliveryCommand(who, id, input)
              : sessionCommand(who, id, input)),
        );
        return;
      }
    }
    const orgSession = path.match(
      /^\/v1\/organization-sessions\/([a-f0-9-]{36})$/,
    );
    if (orgSession && req.method === "GET") {
      send(
        res,
        200,
        await organizationSession(
          requireActor(actor),
          orgSession[1],
          role(url.searchParams.get("view") || "trainee"),
        ),
      );
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
          "deliver_plan",
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
    const detailMatch = detail.match(/(?:ERROR: )?([a-z][a-z0-9_]{2,70})$/);
    const databaseCode =
      err.meta?.code || err.meta?.driverAdapterError?.cause?.originalCode;
    const match = databaseCode === "P0001" ? detailMatch : null;
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
