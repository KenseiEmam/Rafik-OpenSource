import { corsHeaders } from "../_shared/corsHeaders.ts";
import { Application, Context, Router } from "@oak/oak";
import { sendOAuthRequest } from "../_shared/fatSecret.ts";
import { getChatbotResponse } from "../_shared/chatbot.ts";
import { getFoodResponse } from "../_shared/foodAI.ts";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


// Helper function to set JSON and CORS headers.
function setJsonCors(ctx: Context) {
  ctx.response.headers.set("Content-Type", "application/json");
  Object.entries(corsHeaders).forEach(([key, value]) => {
    ctx.response.headers.set(key, value);
  });
}

const router = new Router();

// Handle OPTIONS requests for all routes.
router.options("/(.*)", (ctx:any) => {
  ctx.response.status = 204; // No content
  Object.entries(corsHeaders).forEach(([key, value]) => {
    ctx.response.headers.set(key, value);
  });
});

const endpoints = ["fat-secret", "ai-embed", "ai-chat", "ai-food"];
router
  .get("/api", (ctx:any) => {
    ctx.response.body = "Hello World";
  })
  .post("/api", async (ctx:any) => {
    try {
      // Ensure the request has a JSON body.
      if (!ctx.request.hasBody) {
        ctx.response.status = 400;
        setJsonCors(ctx);
        ctx.response.body = { error: "No body found." };
        return;
      }
      const data = await ctx.request.body.json();
      const { endpoint, ...rest } = data || {};
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
          const { path, method = "GET", ...params } = rest || {};

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
          const { chatbotId, path, type } = rest || {};
          if (!chatbotId || !path || !type) {
            ctx.response.status = 400;
            setJsonCors(ctx);
            ctx.response.body = {
              success: false,
              error: "Missing required fields: chatbotId, doc_path, type",
            };
            return;
          }

          const res = await fetch(
            "https://faas-fra1-afec6ce7.doserverless.co/api/v1/web/fn-7f8e933c-192a-4815-a302-6365f2819ef6/embed-api/embed",
            {
              headers: {
                "Content-Type": "application/json",
              },
              method: "POST",
              body: JSON.stringify({
                chatbotId,
                path,
                type,
              }),
            }
          );

          if (!res.ok) {
            ctx.response.status = res.status;
            setJsonCors(ctx);
            ctx.response.body = {
              success: false,
              message: "Failed to generate embeddings (status not ok)",
              status: res.status,
            };
            return;
          }
          const result = await res.json();
          if (!result.success) {
            ctx.response.status = 500;
            setJsonCors(ctx);
            ctx.response.body = {
              ...result,
              success: false,
              message: result.message || "Failed to generate embeddings (api)",
            };
            return;
          }
          //TODO: Return back the result based on the output of the fetch...
          ctx.response.status = 200;
          setJsonCors(ctx);
          ctx.response.body = {
            ...result,
            success: true,
            message:
              result.message || "Embeddings generated and stored successfully",
          };
          break;
        }
        case "ai-chat": {
          const { chatbotId, userProgram } = rest || {};
          if (!userProgram) {
            ctx.response.status = 400;
            setJsonCors(ctx);
            ctx.response.body = {
              error: "Missing required fields: chatbotId, message",
            };
            return;
          }
          const reply = await getChatbotResponse(chatbotId, userProgram);
          ctx.response.status = 200;
          setJsonCors(ctx);
          ctx.response.body = {
            success: true,
            reply: reply.answer,
            context: reply.context,
          };
          break;
        }
        case "ai-food": {
          const { query } = rest || {};
          if (!query) {
            ctx.response.status = 400;
            setJsonCors(ctx);
            ctx.response.body = { error: "Missing query!" };
            return;
          }

          try {
            // ✅ Call your caching + GPT logic
            const reply = await getFoodResponse(query);

            ctx.response.status = 200;
            setJsonCors(ctx);

            ctx.response.body = {
              success: true,
              cached: reply.cached ?? false, // Add this flag to indicate cache hit
              reply: reply.answer
            };
          } catch (error) {
            console.error("❌ ai-food error:", error);
            ctx.response.status = 500;
            setJsonCors(ctx);
            ctx.response.body = {
              success: false,
              error: "Internal Server Error",
            };
          }

          break;
        }

        default:
          break;
      }
    } catch (error:any) {
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
