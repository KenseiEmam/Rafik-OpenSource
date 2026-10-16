import { db } from "./db.ts";
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
export async function localInbox() {
  const messages = await db.mail_messages.findMany({
    where: { expires_at: { gt: new Date() } },
    orderBy: { created_at: "desc" },
    take: 100,
  });
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rafik local inbox</title><style>body{font:17px/1.6 system-ui;background:#f7f8f4;color:#263b34;margin:0}main{max-width:700px;margin:3rem auto;padding:0 1.25rem}h1{line-height:1.2}article{background:white;border:1px solid #dbe1d5;border-radius:12px;padding:1rem 1.5rem;margin:1rem 0;overflow-wrap:anywhere}code{font-size:2rem;letter-spacing:.2em}a{color:#285c49}time{font-size:.85rem}header{display:flex;align-items:center;gap:2rem;flex-wrap:wrap}</style><main><header><h1>Local inbox</h1><a href="/local/inbox">Refresh inbox</a></header><p>Sign-in codes for this local preview. Nothing is sent by email. Codes expire after ten minutes and can be used once.</p>${messages.length ? messages.map((message) => `<article><h2>${escape(message.email)}</h2><p>${escape(message.subject)}</p><code>${escape(message.body)}</code><p><time datetime="${message.created_at.toISOString()}">${message.created_at.toISOString().replace("T", " ").slice(0, 19)} UTC</time></p></article>`).join("") : "<p>No active codes. Request one from the sign-in page, then refresh this inbox.</p>"}</main></html>`;
}
