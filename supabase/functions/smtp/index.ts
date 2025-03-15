import { corsHeaders } from "../_shared/corsHeaders.ts";
import { template } from "../_shared/template.ts";
import { Application, Router } from "jsr:@oak/oak";

// In production, replace these with environment variables.
const fromEmail = "email@rafikapp.ae";
const toEmail = "admin@rafikapp.ae";
const noReply = "noreply@rafikapp.ae";
const subject = "Join Request";

const app = new Application();
const router = new Router();
router
  .get("/", (ctx) => {
    ctx.response.body = "Hello World";
  })
  .post("/", async (ctx) => {
    try {
      let name, email, message;
      if (ctx.request.hasBody) {
        const body = ctx.request.body({ type: "json" });
        const data = await body.value;
        name = data.name;
        email = data.email;
        message = data.message;
        if (!name || !email || !message) {
          ctx.response.status = 400;
          ctx.response.headers.set("Content-Type", "application/json");
          Object.entries(corsHeaders).forEach(([key, value]) => {
            ctx.response.headers.set(key, value);
          });
          ctx.response.body = JSON.stringify({
            error: "Missing required fields",
          });
          return;
        }
      } else {
        ctx.response.status = 400;
        ctx.response.headers.set("Content-Type", "application/json");
        Object.entries(corsHeaders).forEach(([key, value]) => {
          ctx.response.headers.set(key, value);
        });
        ctx.response.body = JSON.stringify({
          error: "No body found.",
        });
        return;
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
        ctx.response.status = 200;
        ctx.response.headers.set("Content-Type", "application/json");
        Object.entries(corsHeaders).forEach(([key, value]) => {
          ctx.response.headers.set(key, value);
        });

        ctx.response.body = {
          message: "Email sent successfully",
          metadata: await response.json(),
        };
      } catch (error) {
        console.error("Error sending email:", error);
        ctx.response.status = 500;
        ctx.response.headers.set("Content-Type", "application/json");
        Object.entries(corsHeaders).forEach(([key, value]) => {
          ctx.response.headers.set(key, value);
        });
        ctx.response.body = {
          error: "Internal Server Error",
          message: error,
        };
      }
    } catch (error) {
      console.error("Error in send-email function:", error);
      console.error("Error sending email:", error);
      ctx.response.status = 500;
      ctx.response.headers.set("Content-Type", "application/json");
      Object.entries(corsHeaders).forEach(([key, value]) => {
        ctx.response.headers.set(key, value);
      });
      ctx.response.body = {
        error: "Internal Server Error",
        message: error,
      };
    }
  })
  .post("/join-request", async (ctx) => {
    try {
      // Parse and validate the JSON body.
      let userName, programName, trainerName, userEmail;
      if (ctx.request.hasBody) {
        const body = ctx.request.body({ type: "json" });
        const data = await body.value;
        userName = data.userName;
        programName = data.programName;
        trainerName = data.trainerName;
        userEmail = data.userEmail;
        // Now you can access properties from the JSON object
        if (!userName || !programName || !trainerName || !userEmail) {
          ctx.response.status = 400;
          ctx.response.headers.set("Content-Type", "application/json");
          Object.entries(corsHeaders).forEach(([key, value]) => {
            ctx.response.headers.set(key, value);
          });
          ctx.response.body = JSON.stringify({
            error: "Missing required fields",
          });
          return;
        }
      } else {
        ctx.response.status = 400;
        ctx.response.headers.set("Content-Type", "application/json");
        Object.entries(corsHeaders).forEach(([key, value]) => {
          ctx.response.headers.set(key, value);
        });
        ctx.response.body = JSON.stringify({
          error: "No body found.",
        });
      }

      const subject = `Join Request for ${userName}`;
      const body = template(userName, trainerName, programName);
      try {
        const url = "https://api.resend.com/emails";

        const data = {
          from: `Rafik App <${noReply}>`,
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
        ctx.response.status = 200;
        ctx.response.headers.set("Content-Type", "application/json");
        Object.entries(corsHeaders).forEach(([key, value]) => {
          ctx.response.headers.set(key, value);
        });

        ctx.response.body = {
          message: "Email sent successfully",
          metadata: await response.json(),
        };
      } catch (error) {
        console.error("Error sending email:", error);
        ctx.response.status = 500;
        ctx.response.headers.set("Content-Type", "application/json");
        Object.entries(corsHeaders).forEach(([key, value]) => {
          ctx.response.headers.set(key, value);
        });
        ctx.response.body = {
          error: "Internal Server Error",
          message: error,
        };
      }
    } catch (error) {
      console.error("Error in send-email function:", error);
      console.error("Error sending email:", error);
      ctx.response.status = 500;
      ctx.response.headers.set("Content-Type", "application/json");
      Object.entries(corsHeaders).forEach(([key, value]) => {
        ctx.response.headers.set(key, value);
      });
      ctx.response.body = {
        error: "Internal Server Error",
        message: error,
      };
    }
  });

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
