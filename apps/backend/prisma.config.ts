import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url:
      process.env.MIGRATION_DATABASE_URL ||
      "postgresql://rafik_migrate:rafik-local-migrations-only@127.0.0.1:55332/rafik",
  },
});
