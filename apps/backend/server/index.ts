import type { ApiErrorBody } from "@rafik/shared/contracts";
import { feedback, feedbackCommand } from "./organization-feedback.ts";
import { tasks, taskCommand, followUp } from "./organization-tasks.ts";
import { injuries, injuryCommand } from "./organization-injuries.ts";
import { startInjuryRetention } from "./organization-injury-retention.ts";
import {
  putOrganizationAsset,
  getOrganizationAsset,
  organizationAssets,
  assetCommand,
} from "./organization-assets.ts";
import { nutrition, nutritionCommand } from "./organization-nutrition.ts";
import {
  organizationPeople,
  organizationRecipients,
  independentRecipients,
} from "./people.ts";
import { platformRead, platformCommand } from "./platform.ts";
import {
  notificationPreferences,
  notificationInbox,
  readNotification,
} from "./notifications.ts";
import {
  communication,
  communicationCommand,
} from "./organization-communication.ts";
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
import { serveApiDocs } from "./api-docs.ts";
import { db, ApiError, requireActor } from "./db.ts";
import { identify, authRoute, mobileAuthRoute } from "./auth.ts";
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
import {
  readBranding,
  readBrandingLogo,
  updateBranding,
  canManageBranding,
} from "./instance-branding.ts";
import {
  foodCatalog,
  exerciseDatasetCatalog,
  wgerExerciseCatalog,
  exerciseMediaCatalog,
  exerciseMediaAsset,
  exerciseVideoCatalog,
  exerciseVideoAsset,
  videoRange,
} from "./public-catalog.ts";
const origins = new Set([
  ...(process.env.RAFIK_PUBLIC_ORIGIN ? [process.env.RAFIK_PUBLIC_ORIGIN] : []),
  ...(process.env.RAFIK_TEST_ORIGINS
    ? process.env.RAFIK_TEST_ORIGINS.split(",").filter((o) =>
        /^http:\/\/127\.0\.0\.1:518[34]$/.test(o),
      )
    : []),
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5173",
  "http://127.0.0.1:55331",
  "http://localhost:55331",
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
        "Access-Control-Allow-Headers":
          "authorization,content-type,x-rafik-client",
      });
      res.end();
      return;
    }
    if (
      !["GET", "HEAD"].includes(req.method || "") &&
      !["web", "android"].includes(String(req.headers["x-rafik-client"] || ""))
    )
      throw new ApiError(403, "client_header_required");
    const url = new URL(req.url || "/", "http://127.0.0.1"),
      path = url.pathname.replace(/^\/api/, "");
    if (await serveApiDocs(req, res)) return;
    if (path.startsWith("/v1/mobile/auth/")) {
      const route = path.slice("/v1/mobile/auth/".length),
        method = req.method || "";
      if (
        (route === "session" && method !== "GET") ||
        (route !== "session" && method !== "POST")
      )
        throw new ApiError(405, "method_not_allowed");
      const input =
        method === "POST"
          ? JSON.parse((await body(req, 16_384)).toString())
          : {};
      send(res, 200, await mobileAuthRoute(route, input, req));
      return;
    }
    if (path === "/health" && req.method === "GET") {
      await db.$queryRaw`SELECT 1`;
      send(res, 200, { ok: true, runtime: "prisma-postgresql" });
      return;
    }
    if (req.method === "GET" && path === "/v1/instance/branding") {
      send(res, 200, await readBranding());
      return;
    }
    if (req.method === "GET" && path === "/v1/instance/branding/logo") {
      const image = await readBrandingLogo();
      res.writeHead(200, {
        "Content-Type": image.mime,
        "Content-Length": image.bytes.length,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      });
      res.end(image.bytes);
      return;
    }
    if (req.method === "GET" && path === "/v1/catalog/foods") {
      send(res, 200, await foodCatalog());
      return;
    }
    if (req.method === "GET" && path === "/v1/catalog/exercises") {
      send(res, 200, await exerciseDatasetCatalog());
      return;
    }
    if (req.method === "GET" && path === "/v1/catalog/wger-exercises") {
      send(res, 200, await wgerExerciseCatalog());
      return;
    }
    if (req.method === "GET" && path === "/v1/catalog/exercise-media") {
      send(res, 200, await exerciseMediaCatalog());
      return;
    }
    const exerciseAsset = path.match(
      /^\/v1\/catalog\/exercise-media\/([a-z0-9-]+)\/([123])\.svg$/,
    );
    if (req.method === "GET" && exerciseAsset) {
      const asset = await exerciseMediaAsset(
        exerciseAsset[1],
        exerciseAsset[2],
      );
      res.writeHead(200, {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: `"${asset.digest}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "Content-Length": asset.bytes.length,
      });
      res.end(asset.bytes);
      return;
    }
    if (req.method === "GET" && path === "/v1/catalog/exercise-videos") {
      send(res, 200, await exerciseVideoCatalog());
      return;
    }
    const exerciseVideo = path.match(
      /^\/v1\/catalog\/exercise-videos\/([a-z0-9-]+)\.(mp4|webp)$/,
    );
    if (["GET", "HEAD"].includes(req.method || "") && exerciseVideo) {
      const asset = await exerciseVideoAsset(
        exerciseVideo[1],
        exerciseVideo[2],
      );
      let range;
      try {
        range = videoRange(req.headers.range, asset.bytes.length);
      } catch {
        res.writeHead(416, {
          "Content-Range": `bytes */${asset.bytes.length}`,
        });
        res.end();
        return;
      }
      res.writeHead(range ? 206 : 200, {
        "Content-Type": asset.mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: `"${asset.digest}"`,
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": "bytes",
        ...(range
          ? {
              "Content-Range": `bytes ${range.start}-${range.end}/${asset.bytes.length}`,
            }
          : {}),
        "Content-Length": range
          ? range.end - range.start + 1
          : asset.bytes.length,
      });
      res.end(
        req.method === "HEAD"
          ? undefined
          : range
            ? asset.bytes.subarray(range.start, range.end + 1)
            : asset.bytes,
      );
      return;
    }
    const actor = await identify(req);
    if (req.method === "GET" && path === "/v1/instance/branding/can-manage") {
      const workspaceId = url.searchParams.get("workspace") || "";
      send(res, 200, await canManageBranding(requireActor(actor), workspaceId));
      return;
    }
    const brandingMatch = path.match(
      /^\/v1\/workspaces\/([a-f0-9-]{36})\/branding$/,
    );
    if (brandingMatch && req.method === "POST") {
      send(
        res,
        200,
        await updateBranding(
          requireActor(actor),
          brandingMatch[1],
          JSON.parse((await body(req, 1024 * 1024)).toString()),
        ),
      );
      return;
    }
    if (path === "/v1/platform" && ["GET", "POST"].includes(req.method || "")) {
      send(
        res,
        200,
        req.method === "GET"
          ? await platformRead(requireActor(actor), url.searchParams)
          : await platformCommand(
              requireActor(actor),
              JSON.parse((await body(req, 16384)).toString()),
            ),
      );
      return;
    }
    if (
      path === "/v1/notifications/preferences" &&
      ["GET", "POST"].includes(req.method || "")
    ) {
      send(
        res,
        200,
        await notificationPreferences(
          requireActor(actor),
          req.method === "POST"
            ? JSON.parse((await body(req, 16384)).toString())
            : undefined,
        ),
      );
      return;
    }
    if (
      path === "/v1/notifications" &&
      ["GET", "POST"].includes(req.method || "")
    ) {
      send(
        res,
        200,
        req.method === "GET"
          ? await notificationInbox(requireActor(actor), url.searchParams)
          : await readNotification(
              requireActor(actor),
              JSON.parse((await body(req, 16384)).toString()),
            ),
      );
      return;
    }

    const recipientMatch = path.match(
      /^\/v1\/workspaces\/([a-f0-9-]+)\/recipients$/,
    );
    if (recipientMatch && req.method === "GET") {
      send(
        res,
        200,
        await organizationRecipients(
          requireActor(actor),
          recipientMatch[1],
          url.searchParams,
        ),
      );
      return;
    }
    if (path === "/v1/coach/recipients" && req.method === "GET") {
      send(
        res,
        200,
        await independentRecipients(requireActor(actor), url.searchParams),
      );
      return;
    }
    const peopleMatch = path.match(/^\/v1\/workspaces\/([a-f0-9-]+)\/people$/);
    if (peopleMatch && req.method === "GET") {
      send(
        res,
        200,
        await organizationPeople(
          requireActor(actor),
          peopleMatch[1],
          url.searchParams,
        ),
      );
      return;
    }
    const conversationMatch = path.match(
      /^\/v1\/workspaces\/([a-f0-9-]+)\/communication$/,
    );
    if (conversationMatch && ["GET", "POST"].includes(req.method || "")) {
      const who = requireActor(actor);
      send(
        res,
        200,
        req.method === "GET"
          ? await communication(who, conversationMatch[1], url.searchParams)
          : await communicationCommand(
              who,
              conversationMatch[1],
              JSON.parse((await body(req, 1024 * 1024)).toString()),
            ),
      );
      return;
    }

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
    const assetMatch = path.match(
      /^\/v1\/organization-assets\/([a-f0-9-]{36})$/,
    );
    if (assetMatch && req.method === "PUT") {
      send(
        res,
        200,
        await putOrganizationAsset(
          requireActor(actor),
          url.searchParams.get("workspace") || "",
          assetMatch[1],
          url.searchParams,
          await body(req, 26214400),
          String(req.headers["content-type"] || ""),
        ),
      );
      return;
    }
    if (assetMatch && req.method === "GET") {
      const file = await getOrganizationAsset(
        requireActor(actor),
        assetMatch[1],
      );
      const headers = {
        "Content-Type": file.type,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      };
      const range =
        file.type === "video/mp4"
          ? videoRange(req.headers.range, file.bytes.length)
          : null;
      res.writeHead(range ? 206 : 200, {
        ...headers,
        "Accept-Ranges": "bytes",
        ...(range
          ? {
              "Content-Range": `bytes ${range.start}-${range.end}/${file.bytes.length}`,
              "Content-Length": range.end - range.start + 1,
            }
          : { "Content-Length": file.bytes.length }),
      });
      res.end(
        range ? file.bytes.subarray(range.start, range.end + 1) : file.bytes,
      );
      return;
    }
    const assetList = path.match(/^\/v1\/workspaces\/([a-f0-9-]{36})\/assets$/);
    if (assetList && req.method === "GET") {
      send(
        res,
        200,
        await organizationAssets(
          requireActor(actor),
          assetList[1],
          url.searchParams,
        ),
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
    const injuryMatch = path.match(
      /^\/v1\/workspaces\/([a-f0-9-]{36})\/injuries$/,
    );
    if (injuryMatch) {
      const who = requireActor(actor),
        id = injuryMatch[1];
      if (req.method === "GET")
        send(res, 200, await injuries(who, id, url.searchParams));
      else if (req.method === "POST")
        send(res, 200, await injuryCommand(who, id, input));
      else throw new ApiError(405, "method_not_allowed");
      return;
    }
    const feedbackMatch = path.match(
      /^\/v1\/workspaces\/([a-f0-9-]{36})\/feedback$/,
    );
    if (feedbackMatch) {
      const who = requireActor(actor),
        id = feedbackMatch[1];
      if (req.method === "GET")
        send(res, 200, await feedback(who, id, url.searchParams));
      else if (req.method === "POST")
        send(res, 200, await feedbackCommand(who, id, input));
      else throw new ApiError(405, "method_not_allowed");
      return;
    }
    const taskMatch = path.match(
      /^\/v1\/workspaces\/([a-f0-9-]{36})\/(tasks|follow-up)$/,
    );
    if (taskMatch) {
      const who = requireActor(actor),
        id = taskMatch[1];
      if (req.method === "GET")
        send(
          res,
          200,
          await (taskMatch[2] === "tasks"
            ? tasks(who, id, url.searchParams)
            : followUp(who, id, url.searchParams)),
        );
      else if (req.method === "POST" && taskMatch[2] === "tasks")
        send(res, 200, await taskCommand(who, id, input));
      else throw new ApiError(405, "method_not_allowed");
      return;
    }
    const nutritionMatch = path.match(
      /^\/v1\/workspaces\/([a-f0-9-]{36})\/nutrition$/,
    );
    if (nutritionMatch) {
      const who = requireActor(actor),
        id = nutritionMatch[1];
      if (req.method === "GET")
        send(res, 200, await nutrition(who, id, url.searchParams));
      else if (req.method === "POST")
        send(res, 200, await nutritionCommand(who, id, input));
      else throw new ApiError(405, "method_not_allowed");
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
                    (tx, self) => catalog(tx, id, self),
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
            url.searchParams,
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
        (req.method === "GET" &&
          (path.endsWith("/session") || path.endsWith("/setup-status"))))
    ) {
      send(res, 200, await authRoute(path.slice(9), input, req, res));
      return;
    }
    if (assetList && req.method === "POST") {
      send(
        res,
        200,
        await assetCommand(requireActor(actor), assetList[1], input),
      );
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
    const body: ApiErrorBody = {
      message:
        e instanceof ApiError
          ? e.message
          : mapped?.message || match?.[1] || "service_unavailable",
    };
    send(res, status, body);
  }
});
server.requestTimeout = 20000;
server.listen(
  Number(process.env.PORT || 55331),
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(
      "Rafik API ready on " +
        (process.env.HOST || "127.0.0.1") +
        ":" +
        (process.env.PORT || 55331),
    ),
);
startInjuryRetention();
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () =>
    server.close(() => void db.$disconnect().then(() => process.exit(0))),
  );
