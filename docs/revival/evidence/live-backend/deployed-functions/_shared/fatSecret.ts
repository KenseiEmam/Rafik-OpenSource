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
export async function sendOAuthRequest(
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
  let body: string | null = null;

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
