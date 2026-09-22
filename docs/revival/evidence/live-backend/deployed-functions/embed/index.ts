import "pdf-parse";
import { generateAndStoreEmbeddings } from "./util.ts";
import { corsHeaders } from "../_shared/corsHeaders.ts";
import { Application, Context, Router } from "@oak/oak";

// Helper function to set JSON and CORS headers.
function setJsonCors(ctx: Context) {
  ctx.response.headers.set("Content-Type", "application/json");
  Object.entries(corsHeaders).forEach(([key, value]) => {
    ctx.response.headers.set(key, value);
  });
}

const router = new Router();

// Handle OPTIONS requests for all routes.
router.options("/(.*)", (ctx) => {
  ctx.response.status = 204; // No content
  Object.entries(corsHeaders).forEach(([key, value]) => {
    ctx.response.headers.set(key, value);
  });
});

router
  .get("/embed", (ctx) => {
    ctx.response.body = "Hello World";
  })
  .post("/embed", async (ctx) => {
    try {
      // Ensure the request has a JSON body.
      if (!ctx.request.hasBody) {
        ctx.response.status = 400;
        setJsonCors(ctx);
        ctx.response.body = { error: "No body found." };
        return;
      }
      const data = await ctx.request.body.json();
      // Validate required fields.

      const { chatbotId, path, type } = data || {};
      if (!chatbotId || !path || !type) {
        ctx.response.status = 400;
        setJsonCors(ctx);
        ctx.response.body = {
          error: "Missing required fields: chatbotId, doc_path, type",
        };
        return;
      }
      await generateAndStoreEmbeddings(chatbotId, path, type as "file" | "url");

      ctx.response.status = 200;
      setJsonCors(ctx);
      ctx.response.body = {
        success: true,
        message: "Embeddings generated and stored successfully",
      };
    } catch (error) {
      console.error("Error in POST / function:", error);
      ctx.response.status = 500;
      setJsonCors(ctx);
      ctx.response.body = {
        error: "Internal Server Error",
        message: JSON.stringify(error.message || error),
      };
    }
  });

// Register the router middleware.
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
