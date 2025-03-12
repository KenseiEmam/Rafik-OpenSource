import { corsHeaders } from "../_shared/corsHeaders.ts";

// In production, replace these with environment variables.
const fromEmail = "email@rafikapp.ae";
const toEmail = "admin@rafikapp.ae";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow POST requests.
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate the JSON body.
    const { name, email, message } = await req.json();
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const subject = `New Contact Form Submission from ${name}`;
    const body = `
You have a new contact form submission:

Name: ${name}
Email: ${email}
Message: ${message}
    `;
    try {
      const url = "https://api.resend.com/emails";

      const data = {
        from: `Rafik App <${fromEmail}>`,
        to: [toEmail],
        subject,
        html: body,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Bearer re_3fq5Vwyc_5kCmPe9youaPhzj1ZpeQQ3j7",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Error sending email: ${await response.text()}`);
      }
      return new Response(
        JSON.stringify({
          message: "Email sent successfully",
          metadata: await response.json(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({
          error: "error in some F way",
          message: error,
          connection,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", error }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
