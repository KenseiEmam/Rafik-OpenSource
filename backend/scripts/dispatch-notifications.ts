import { db, local } from "../server/db.ts";
import { dispatchNotifications } from "../server/notifications.ts";
if (
  !local ||
  new URL(
    process.env.DATABASE_URL || "postgresql://rafik_api@127.0.0.1:55332/rafik",
  ).hostname !== "127.0.0.1"
)
  throw Error("This dispatcher accepts the local preview only.");
try {
  console.log(
    JSON.stringify({
      sink: "local interception only",
      ...(await dispatchNotifications()),
    }),
  );
} finally {
  await db.$disconnect();
}
