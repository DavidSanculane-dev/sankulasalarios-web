import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Para as migrations usa-se a ligação DIRETA (não o pooler), o drizzle-kit precisa
  // de fazer operações que o modo transaction pooling do PgBouncer não suporta.
  dbCredentials: {
    url: process.env.DIRECT_URL!,
  },
});
