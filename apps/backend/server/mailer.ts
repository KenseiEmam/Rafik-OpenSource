import { spawn } from "node:child_process";

const mailbox = (value: string) => value.match(/<([^<>]+)>/)?.[1] || value;

export function signInMessage(to: string, code: string) {
  const from = process.env.RAFIK_MAIL_FROM || "";
  if (/[^\x20-\x7e]/.test(from) || /[\r\n]/.test(from))
    throw new Error("invalid_mail_sender");
  return [
    `From: ${from}`,
    `To: ${to}`,
    "Subject: Your Rafik sign-in code",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    `Your Rafik sign-in code is ${code}. It expires in ten minutes and can only be used once.`,
    "",
  ].join("\r\n");
}

export async function sendSignInCode(to: string, code: string) {
  const tlsMode = process.env.RAFIK_SMTP_TLS_MODE;
  const args = [
    `--host=${process.env.RAFIK_SMTP_HOST}`,
    `--port=${process.env.RAFIK_SMTP_PORT}`,
    "--auth=on",
    `--user=${process.env.RAFIK_SMTP_USER}`,
    "--passwordeval=printenv RAFIK_SMTP_PASSWORD",
    "--tls=on",
    "--tls-certcheck=on",
    `--tls-starttls=${tlsMode === "implicit" ? "off" : "on"}`,
    `--from=${mailbox(process.env.RAFIK_MAIL_FROM || "")}`,
    "--read-recipients",
  ];
  await new Promise<void>((resolve, reject) => {
    const child = spawn("msmtp", args, {
      env: process.env,
      stdio: ["pipe", "ignore", "ignore"],
    });
    child.once("error", () => reject(new Error("mail_delivery_failed")));
    child.once("close", (status) =>
      status === 0 ? resolve() : reject(new Error("mail_delivery_failed")),
    );
    child.stdin.end(signInMessage(to, code));
  });
}
