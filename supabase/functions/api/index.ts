import { corsHeaders } from "../_shared/corsHeaders.ts";
import { template } from "../_shared/template.ts";
import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";

// Generate a unique nonce (random string) for each request
function generateNonce(length: number): string {
  const possibleChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += possibleChars.charAt(
      Math.floor(Math.random() * possibleChars.length)
    );
  }
  return result;
}

// Function to percent-encode according to RFC 3986
function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return "%" + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

// Function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Generate the HMAC-SHA1 signature using the built-in Deno crypto API
async function generateHMACSHA1Signature(
  key: string,
  data: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataToSign = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataToSign);

  // Correctly convert the signature to a base64 string
  const base64Signature = arrayBufferToBase64(signature);

  return base64Signature;
}

// OAuth 1.0 request function for FatSecret API
async function sendOAuthRequest(
  method: string,
  path: string,
  params: Record<string, string>
) {
  const baseUrl = "https://platform.fatsecret.com/rest/server.api";
  const consumerKey = Deno.env.get("FAT_SOURCE_CONSUMER_KEY") ?? "";
  const consumerSecret = Deno.env.get("FAT_SOURCE_SECRET") ?? "";
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = generateNonce(16);

  // OAuth parameters
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp.toString(),
    oauth_version: "1.0",
  };

  // Include 'method' in API parameters
  params["method"] = path;

  // Combine all parameters (OAuth and API-specific)
  const allParams = { ...oauthParams, ...params };

  // Remove 'oauth_signature' if it exists
  delete allParams["oauth_signature"];

  // Sort and encode all parameters
  const sortedParams = Object.keys(allParams).sort();
  const encodedParams = sortedParams
    .map((key) => `${percentEncode(key)}=${percentEncode(allParams[key])}`)
    .join("&");

  // Create the signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    percentEncode(baseUrl),
    percentEncode(encodedParams),
  ].join("&");

  // Construct the signing key without percent-encoding the consumerSecret
  const signingKey = `${consumerSecret}&`;

  // Generate the OAuth signature
  const signature = await generateHMACSHA1Signature(
    signingKey,
    signatureBaseString
  );

  // Log for debugging
  console.log("Signature Base String:", signatureBaseString);
  console.log("Signing Key:", signingKey);
  console.log("Generated Signature:", signature);

  // Add the signature to the OAuth parameters without percent-encoding
  oauthParams["oauth_signature"] = signature;

  // Combine all parameters for the request
  const requestParams = { ...oauthParams, ...params };

  // Prepare the URL and body for the request
  let url = baseUrl;
  let body = null;

  // Use the same encoding for request parameters
  const encodedRequestParams = Object.keys(requestParams)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(requestParams[key])}`)
    .join("&");

  if (method.toUpperCase() === "GET") {
    url += `?${encodedRequestParams}`;
  } else {
    body = encodedRequestParams;
  }

  // Send the request to FatSecret
  const apiResponse = await fetch(url, {
    method: method.toUpperCase(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body,
  });

  // Handle errors in the response
  if (!apiResponse.ok) {
    const error = await apiResponse.text();
    throw new Error(`Error fetching FatSecret API: ${error}`);
  }

  // Return the parsed response
  return await apiResponse.json();
}

// Helper function to set JSON and CORS headers.
function setJsonCors(ctx: any) {
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

const endpoints = ["fat-secret"];
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
      const reqBody = ctx.request.body({ type: "json" });
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
        case "fat-secret":
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

        default:
          break;
      }
    } catch (error) {
      console.error("Error in POST / function:", error);
      ctx.response.status = 500;
      setJsonCors(ctx);
      ctx.response.body = {
        error: "Internal Server Error",
        message: error.toString(),
      };
    }
  });

// Register the router middleware.
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
