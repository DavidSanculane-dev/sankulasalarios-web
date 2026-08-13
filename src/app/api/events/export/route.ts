import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { attendanceEvents, employees, devices, companies } from "@/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { createClient } from "@/lib/server"; // Importa o cliente de servidor do Supabase
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. BLINDAGEM MULTI-TENANT VIA SUPABASE AUTH (SEGURANÇA ABSOLUTA)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Não Autorizado: Sessão inválida ou expirada.", { status: 401 });
    }

    // Extração segura das propriedades a partir do JWT do Supabase
    const userRole = user.user_metadata?.role as "Administrador" | "Gestor RH" | undefined;
    const userCompanyId = user.user_metadata?.companyId as string | undefined;

    if (!userRole) {
      return new NextResponse("Erro: Nível de acesso (Role) do utilizador não configurado.", { status: 403 });
    }

    // 2. RECOLHA DE FILTROS ADICIONAIS DO UTILIADOR (QUERY STRINGS)
    const { searchParams } = new URL(request.url);
    const urlCompanyId = searchParams.get("companyId");
    const deviceId = searchParams.get("deviceId");
    const eventType = searchParams.get("eventType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [];

    // REGRA DE ISOLAMENTO: 
    // Se for Gestor RH, ignora o companyId do URL e força obrigatoriamente a sua própria empresa.
    // Se for Administrador, pode escolher filtrar por qualquer empresa do URL, ou ver todas se omitido.
    if (userRole === "Gestor RH") {
      if (!userCompanyId) {
        return new NextResponse("Erro: Gestor de RH sem empresa associada no perfil.", { status: 403 });
      }
      conditions.push(eq(attendanceEvents.companyId, userCompanyId));
    } else if (userRole === "Administrador" && urlCompanyId) {
      conditions.push(eq(attendanceEvents.companyId, urlCompanyId));
    }

    // Filtros de negócio opcionais
    if (deviceId) {
      conditions.push(eq(attendanceEvents.deviceId, deviceId));
    }
    if (eventType) {
      conditions.push(eq(attendanceEvents.eventType, eventType as "check_in" | "check_out" | "unknown"));
    }
    if (startDate) {
      conditions.push(gte(attendanceEvents.eventTime, new Date(`${startDate}T00:00:00Z`)));
    }
    if (endDate) {
      conditions.push(lte(attendanceEvents.eventTime, new Date(`${endDate}T23:59:59Z`)));
    }

    // 3. EXECUTAR A CONSULTA RESTRITA AO TENANT NO DRIZZLE ORM
    const events = await db
      .select({
        eventTime: attendanceEvents.eventTime,
        eventType: attendanceEvents.eventType,
        verifyMethod: attendanceEvents.verifyMethod,
        rawDeviceUserId: attendanceEvents.rawDeviceUserId,
        employeeName: employees.fullName,
        deviceName: devices.name,
        deviceBrand: devices.brand,
        companyName: companies.name,
      })
      .from(attendanceEvents)
      .leftJoin(employees, eq(attendanceEvents.employeeId, employees.id))
      .leftJoin(devices, eq(attendanceEvents.deviceId, devices.id))
      .leftJoin(companies, eq(attendanceEvents.companyId, companies.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(attendanceEvents.eventTime));

    // 4. PROCESSAR E CALCULAR AS ESTATÍSTICAS PARA O SUMÁRIO
    const totalRegistos = events.length;
    const totalEntradas = events.filter((e) => e.eventType === "check_in").length;
    const totalSaidas = events.filter((e) => e.eventType === "check_out").length;
    const totalDesconhecidos = events.filter((e) => e.eventType === "unknown").length;
    const colaboradoresUnicos = new Set(events.map((e) => e.rawDeviceUserId)).size;

    // 5. CONSTRUÇÃO DO DOCUMENTO COM EXCELJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Espelho de Ponto");

    // Ativar exibição de linhas de grelha nativas do Excel
    worksheet.views = [{ showGridLines: true }];

    // Título do Bloco de Resumo (A1)
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "=== RESUMO GERAL DO ESPELHO DE PONTO ===";
    titleCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }; // Slate Escuro

    // Inserir métricas resumidas com formatação em negrito nas etiquetas
    const addSummaryRow = (cellA: string, label: string, cellB: string, value: any) => {
      worksheet.getCell(cellA).value = label;
      worksheet.getCell(cellA).font = { name: "Arial", size: 10, bold: true };
      worksheet.getCell(cellB).value = value;
      worksheet.getCell(cellB).font = { name: "Arial", size: 10 };
    };

    addSummaryRow("A2", "Data de Extração:", "B2", new Date().toLocaleString("pt-PT"));
    addSummaryRow("A3", "Total de Eventos:", "B3", totalRegistos);
    addSummaryRow("A4", "Colaboradores Ativos:", "B4", colaboradoresUnicos);
    addSummaryRow("A5", "Total de Entradas:", "B5", totalEntradas);
    addSummaryRow("A6", "Total de Saídas:", "B6", totalSaidas);
    addSummaryRow("A7", "Eventos Desconhecidos:", "B7", totalDesconhecidos);
    addSummaryRow("A8", "Filtro de Período:", "B8", `De [${startDate || "Início"}] até [${endDate || "Hoje"}]`);

    // Deixar duas linhas vazias de espaçamento antes da tabela detalhada
    worksheet.addRow([]);
    worksheet.addRow([]);

    // 6. ADICIONAR O CABEÇALHO DA TABELA PRINCIPAL (Linha 11)
    const headerRow = worksheet.addRow([
      "Trabalhador / ID Biométrico", 
      "Empresa", 
      "Data e Hora", 
      "Operação", 
      "Validação", 
      "Terminal"
    ]);

    // Aplicar estilo de cabeçalho corporativo azul
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0284C7" } }; // Azul Corporativo
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        bottom: { style: "medium", color: { argb: "FF0F172A" } }
      };
    });

    // 7. INSERIR AS LINHAS DE DADOS DETALHADAS
    events.forEach((e) => {
      const colaborador = e.employeeName ? e.employeeName : `ID Biométrico: ${e.rawDeviceUserId} (Pendente)`;
      const empresa = e.companyName || "Sem empresa";
      const dataHora = new Date(e.eventTime).toLocaleString("pt-PT");
      const operacao = e.eventType === "check_in" ? "Entrada" : e.eventType === "check_out" ? "Saída" : "Desconhecido";
      const validacao = e.verifyMethod ? e.verifyMethod.replace(/_/g, " ") : "—";
      const terminal = `${e.deviceName || "Desconhecido"} (${e.deviceBrand || "N/A"})`;

      const insertedRow = worksheet.addRow([colaborador, empresa, dataHora, operacao, validacao, terminal]);

      // Estilização condicional do texto da célula da operação (Coluna 4)
      const operacaoCell = insertedRow.getCell(4);
      if (operacao === "Entrada") {
        operacaoCell.font = { name: "Arial", size: 10, color: { argb: "FF15803D" }, bold: true }; // Verde suave
      } else if (operacao === "Saída") {
        operacaoCell.font = { name: "Arial", size: 10, color: { argb: "FFB91C1C" }, bold: true }; // Vermelho suave
      }
    });

    // 8. AUTO-AJUSTE DINÂMICO DA LARGURA DAS COLUNAS
    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const valueLen = cell.value ? cell.value.toString().length : 0;
        if (valueLen > maxLen) maxLen = valueLen;
      });
      // Define a largura com base no maior texto encontrado na coluna + margem de respiro
      column.width = maxLen < 14 ? 14 : maxLen + 4;
    });

    // 9. GERAR O BUFFER BINÁRIO E DEVOLVER COMO ARQUIVO XLSX VERDADEIRO
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="espelho_ponto_${new Date().toISOString().split('T')[0]}.xlsx"`,
        "Cache-Control": "no-store, max-age=0"
      },
    });

  } catch (error) {
    console.error("Erro crítico na exportação ExcelJS:", error);
    return NextResponse.json({ error: "Erro interno ao processar a exportação do ficheiro." }, { status: 500 });
  }
}
