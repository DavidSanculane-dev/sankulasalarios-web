import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { attendanceEvents, employees, companies } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { createClient } from "@/lib/server";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. ISOLAMENTO MULTI-TENANT (SUPABASE AUTH)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Não Autorizado", { status: 401 });
    }

    const userRole = user.user_metadata?.role as "Administrador" | "Gestor RH";
    const userCompanyId = user.user_metadata?.companyId as string;

    const { searchParams } = new URL(request.url);
    const urlCompanyId = searchParams.get("companyId");
    
    // Obter intervalo de datas para desenhar as colunas dos dias no Excel
    const startDateParam = searchParams.get("startDate") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDateParam = searchParams.get("endDate") || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    const startQueryDate = new Date(`${startDateParam}T00:00:00Z`);
    const endQueryDate = new Date(`${endDateParam}T23:59:59Z`);

    const conditions = [
      gte(attendanceEvents.eventTime, startQueryDate),
      lte(attendanceEvents.eventTime, endQueryDate)
    ];

    if (userRole === "Gestor RH") {
      conditions.push(eq(attendanceEvents.companyId, userCompanyId));
    } else if (userRole === "Administrador" && urlCompanyId) {
      conditions.push(eq(attendanceEvents.companyId, urlCompanyId));
    }

    // 2. RECOLHER TODOS OS EVENTOS DO PERÍODO
    const rawEvents = await db
      .select({
        eventTime: attendanceEvents.eventTime,
        eventType: attendanceEvents.eventType,
        rawDeviceUserId: attendanceEvents.rawDeviceUserId,
        employeeId: attendanceEvents.employeeId,
        employeeName: employees.fullName,
        employeeCode: employees.employeeCode,
      })
      .from(attendanceEvents)
      .leftJoin(employees, eq(attendanceEvents.employeeId, employees.id))
      .where(and(...conditions));

        // ...Continuação da Parte 1

    // 3. IDENTIFICAR TODOS OS DIAS DO INTERVALO DO RELATÓRIO
    const datesArray: string[] = [];
    let currentLoopDate = new Date(startQueryDate);
    while (currentLoopDate <= endQueryDate) {
      datesArray.push(currentLoopDate.toISOString().split("T")[0]);
      currentLoopDate.setDate(currentLoopDate.getDate() + 1);
    }

    // 4. AGRUPAR TRABALHADORES E SUAS PICAGENS POR DIA
    const staffMatrix: Record<string, { code: string; name: string; days: Record<string, { ins: Date[]; outs: Date[] }> }> = {};

    rawEvents.forEach((ev) => {
      const key = ev.employeeCode || ev.rawDeviceUserId;
      const dayKey = new Date(ev.eventTime).toISOString().split("T")[0];

      if (!staffMatrix[key]) {
        staffMatrix[key] = {
          code: ev.employeeCode || `BIO-${ev.rawDeviceUserId}`,
          name: ev.employeeName || `Pendente (ID: ${ev.rawDeviceUserId})`,
          days: {},
        };
      }

      if (!staffMatrix[key].days[dayKey]) {
        staffMatrix[key].days[dayKey] = { ins: [], outs: [] };
      }

      if (ev.eventType === "check_in") {
        staffMatrix[key].days[dayKey].ins.push(new Date(ev.eventTime));
      } else if (ev.eventType === "check_out") {
        staffMatrix[key].days[dayKey].outs.push(new Date(ev.eventTime));
      }
    });

    // 5. INICIALIZAÇÃO DA FOLHA EXCEL COM EXCELJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");
    worksheet.views = [{ showGridLines: true }];

    // Definição de Estilos Visuais (Cores baseadas no seu modelo)
    const grayFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }; 
    const yellowFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE047" } }; 
    const borderStyle = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };

      

    // --- LINHA 1: Cabeçalho Superior (Agrupamento dos Dias) ---
    // 🔴 SUBSTITUA O TRÊS BLOCOS DE CABEÇALHOS DA PARTE 3 POR ESTE CÓDIGO CORRIGIDO:

      // --- LINHA 1: Criar a linha e definir apenas as células necessárias (Sem push de vazios) ---
      const headerRow1 = worksheet.addRow([]);
      headerRow1.height = 26;

      // Definir o texto dos dias nas colunas certas pulando de 10 em 10
      let currentDayCol = 3; // Começa na coluna C (3)
      datesArray.forEach((dateStr) => {
        const formattedDate = new Date(dateStr).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
        headerRow1.getCell(currentDayCol).value = formattedDate;
        currentDayCol += 10;
      });

      // --- LINHA 2: Sub-Cabeçalhos das Métricas (Aqui é um array simples porque todas as colunas têm texto) ---
      const row2Values = ["ID", "Name"];
      datesArray.forEach(() => {
        row2Values.push("DUTY", "In Time", "Out Time", "Working Hrs", "Late", "Early In", "Early Out", "Hexa Hrs 200%", "Hexa Hrs 150%", "Extra");
      });
      const headerRow2 = worksheet.addRow(row2Values);
      headerRow2.height = 24;

      // --- APLICAR AS MESCLAGENS (MERGES) VISUAIS ---
      worksheet.mergeCells("A1:A2");
      worksheet.mergeCells("B1:B2");

      worksheet.getCell("A1").value = "ID";
      worksheet.getCell("B1").value = "Name";

      ["A1", "A2", "B1", "B2"].forEach((cellRef) => {
        const cell = worksheet.getCell(cellRef);
        cell.fill = grayFill as ExcelJS.Fill;
        cell.font = { name: "Arial", size: 10, bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = borderStyle as ExcelJS.Borders;
      });

      // Mesclar horizontalmente e estilizar cada dia
      let currentColIndex = 3; 
      datesArray.forEach(() => {
        const startCell = worksheet.getCell(1, currentColIndex);
        worksheet.mergeCells(1, currentColIndex, 1, currentColIndex + 9);
        
        startCell.fill = yellowFill as ExcelJS.Fill;
        startCell.font = { name: "Arial", size: 10, bold: true };
        startCell.alignment = { vertical: "middle", horizontal: "center" };

        for (let i = 0; i < 10; i++) {
          const subCell = worksheet.getCell(2, currentColIndex + i);
          subCell.fill = yellowFill as ExcelJS.Fill;
          subCell.font = { name: "Arial", size: 9, bold: true };
          subCell.alignment = { vertical: "middle", horizontal: "center" };
          subCell.border = borderStyle as ExcelJS.Borders;
        }
        currentColIndex += 10;
      });


    // --- 6. PREENCHER AS LINHAS DE ASSIDUIDADE ---
    Object.values(staffMatrix).forEach((staff) => {
      const rowData: any[] = [staff.code, staff.name];

      datesArray.forEach((dateStr) => {
        const dayData = staff.days[dateStr];
        
        if (dayData && (dayData.ins.length > 0 || dayData.outs.length > 0)) {
          const firstIn = dayData.ins.length > 0 ? new Date(Math.min(...dayData.ins.map(d => d.getTime()))) : null;
          const lastOut = dayData.outs.length > 0 ? new Date(Math.max(...dayData.outs.map(d => d.getTime()))) : null;

          const inStr = firstIn ? firstIn.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) : "";
          const outStr = lastOut ? lastOut.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) : "";

          let workingHrsStr = "";
          if (firstIn && lastOut) {
            const diffMs = lastOut.getTime() - firstIn.getTime();
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            workingHrsStr = `${diffHrs.toString().padStart(2, "0")}:${diffMins.toString().padStart(2, "0")}`;
          }

          rowData.push("SIM", inStr, outStr, workingHrsStr, "", "", "", "", "", "");
        } else {
          rowData.push("NÃO", "", "", "", "", "", "", "", "", "");
        }
      });

      const insertedRow = worksheet.addRow(rowData);
      insertedRow.height = 20;

      insertedRow.eachCell((cell) => {
        cell.font = { name: "Arial", size: 9 };
        cell.border = borderStyle as ExcelJS.Borders;
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
      insertedRow.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    });

    // Configurar larguras padrão das colunas
    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 28;
    for (let col = 3; col <= row2Values.length; col++) {
      worksheet.getColumn(col).width = 11;
    }

    // 7. RESPONDER COM O FICHEIRO XLSX GERADO
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="timesheet_mensal_${startDateParam}.xlsx"`,
      },
    });

  } catch (error) {
    console.error("Erro no Timesheet:", error);
    return NextResponse.json({ error: "Erro interno ao gerar o ficheiro." }, { status: 500 });
  }
}


