// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/corsHeaders.ts";

console.log("Hello from Functions!");

interface ClientResponse {
  data: Array<{
    id: number;
    token: string;
    created_at: string;
    expires_in: number;
  }>;
  error: Error | null;
}

// Fetch or generate a new token
async function fetchOrGenerateToken() {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  const { data, error } = (await supabaseClient
    .from("secret_tokens")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)) as ClientResponse;

  if (error) {
    throw error;
  }

  const now = Math.floor(Date.now() / 1000); // Current time in seconds

  if (
    data.length === 0 || // No token found
    (now - new Date(data[0].created_at).getTime() / 1000) >
      (data[0].expires_in - 20) // Token expired or will expire in less than 20 seconds
  ) {
    // No valid token or about to expire
    console.log(
      "No valid token found or token expiring soon. Generating new one...",
    );

    // Call the OAuth 2 API to generate a new token
    const newToken = await generateOAuthToken();
    const expiresIn = newToken.expires_in; // Duration in seconds until token expires
    const token = newToken.token; // The actual token

    // Insert the new token into the database
    const { error: insertError } = await supabaseClient
      .from("secret_tokens")
      .insert([{ token, expires_in: expiresIn }]);

    if (insertError) {
      console.error("Error inserting new token:", insertError);
      throw insertError;
    }

    return token; // Return the new token
  } else {
    // Token is still valid
    console.log("Valid token found:", data[0].token);
    return data[0].token; // Return the existing token
  }
}

// Generate a new OAuth 2.0 token using FatSecret API
async function generateOAuthToken() {
  const url = "https://oauth.fatsecret.com/connect/token";
  const clientID = Deno.env.get("FAT_SOURCE_ID") ?? "";
  const clientSecret = Deno.env.get("FAT_SOURCE_SECRET") ?? "";

  const body = new URLSearchParams({
    "grant_type": "client_credentials",
    "scope": "basic",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${clientID}:${clientSecret}`)}`, // Base64-encoded credentials
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch token: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    token: data.access_token,
    expires_in: data.expires_in,
  };
}

Deno.serve(async (req) => {
  const body = await req.json();
  const { path, method, Authorization: _, ...headers } = Object.fromEntries(
    req.headers.entries(),
  );

  if (!path || typeof path !== "string" || !path.startsWith("/")) {
    return new Response(
      JSON.stringify({
        error:
          "Please make sure to provide a valid 'path' parameter in the headers to the FatSecret API including the leading slash. Example: /food/get",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }

  try {
    const token = await fetchOrGenerateToken();
    // Relay the incoming request to the target API using the valid token;
    let apiResponse: Response;
    const content = req.body ? JSON.stringify(body) : null;

    if (method && method !== "GET") {
      const params = "?" + new URLSearchParams(content || {}).toString();
      apiResponse = await fetch(
        `https://platform.fatsecret.com${path || ""}${params}`,
        {
          method: method,
          headers: {
            ...headers, // Forward all incoming headers
            "Authorization": `Bearer ${token}`, // Use the token in the request
            "Content-Type": "application/json", // Assuming you're forwarding JSON data
          },
          body: content, // Forward request body if it exists
        },
      );
    } else {
      apiResponse = await fetch(
        `https://platform.fatsecret.com${path || ""}`,
        {
          headers: {
            ...headers, // Forward all incoming headers
            "Authorization": `Bearer ${token}`, // Use the token in the request
            "Content-Type": "application/json", // Assuming you're forwarding JSON data
          },
        },
      );
    }

    const apiData = await apiResponse.json();

    return new Response(JSON.stringify(apiData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fat-secret' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
