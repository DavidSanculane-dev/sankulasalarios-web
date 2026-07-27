import { z } from "zod";

/**
 * Contrato de dados único para o qual TODOS os adaptadores (ZKTeco, Hikvision,
 * Suprema, e futuros) devem converter os seus payloads nativos antes de
 * gravar na base de dados. Isto mantém o resto da aplicação (regras de
 * turnos, relatórios) completamente ignorante de qual foi a marca de origem.
 */
export const NormalizedEventSchema = z.object({
  deviceSerialNumber: z.string().min(1),
  rawDeviceUserId: z.string().min(1),
  eventTime: z.date(),
  eventType: z.enum(["check_in", "check_out", "unknown"]).default("unknown"),
  verifyMethod: z
    .enum(["fingerprint", "face", "card", "password", "unknown"])
    .default("unknown"),
  rawPayload: z.record(z.unknown()).optional(),
});

export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;
