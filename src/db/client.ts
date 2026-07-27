import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// IMPORTANTE: usa sempre o DATABASE_URL do "Transaction pooler" do Supabase aqui,
// nunca a ligação direta - em ambiente serverless (Vercel) cada invocação pode
// abrir uma nova ligação, e o Postgres direto esgota-se rapidamente.
// prepare: false é obrigatório em modo transaction pooling (PgBouncer).
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client, { schema });
