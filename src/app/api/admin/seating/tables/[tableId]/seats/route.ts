import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, type Companion, type Guest } from "@/lib/supabase";
import { isSupabaseServerConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";
import { sanitizeInput } from "@/lib/utils";
import { nanoid } from "nanoid";

/* ============================================
   API: POST /api/admin/seating/tables/[tableId]/seats
   Asigna a una mesa: party de RSVP confirmado (lead +
   companions snapshot) o un party adhoc.
   Body variants:
    a) { guestId, includeCompanions }
    b) { adhocName, adhocCompanions?: string[] }
   Valida capacidad (409 si excede) y que el lead no esté ya
   sentado (409 si choca el índice único idx_seating_seats_guest_unique).
   ============================================ */

interface AddSeatBody {
  guestId?: string;
  includeCompanions?: boolean;
  adhocName?: string;
  adhocCompanions?: string[];
  /**
   * Posiciones explícitas (0-based) para cada persona (lead + companions
   * en orden). El array debe medir exactamente lo que se va a sentar.
   * Si se omite, se asignan las posiciones más bajas libres (lowest-free).
   */
  seatIndexes?: number[];
}

interface SeatRow {
  id: string;
  table_id: string;
  guest_id: string | null;
  party_key: string;
  seat_label: string;
  is_lead: boolean;
  seat_index: number;
  source: "rsvp" | "companion" | "adhoc";
  created_at: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const auth = await requireAdmin({ wrapOk: true });
  if (!auth.ok) return auth.response;
  const { tableId } = await params;

  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server not configured. Check .env.local" },
      { status: 503 }
    );
  }

  let body: AddSeatBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo de la petición inválido." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient()!;

  // Verificar que la mesa existe y leer capacidad/ocupación actuales
  const { data: table, error: tableErr } = await supabase
    .from("seating_tables")
    .select("id, capacity")
    .eq("id", tableId)
    .maybeSingle();

  if (tableErr || !table) {
    return NextResponse.json(
      { ok: false, error: "Mesa no encontrada." },
      { status: 404 }
    );
  }

  // NOTA: la ocupación se deriva de `occupiedSet.size` (ver abajo) — ya no
  // hace falta un SELECT count(*) aparte; ahorramos un round-trip.
  const capacity = table.capacity as number;

  // Cargar todos los seat_index ocupados para: (1) auto-resolver el
  // siguiente index libre y (2) detectar colisiones cuando vienen
  // seatIndexes explícitos. Reemplaza el viejo `max+1` que pinchaba
  // cuando se quitaba un asiento del medio (index fantasma, silla >=
  // capacity invisible en el ring). Ver COMPENDIUM §10 #23.
  const { data: existingSeats, error: exErr } = await supabase
    .from("seating_seats")
    .select("seat_index")
    .eq("table_id", tableId);

  if (exErr) {
    console.error("Admin seating — error fetching existing seat_index:", exErr);
    return NextResponse.json({ ok: false, error: "No se pudo calcular la posición." }, { status: 500 });
  }

  const occupiedSet = new Set<number>(
    (existingSeats || []).map((r) => r.seat_index as number)
  );
  const occupied = occupiedSet.size;

  // Posiciones libres 0..capacity-1, orden asc. Usadas cuando el caller
  // no pasa `seatIndexes` explícitos (lowest-free).
  const freeSlots: number[] = [];
  for (let i = 0; i < capacity; i++) {
    if (!occupiedSet.has(i)) freeSlots.push(i);
  }

  // Devuelve los índices para `added` sillas. Explota si hay colisión
  // o si los seatIndexes explícitos son inválidos.
  const resolveIndexes = (
    added: number
  ): { indexes: number[] } | { error: NextResponse } => {
    const explicit = body.seatIndexes;
    if (explicit) {
      if (!Array.isArray(explicit) || explicit.length !== added) {
        return {
          error: NextResponse.json(
            { ok: false, error: `seatIndexes debe tener ${added} elementos.` },
            { status: 400 }
          ),
        };
      }
      const seen = new Set<number>();
      for (const idx of explicit) {
        if (!Number.isInteger(idx) || idx < 0 || idx >= capacity) {
          return {
            error: NextResponse.json(
              { ok: false, error: `seatIndex ${idx} fuera de rango (0..${capacity - 1}).` },
              { status: 400 }
            ),
          };
        }
        if (seen.has(idx)) {
          return {
            error: NextResponse.json(
              { ok: false, error: `seatIndex ${idx} duplicado.` },
              { status: 400 }
            ),
          };
        }
        seen.add(idx);
        if (occupiedSet.has(idx)) {
          return {
            error: NextResponse.json(
              { ok: false, error: `seatIndex ${idx} ya está ocupado.` },
              { status: 409 }
            ),
          };
        }
      }
      return { indexes: explicit };
    }
    if (freeSlots.length < added) {
      return {
        error: NextResponse.json(
          {
            ok: false,
            error: `Sin espacio: ocupados ${occupied}/${capacity}, faltan ${added}.`,
          },
          { status: 409 }
        ),
      };
    }
    return { indexes: freeSlots.slice(0, added) };
  };

  // ---- Dispatch por forma del body ----
  const isGuestBranch = !!body.guestId;
  const isAdhocBranch = !!body.adhocName;

  if (!isGuestBranch && !isAdhocBranch) {
    return NextResponse.json(
      {
        ok: false,
        error: "Debe proveer `guestId` o `adhocName`.",
      },
      { status: 400 }
    );
  }
  if (isGuestBranch && isAdhocBranch) {
    return NextResponse.json(
      { ok: false, error: "Indique sólo uno de `guestId` o `adhocName`." },
      { status: 400 }
    );
  }

  const rowsToInsert: Omit<SeatRow, "id" | "created_at">[] = [];

  if (isGuestBranch) {
    const includeCompanions = body.includeCompanions !== false; // default true
    const guestId = body.guestId as string;

    // Verificar lead confirmado
    const { data: guest, error: gErr } = await supabase
      .from("guests")
      .select("id, name, status")
      .eq("id", guestId)
      .maybeSingle();

    if (gErr || !guest) {
      return NextResponse.json(
        { ok: false, error: "Invitado no encontrado." },
        { status: 404 }
      );
    }
    if ((guest as Guest).status !== "confirmed") {
      return NextResponse.json(
        { ok: false, error: "El invitado no está confirmado." },
        { status: 400 }
      );
    }

    // Verificar que el lead no esté ya sentado
    const { data: existingLead, error: elErr } = await supabase
      .from("seating_seats")
      .select("id")
      .eq("guest_id", guestId)
      .maybeSingle();

    if (elErr) {
      console.error("Admin seating — error checking existing lead seat:", elErr);
      return NextResponse.json({ ok: false, error: "No se pudo verificar seats previos." }, { status: 500 });
    }
    if (existingLead) {
      return NextResponse.json(
        { ok: false, error: "Este invitado ya está sentado en otra mesa." },
        { status: 409 }
      );
    }

    // Companions vivo
    const { data: companions, error: cErr } = await supabase
      .from("companions")
      .select("id, name")
      .eq("guest_id", guestId)
      .order("created_at", { ascending: true });

    if (cErr) {
      console.error("Admin seating — error fetching companions:", cErr);
      return NextResponse.json({ ok: false, error: "No se pudo cargar los acompañantes." }, { status: 500 });
    }
    const liveCompanions = (companions || []) as Pick<Companion, "id" | "name">[];

    // Resolución de posiciones (lowest-free o seatIndexes explícitos)
    const added = 1 + (includeCompanions ? liveCompanions.length : 0);
    const idxRes = resolveIndexes(added);
    if ("error" in idxRes) return idxRes.error;
    const indexes = idxRes.indexes;
    let ii = 0;

    const cleanLeadName = sanitizeInput((guest as Guest).name.trim());
    rowsToInsert.push({
      table_id: tableId,
      guest_id: guestId,
      party_key: guestId,
      seat_label: cleanLeadName,
      is_lead: true,
      seat_index: indexes[ii++],
      source: "rsvp",
    });

    if (includeCompanions) {
      for (const c of liveCompanions) {
        rowsToInsert.push({
          table_id: tableId,
          guest_id: null,
          party_key: guestId,
          seat_label: sanitizeInput(c.name.trim()),
          is_lead: false,
          seat_index: indexes[ii++],
          source: "companion",
        });
      }
    }
  } else {
    // Branch adhoc
    const cleanName = sanitizeInput(body.adhocName?.trim() || "");
    if (!cleanName) {
      return NextResponse.json(
        { ok: false, error: "El nombre del invitado es requerido." },
        { status: 400 }
      );
    }
    if (cleanName.length > 100) {
      return NextResponse.json(
        { ok: false, error: "El nombre no puede exceder 100 caracteres." },
        { status: 400 }
      );
    }

    const companionsInput = Array.isArray(body.adhocCompanions) ? body.adhocCompanions : [];
    const cleanCompanions: string[] = [];
    for (const raw of companionsInput) {
      const c = sanitizeInput(raw.trim());
      if (!c) continue;
      if (c.length > 100) {
        return NextResponse.json(
          { ok: false, error: "Nombre de acompañante demasiado largo (máx 100)." },
          { status: 400 }
        );
      }
      cleanCompanions.push(c);
    }

    const added = 1 + cleanCompanions.length;
    const idxRes = resolveIndexes(added);
    if ("error" in idxRes) return idxRes.error;
    const indexes = idxRes.indexes;
    let ii = 0;

    const partyKey = nanoid(10);
    rowsToInsert.push({
      table_id: tableId,
      guest_id: null,
      party_key: partyKey,
      seat_label: cleanName,
      is_lead: true,
      seat_index: indexes[ii++],
      source: "adhoc",
    });
    for (const name of cleanCompanions) {
      rowsToInsert.push({
        table_id: tableId,
        guest_id: null,
        party_key: partyKey,
        seat_label: name,
        is_lead: false,
        seat_index: indexes[ii++],
        source: "adhoc",
      });
    }
  }

  const { data: insertedRows, error: insertErr } = await supabase
    .from("seating_seats")
    .insert(rowsToInsert)
    .select();

  if (insertErr) {
    console.error("Admin seating — error inserting seats:", insertErr);
    // 23505 = unique violation (idx_seating_seats_guest_unique)
    if (insertErr.code === "23505") {
      return NextResponse.json(
        { ok: false, error: "Este invitado ya está sentado en otra mesa." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "No se pudo asignar los asientos." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, seats: insertedRows }, { status: 201 });
}
