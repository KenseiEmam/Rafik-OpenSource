// supabase/functions/send-email/index.ts

import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";
import { corsHeaders } from "../_shared/corsHeaders.ts";

// In production, replace these with environment variables.
const SMTP_HOST = "mail.rafikapp.ae";
const SMTP_PORT = 465; // or the port your SMTP server uses for TLS
const SMTP_USERNAME = "email@rafikapp.ae";
const SMTP_PASSWORD = "C?4kp3@A?2$x";

serve(async (req) => {
  try {
    // Only allow POST requests.
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate the JSON body.
    const { name, email, message } = await req.json();
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create and connect the SMTP client.
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD,
    });

    const subject = `New Contact Form Submission from ${name}`;
    const body = `
You have a new contact form submission:

Name: ${name}
Email: ${email}
Message: ${message}
    `;

    // Send the email.
    await client.send({
      from: `Rafik Contact Form <${SMTP_USERNAME}>`,
      to: `Admin <admin@rafikapp.ae>`,
      subject: subject,
      content: body,
    });
    await client.close();

    return new Response(
      JSON.stringify({ message: "Email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
