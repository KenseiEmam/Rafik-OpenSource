// supabase/functions/send-org-email/index.ts
import { createClient } from "@supabase/supabase-js";

/* ---------- webhook body ---------- */
interface OrgNotification {
  id: number;
  organization: number | null;
  title: string | null;
  body: string | null;
}
interface WebhookPayload {
  type: "INSERT";
  table: "org_notifications";
  schema: "public";
  record: OrgNotification;
}

/* ---------- env ---------- */
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!; // re_******
const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@rafikapp.ae";

/* ---------- client ---------- */
const supabase = createClient(supabaseUrl, serviceKey);

/* ---------- handler ---------- */
Deno.serve(async (req) => {
  try {
    // 1️⃣ parse webhook
    const payload = (await req.json()) as WebhookPayload;
    const { organization, title, body } = payload.record;
    if (!organization) {
      return new Response(
        JSON.stringify({ error: "notification.organization is null" }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2️⃣ fetch admins in the same org
    const { data: admins, error } = await supabase
      .from("users")
      .select("email")
      .eq("organization", organization)
      .contains("roles", ["Organization Admin"]); // roles is text[]
    if (error) throw error;
    if (!admins?.length) {
      return new Response(
        JSON.stringify({ message: "no admins – nothing sent" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
    const to = admins.map((u) => u.email);

    // 3️⃣ send email through Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Rafik App <${fromEmail}>`,
        to,
        subject: title ?? "Organization notification",
        html: body ?? "",
      }),
    });

    const resData = await res.json();
    if (!res.ok) throw resData;

    return new Response(
      JSON.stringify({ sent: to.length, metadata: resData }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-org-email]", err);
    return new Response(JSON.stringify({ error: `${err}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
