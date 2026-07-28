import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Adicionadas propriedades de timeout e limite para evitar ECONNRESET local
const client = postgres(process.env.DATABASE_URL!, { 
  prepare: false,
  max: 10,             // Limita o máximo de conexões locais simultâneas
  idle_timeout: 15,    // Fecha conexões paradas após 15 segundos
  connect_timeout: 15  // Tempo máximo para tentar estabelecer ligação
});

export const db = drizzle(client, { schema });

