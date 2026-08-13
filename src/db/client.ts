import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Previne a duplicação de conexões em ambiente de desenvolvimento local
const globalForPostgres = globalThis as unknown as {
  postgresClient: postgres.Sql | undefined;
};

const connectionString = process.env.DATABASE_URL!;

const client =
  globalForPostgres.postgresClient ??
  postgres(connectionString, {
    prepare: false,
    max: 10,
    idle_timeout: 15,
    connect_timeout: 15,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresClient = client;
}

export const db = drizzle(client, { schema });

