import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations/db push/studio want a direct (non-pooled) connection —
    // pooled connections can behave oddly for schema-changing operations.
    // The app itself (lib/db.ts) uses the pooled DATABASE_URL at runtime.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
