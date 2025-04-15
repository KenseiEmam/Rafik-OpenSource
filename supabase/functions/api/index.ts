import { corsHeaders } from "../_shared/corsHeaders.ts";
import { Application, Context, Router } from "@oak/oak";
import { sendOAuthRequest } from "../_shared/fatSecret.ts";
import { generateAndStoreEmbeddings } from "../_shared/embedding.ts";
import { getChatbotResponse } from "../_shared/chatbot.ts";

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

const endpoints = ["fat-secret", "ai-embed", "ai-chat"];
router
  .get("/api", (ctx) => {
    ctx.response.body = "Hello World";
  })
  .post("/api", async (ctx) => {
    try {
      // Ensure the request has a JSON body.
      if (!ctx.request.hasBody) {
        ctx.response.status = 400;
        setJsonCors(ctx);
        ctx.response.body = { error: "No body found." };
        return;
      }
      const reqBody = await ctx.request.body.json();
      const data = await reqBody.value;
      const { endpoint, ...rest } = data;
      // Validate required fields.
      if (
        !endpoint ||
        typeof endpoint !== "string" ||
        !endpoints.includes(endpoint)
      ) {
        ctx.response.status = 400;
        setJsonCors(ctx);
        ctx.response.body = { error: "Missing required fields" };
        return;
      }

      switch (endpoint) {
        case "fat-secret": {
          const { path, method = "GET", ...params } = rest;

          // Validate the 'path' parameter
          if (!path || typeof path !== "string") {
            ctx.response.status = 400;
            setJsonCors(ctx);
            ctx.response.body = {
              error:
                "Please make sure to provide a valid 'path' parameter. Example: 'food_brands.get.v2'",
            };
            return;
          }

          try {
            // Send the OAuth 1.0 request to FatSecret API
            const response = await sendOAuthRequest(method, path, params);
            ctx.response.status = 200;
            setJsonCors(ctx);
            ctx.response.body = response;
          } catch (error: any) {
            console.error("Error in fat-secret POST / function:", error);
            ctx.response.status = 400;
            setJsonCors(ctx);
            ctx.response.body = { error: error.message };
          }
          break;
        }
        case "ai-embed": {
          const { chatbotId, path, type } = rest;
          if (!chatbotId || !path || !type) {
            ctx.response.status = 400;
            setJsonCors(ctx);
            ctx.response.body = {
              error: "Missing required fields: chatbotId, doc_path, type",
            };
            return;
          }
          await generateAndStoreEmbeddings(chatbotId, path, type);
          ctx.response.status = 200;
          setJsonCors(ctx);
          ctx.response.body = {
            success: true,
            message: "Embeddings generated and stored successfully",
          };
          break;
        }
        case "ai-chat": {
          const { chatbotId, message } = rest;
          if (!chatbotId || !message) {
            ctx.response.status = 400;
            setJsonCors(ctx);
            ctx.response.body = {
              error: "Missing required fields: chatbotId, message",
            };
            return;
          }
          const reply = await getChatbotResponse(chatbotId, message);
          ctx.response.status = 200;
          setJsonCors(ctx);
          ctx.response.body = {
            success: true,
            reply,
          };
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error("Error in POST / function:", error);
      ctx.response.status = 500;
      setJsonCors(ctx);
      ctx.response.body = {
        error: "Internal Server Error",
        message: JSON.stringify(error),
      };
    }
  });

// Register the router middleware.
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
