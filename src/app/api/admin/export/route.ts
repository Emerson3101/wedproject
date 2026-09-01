import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import {
  createSupabaseServerClient,
  type Guest,
  type Companion,
  type SeatingTable,
  type SeatingSeat,
} from "@/lib/supabase";
import { isSupabaseServerConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";

/* ============================================
   ADMIN EXPORT API — Exportación a Excel (.xlsx)
   --------------------------------------------
   Estructura:
   1. Hoja "Distribución de Mesas":
      - Resumen de métricas generales (2 columnas directas).
      - Tablas individuales por cada mesa (Nº Silla + Nombre).
   2. Hoja "Lista de Invitados":
      - Lista concisa para chequeo rápido (#, Nombre, Mesa, Silla).
   ============================================ */

export async function GET() {
  const auth = await requireAdmin({ wrapOk: true });
  if (!auth.ok) return auth.response;

  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server no está configurado." },
      { status: 503 }
    );
  }

  const supabase = createSupabaseServerClient()!;

  // 1. Obtener datos necesarios en paralelo
  const [guestsRes, companionsRes, tablesRes, seatsRes] = await Promise.all([
    supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("companions")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("seating_tables")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("seating_seats")
      .select("*")
      .order("seat_index", { ascending: true }),
  ]);

  if (guestsRes.error) {
    console.error("Export API — Error al obtener invitados:", guestsRes.error);
    return NextResponse.json({ ok: false, error: guestsRes.error.message }, { status: 500 });
  }
  if (companionsRes.error) {
    console.error("Export API — Error al obtener acompañantes:", companionsRes.error);
  }
  if (tablesRes.error) {
    console.error("Export API — Error al obtener mesas:", tablesRes.error);
    return NextResponse.json({ ok: false, error: tablesRes.error.message }, { status: 500 });
  }
  if (seatsRes.error) {
    console.error("Export API — Error al obtener asientos:", seatsRes.error);
    return NextResponse.json({ ok: false, error: seatsRes.error.message }, { status: 500 });
  }

  const guests = (guestsRes.data || []) as Guest[];
  const companions = (companionsRes.data || []) as Companion[];
  const tables = (tablesRes.data || []) as SeatingTable[];
  const seats = (seatsRes.data || []) as SeatingSeat[];

  // 2. Mapas de lookup
  const tablesById = new Map<string, SeatingTable>();
  for (const t of tables) tablesById.set(t.id, t);

  const companionsByGuestId = new Map<string, Companion[]>();
  for (const c of companions) {
    const list = companionsByGuestId.get(c.guest_id) || [];
    list.push(c);
    companionsByGuestId.set(c.guest_id, list);
  }

  // Mapear asientos por table_id
  const seatsByTableId = new Map<string, SeatingSeat[]>();
  for (const s of seats) {
    const list = seatsByTableId.get(s.table_id) || [];
    list.push(s);
    seatsByTableId.set(s.table_id, list);
  }

  // Mapear asientos por guest_id (lead)
  const seatByGuestId = new Map<string, { table: SeatingTable; seat: SeatingSeat }>();
  for (const s of seats) {
    if (s.guest_id && tablesById.has(s.table_id)) {
      seatByGuestId.set(s.guest_id, {
        table: tablesById.get(s.table_id)!,
        seat: s,
      });
    }
  }

  // Mapear asientos de companions por party_key
  const companionSeatsByParty = new Map<string, { table: SeatingTable; seat: SeatingSeat }[]>();
  for (const s of seats) {
    if (s.source === "companion" && tablesById.has(s.table_id)) {
      const list = companionSeatsByParty.get(s.party_key) || [];
      list.push({
        table: tablesById.get(s.table_id)!,
        seat: s,
      });
      companionSeatsByParty.set(s.party_key, list);
    }
  }

  // 3. Estructura unificada de asistentes (sin jerarquía)
  interface AttendeeRow {
    name: string;
    status: "confirmed" | "declined" | "pending";
    statusLabel: string;
    tableName: string;
    seatNumber: string;
  }

  const attendees: AttendeeRow[] = [];

  for (const guest of guests) {
    const leadSeatInfo = seatByGuestId.get(guest.id);
    const guestStatusLabel =
      guest.status === "confirmed"
        ? "Confirmado"
        : guest.status === "declined"
        ? "Declinó"
        : "Pendiente";

    // Fila del invitado
    attendees.push({
      name: guest.name,
      status: guest.status,
      statusLabel: guestStatusLabel,
      tableName: leadSeatInfo ? leadSeatInfo.table.name : "Sin asignar",
      seatNumber: leadSeatInfo ? `Silla ${leadSeatInfo.seat.seat_index + 1}` : "—",
    });

    // Filas de acompañantes
    const guestCompanions = companionsByGuestId.get(guest.id) || [];
    const partySeats = companionSeatsByParty.get(guest.id) || [];

    guestCompanions.forEach((comp, idx) => {
      const matchedSeat =
        partySeats.find(
          (ps) => ps.seat.seat_label.trim().toLowerCase() === comp.name.trim().toLowerCase()
        ) || partySeats[idx];

      attendees.push({
        name: comp.name,
        status: guest.status,
        statusLabel: guestStatusLabel,
        tableName: matchedSeat ? matchedSeat.table.name : "Sin asignar",
        seatNumber: matchedSeat ? `Silla ${matchedSeat.seat.seat_index + 1}` : "—",
      });
    });
  }

  // Personas añadidas directamente a mesas (ad-hoc)
  const adhocSeats = seats.filter((s) => s.source === "adhoc");
  for (const s of adhocSeats) {
    const table = tablesById.get(s.table_id);
    attendees.push({
      name: s.seat_label,
      status: "confirmed",
      statusLabel: "Confirmado",
      tableName: table ? table.name : "Sin asignar",
      seatNumber: `Silla ${s.seat_index + 1}`,
    });
  }

  // Métricas
  const totalRegistered = attendees.length;
  const confirmedCount = attendees.filter((a) => a.status === "confirmed").length;
  const pendingCount = attendees.filter((a) => a.status === "pending").length;
  const declinedCount = attendees.filter((a) => a.status === "declined").length;

  let totalCapacity = 0;
  for (const t of tables) totalCapacity += t.capacity;
  const occupiedSeatsCount = seats.length;
  const freeSeatsCount = Math.max(0, totalCapacity - occupiedSeatsCount);

  // 4. Crear el Libro de Excel con ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Bodas — Alma & Chava";
  workbook.lastModifiedBy = "Panel de Administración";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Estilos
  const BURGUNDY_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF722F37" },
  };

  const WINE_MID_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4A2F38" },
  };

  const TABLE_HEADER_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF5C3B47" },
  };

  const PLATINUM_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEAE8EE" },
  };

  const ZEBRA_LIGHT_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF9F8FA" },
  };

  const WHITE_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFFFF" },
  };

  const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFD0CBD5" } },
    left: { style: "thin", color: { argb: "FFD0CBD5" } },
    bottom: { style: "thin", color: { argb: "FFD0CBD5" } },
    right: { style: "thin", color: { argb: "FFD0CBD5" } },
  };

  const TITLE_FONT: Partial<ExcelJS.Font> = {
    name: "Georgia",
    size: 13,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  const SECTION_FONT: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  const HEADER_FONT: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 10.5,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  const DATA_FONT: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 10,
    color: { argb: "FF2A1F23" },
  };

  // =========================================================================
  // HOJA 1: DISTRIBUCIÓN DE MESAS (Resumen arriba + tablas individuales de 2 cols)
  // =========================================================================
  const sheetMesas = workbook.addWorksheet("Distribución de Mesas", {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: "FF722F37" } },
  });

  // Título Banner (Columnas A y B)
  sheetMesas.mergeCells("A1:B1");
  const mTitle = sheetMesas.getCell("A1");
  mTitle.value = "BODA DE ALMA & CHAVA — DISTRIBUCIÓN DE MESAS";
  mTitle.fill = BURGUNDY_FILL;
  mTitle.font = TITLE_FONT;
  mTitle.alignment = { vertical: "middle", horizontal: "center" };
  sheetMesas.getRow(1).height = 34;

  sheetMesas.mergeCells("A2:B2");
  const mSub = sheetMesas.getCell("A2");
  mSub.value = `Fecha: 12 de Septiembre, 2026 | Total Mesas: ${tables.length} | Capacidad: ${totalCapacity} sillas`;
  mSub.fill = PLATINUM_FILL;
  mSub.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF3D3B40" } };
  mSub.alignment = { vertical: "middle", horizontal: "center" };
  sheetMesas.getRow(2).height = 22;

  // Espacio
  sheetMesas.getRow(3).height = 8;

  // Encabezado del Resumen General
  sheetMesas.mergeCells("A4:B4");
  const sumHeader = sheetMesas.getCell("A4");
  sumHeader.value = "RESUMEN GENERAL DE INVITADOS Y CAPACIDAD";
  sumHeader.fill = WINE_MID_FILL;
  sumHeader.font = SECTION_FONT;
  sumHeader.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheetMesas.getRow(4).height = 24;

  const summaryItems: [string, number | string][] = [
    ["Total de Asistentes Confirmados (Catering)", confirmedCount],
    ["Total de Mesas Habilitadas", tables.length],
    ["Capacidad Total de Sillas", totalCapacity],
    ["Sillas Asignadas / Ocupadas", occupiedSeatsCount],
    ["Sillas Libres / Disponibles", freeSeatsCount],
  ];

  summaryItems.forEach(([label, val], idx) => {
    const rowNum = 5 + idx;
    const row = sheetMesas.getRow(rowNum);
    row.values = [label, val];
    row.height = 20;

    const isZebra = idx % 2 === 1;
    const fill = isZebra ? ZEBRA_LIGHT_FILL : WHITE_FILL;

    const cellA = row.getCell(1);
    cellA.font = DATA_FONT;
    cellA.fill = fill;
    cellA.border = THIN_BORDER;
    cellA.alignment = { vertical: "middle", horizontal: "left" };

    const cellB = row.getCell(2);
    cellB.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF722F37" } };
    cellB.fill = fill;
    cellB.alignment = { vertical: "middle", horizontal: "center" };
    cellB.border = THIN_BORDER;
  });

  let curRow = 5 + summaryItems.length + 1;

  // Tablas individuales por cada mesa de boda
  tables.forEach((table) => {
    const tableSeats = seatsByTableId.get(table.id) || [];
    const seatsMap = new Map<number, SeatingSeat>();
    for (const s of tableSeats) seatsMap.set(s.seat_index, s);

    const shapeLabel = table.shape === "round" ? "Redonda" : "Rectangular";
    const occupiedCount = tableSeats.length;

    // Fila separadora
    sheetMesas.getRow(curRow).height = 10;
    curRow++;

    // Título de la Mesa (Merge A:B)
    sheetMesas.mergeCells(`A${curRow}:B${curRow}`);
    const tHeaderCell = sheetMesas.getCell(`A${curRow}`);
    tHeaderCell.value = `${table.name.toUpperCase()} (${shapeLabel} — ${occupiedCount} de ${table.capacity} sillas ocupadas)`;
    tHeaderCell.fill = TABLE_HEADER_FILL;
    tHeaderCell.font = SECTION_FONT;
    tHeaderCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    sheetMesas.getRow(curRow).height = 24;
    curRow++;

    // Sub-encabezados de columnas
    const colRow = sheetMesas.getRow(curRow);
    colRow.values = ["Nº Silla", "Nombre del Invitado"];
    colRow.height = 22;

    const cellH1 = colRow.getCell(1);
    cellH1.fill = WINE_MID_FILL;
    cellH1.font = HEADER_FONT;
    cellH1.alignment = { vertical: "middle", horizontal: "center" };
    cellH1.border = THIN_BORDER;

    const cellH2 = colRow.getCell(2);
    cellH2.fill = WINE_MID_FILL;
    cellH2.font = HEADER_FONT;
    cellH2.alignment = { vertical: "middle", horizontal: "left" };
    cellH2.border = THIN_BORDER;
    curRow++;

    // Filas de sillas
    for (let chairIdx = 0; chairIdx < table.capacity; chairIdx++) {
      const seat = seatsMap.get(chairIdx);
      const isOccupied = !!seat;

      const chairRow = sheetMesas.getRow(curRow);
      chairRow.values = [
        `Silla ${chairIdx + 1}`,
        isOccupied ? seat.seat_label : "(Asiento libre)",
      ];
      chairRow.height = 20;

      const isZebra = chairIdx % 2 === 1;

      const cellA = chairRow.getCell(1);
      cellA.border = THIN_BORDER;
      cellA.alignment = { vertical: "middle", horizontal: "center" };

      const cellB = chairRow.getCell(2);
      cellB.border = THIN_BORDER;
      cellB.alignment = { vertical: "middle", horizontal: "left" };

      if (isOccupied) {
        cellA.font = DATA_FONT;
        cellA.fill = isZebra ? ZEBRA_LIGHT_FILL : WHITE_FILL;
        cellB.font = DATA_FONT;
        cellB.fill = isZebra ? ZEBRA_LIGHT_FILL : WHITE_FILL;
      } else {
        cellA.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF8A8F98" } };
        cellA.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F3F6" } };
        cellB.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF8A8F98" } };
        cellB.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F3F6" } };
      }

      curRow++;
    }
  });

  // Anchos de columna para Hoja 1
  sheetMesas.columns = [
    { width: 16 }, // Nº Silla / Concepto
    { width: 44 }, // Nombre del Invitado / Valor
  ];

  // =========================================================================
  // HOJA 2: LISTA GENERAL DE INVITADOS (Alfabética y concisa)
  // =========================================================================
  const sheetGuests = workbook.addWorksheet("Lista General de Invitados", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 4 }],
    properties: { tabColor: { argb: "FF8A8F98" } },
  });

  // Título Banner
  sheetGuests.mergeCells("A1:D1");
  const gTitle = sheetGuests.getCell("A1");
  gTitle.value = "BODA DE ALMA & CHAVA — LISTA GENERAL DE INVITADOS";
  gTitle.fill = BURGUNDY_FILL;
  gTitle.font = TITLE_FONT;
  gTitle.alignment = { vertical: "middle", horizontal: "center" };
  sheetGuests.getRow(1).height = 34;

  sheetGuests.mergeCells("A2:D2");
  const gSub = sheetGuests.getCell("A2");
  gSub.value = `Total Personas: ${totalRegistered} | Confirmados: ${confirmedCount} | Pendientes: ${pendingCount} | Declinaron: ${declinedCount}`;
  gSub.fill = PLATINUM_FILL;
  gSub.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF3D3B40" } };
  gSub.alignment = { vertical: "middle", horizontal: "center" };
  sheetGuests.getRow(2).height = 22;

  sheetGuests.getRow(3).height = 8;

  // Encabezados
  const gHeaders = [
    "#",
    "Nombre del Invitado",
    "Mesa Asignada",
    "Nº Silla",
  ];

  const gHeaderRow = sheetGuests.getRow(4);
  gHeaderRow.values = gHeaders;
  gHeaderRow.height = 24;

  gHeaders.forEach((_, colIdx) => {
    const cell = gHeaderRow.getCell(colIdx + 1);
    cell.fill = BURGUNDY_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = {
      vertical: "middle",
      horizontal: colIdx === 0 || colIdx === 3 ? "center" : "left",
    };
    cell.border = THIN_BORDER;
  });

  // Ordenar lista alfabéticamente
  const sortedAttendees = [...attendees].sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );

  sortedAttendees.forEach((att, idx) => {
    const rowNum = 5 + idx;
    const row = sheetGuests.getRow(rowNum);
    row.values = [
      idx + 1,
      att.name,
      att.tableName,
      att.seatNumber,
    ];
    row.height = 20;

    const isZebra = idx % 2 === 1;
    const fill = isZebra ? ZEBRA_LIGHT_FILL : WHITE_FILL;

    for (let c = 1; c <= 4; c++) {
      const cell = row.getCell(c);
      cell.font = DATA_FONT;
      cell.fill = fill;
      cell.border = THIN_BORDER;
      cell.alignment = {
        vertical: "middle",
        horizontal: c === 1 || c === 4 ? "center" : "left",
      };
    }
  });

  // Anchos de columna para Hoja 2
  sheetGuests.columns = [
    { width: 6 },  // #
    { width: 38 }, // Nombre
    { width: 24 }, // Mesa
    { width: 14 }, // Silla
  ];

  // 5. Generar buffer binario y retornar respuesta HTTP
  const buffer = await workbook.xlsx.writeBuffer();

  const now = new Date();
  const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const filename = `Boda_Alma_y_Chava_Control_Mesas_${dateStamp}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
