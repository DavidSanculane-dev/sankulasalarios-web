import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { attendanceEvents, devices, companies } from "@/db/schema";

export async function GET() {
  try {
    // 1. Procura uma empresa e um dispositivo existentes para não quebrar as chaves estrangeiras
    const empresa = await db.select().from(companies).limit(1);
    const dispositivo = await db.select().from(devices).limit(1);

    if (empresa.length === 0 || dispositivo.length === 0) {
      return NextResponse.json({ 
        error: "Antes de testar, precisa de registar pelo menos 1 Empresa e 1 Terminal nas páginas do painel!" 
      });
    }

    // 2. Injeta eventos fictícios (2 não mapeados e 1 limpo)
    await db.insert(attendanceEvents).values([
      {
        companyId: empresa[0].id,
        deviceId: dispositivo[0].id,
        rawDeviceUserId: "9901", // ID não mapeado para testar o seu novo modal amarelo
        eventTime: new Date(),
        eventType: "check_in",
        verifyMethod: "fingerprint",
      },
      {
        companyId: empresa[0].id,
        deviceId: dispositivo[0].id,
        rawDeviceUserId: "9902", // Outro ID não mapeado
        eventTime: new Date(Date.now() - 3600000), // Há 1 hora
        eventType: "check_out",
        verifyMethod: "face",
      }
    ]);

    return NextResponse.json({ success: "Eventos de teste criados! Abra a página de Eventos para verificar." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
