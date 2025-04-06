import { corsHeaders } from "../_shared/corsHeaders.ts";
import { template } from "../_shared/template.ts";
import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";

// In production, replace these with environment variables.
const fromEmail = "email@rafikapp.ae";
const toEmail = "admin@rafikapp.ae";
const noReply = "noreply@rafikapp.ae";

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

router
  .get("/smtp", (ctx) => {
    // Simple POST route to test the function.
    ctx.response.body = "Hello World";
  })
  .post("/smtp", async (ctx) => {
    try {
      let name: string, email: string, message: string;

      // Ensure the request has a JSON body.
      if (ctx.request.hasBody) {
        const reqBody = ctx.request.body({ type: "json" });
        const data = await reqBody.value;
        name = data.name;
        email = data.email;
        message = data.message;

        // Validate required fields.
        if (!name || !email || !message) {
          ctx.response.status = 400;
          setJsonCors(ctx);
          ctx.response.body = { error: "Missing required fields" };
          return;
        }
      } else {
        ctx.response.status = 400;
        setJsonCors(ctx);
        ctx.response.body = { error: "No body found." };
        return;
      }

      const emailSubject = `New Contact Form Submission from ${name}`;
      const emailBody = `
You have a new contact form submission:

Name: ${name}
Email: ${email}
Message: ${message}
      `;

      // Send email using the Resend API.
      try {
        const url = "https://api.resend.com/emails";
        const payload = {
          from: `Rafik App <${fromEmail}>`,
          to: [toEmail],
          subject: emailSubject,
          html: emailBody,
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: "Bearer re_3fq5Vwyc_5kCmPe9youaPhzj1ZpeQQ3j7", // Replace with env variable in production.
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Error sending email: ${await response.text()}`);
        }

        ctx.response.status = 200;
        setJsonCors(ctx);
        ctx.response.body = {
          message: "Email sent successfully",
          metadata: await response.json(),
        };
      } catch (error) {
        console.error("Error sending email:", error);
        ctx.response.status = 500;
        setJsonCors(ctx);
        ctx.response.body = {
          error: "Internal Server Error",
          message: error.toString(),
        };
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
  })
  .post("/smtp/join-request", async (ctx) => {
    try {
      let userName: string,
        programName: string,
        trainerName: string,
        userEmail: string;

      // Ensure the request has a JSON body.
      if (ctx.request.hasBody) {
        const reqBody = ctx.request.body({ type: "json" });
        const data = await reqBody.value;
        userName = data.userName;
        programName = data.programName;
        trainerName = data.trainerName;
        userEmail = data.userEmail;

        // Validate required fields.
        if (!userName || !programName || !trainerName || !userEmail) {
          ctx.response.status = 400;
          setJsonCors(ctx);
          ctx.response.body = { error: "Missing required fields" };
          return;
        }
      } else {
        ctx.response.status = 400;
        setJsonCors(ctx);
        ctx.response.body = { error: "No body found." };
        return;
      }

      const emailSubject = `Join Request for ${userName}`;
      const emailBody = template(userName, trainerName, programName);

      // Send join request email using the Resend API.
      try {
        const url = "https://api.resend.com/emails";
        const payload = {
          from: `Rafik App <${noReply}>`,
          to: [userEmail],
          subject: emailSubject,
          html: emailBody,
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: "Bearer re_3fq5Vwyc_5kCmPe9youaPhzj1ZpeQQ3j7", // Replace with env variable in production.
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Error sending email: ${await response.text()}`);
        }

        ctx.response.status = 200;
        setJsonCors(ctx);
        ctx.response.body = {
          message: "Email sent successfully",
          metadata: await response.json(),
        };
      } catch (error) {
        console.error("Error sending join-request email:", error);
        ctx.response.status = 500;
        setJsonCors(ctx);
        ctx.response.body = {
          error: "Internal Server Error",
          message: error.toString(),
        };
      }
    } catch (error) {
      console.error("Error in POST /join-request function:", error);
      ctx.response.status = 500;
      setJsonCors(ctx);
      ctx.response.body = {
        error: "Internal Server Error",
        message: error.toString(),
      };
    }
  })
  .post("/smtp/org-join-request", async (ctx) => {
    try {
      // Ensure the request has a JSON body.
      if (ctx.request.hasBody) {
        const reqBody = ctx.request.body({ type: "json" });
        const data = await reqBody.value;

        // Expecting a JSON array of emails.
        if (!Array.isArray(data) || data.length === 0) {
          ctx.response.status = 400;
          setJsonCors(ctx);
          ctx.response.body = { error: "Missing required emails" };
          return;
        }
        const emails: string[] = data;

        // Send email to each address.
        const results = [];
        for (const email of emails) {
          const payload = {
            from: `Rafik App <${noReply}>`,
            to: [email],
            subject: "Join Request to Our Organization",
            html: orgTemplate,
          };

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: "Bearer re_3fq5Vwyc_5kCmPe9youaPhzj1ZpeQQ3j7", // Use env variable in production.
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            results.push({ email, error: await response.text() });
          } else {
            results.push({
              email,
              status: "sent",
              metadata: await response.json(),
            });
          }
        }

        ctx.response.status = 200;
        setJsonCors(ctx);
        ctx.response.body = {
          message: "Emails sent successfully",
          results,
        };
      } else {
        ctx.response.status = 400;
        setJsonCors(ctx);
        ctx.response.body = { error: "No body found." };
      }
    } catch (error) {
      console.error("Error in POST /smtp/org-join-request function:", error);
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
