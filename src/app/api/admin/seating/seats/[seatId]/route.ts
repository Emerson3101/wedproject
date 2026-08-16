import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isSupabaseServerConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";
import { sanitizeInput } from "@/lib/utils";

/* ============================================
   API: PATCH /api/admin/seating/seats/[seatId]
        DELETE /api/admin/seating/seats/[seatId]
   PATCH acepta (combinables):
     { seatLabel }                 — renombra al ocupante
     { tableId, seatIndex }        — mueve la silla a otra posición
                                     (misma mesa = reorden; otra mesa = reasignar)
     { seatLabel, tableId, seatIndex } — renombrar + mover en un solo
                                     update (útil para correcciones rápidas).
   DELETE elimina una única silla. Para vaciar una entera party use
   /api/admin/seating/party/[partyKey] (DELETE).
   Nota: no existe un UNIQUE constraint en (table_id, seat_index); el
   server valida colisión manualmente (409) — ver COMPENDIUM §10 #23.
   ============================================ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ seatId: string }> }
) {
  const auth = await requireAdmin({ wrapOk: true });
  if (!auth.ok) return auth.response;
  const { seatId } = await params;

  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server not configured. Check .env.local" },
      { status: 503 }
    );
  }

  let body: { seatLabel?: string; tableId?: string; seatIndex?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo de la petición inválido." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient()!;

  // Leer la silla actual (necesario para validar el move y para construir el update)
  const { data: current, error: curErr } = await supabase
    .from("seating_seats")
    .select("id, table_id, seat_index")
    .eq("id", seatId)
    .maybeSingle();

  if (curErr) {
    console.error("Admin seating — error fetching current seat:", curErr);
    return NextResponse.json({ ok: false, error: "No se pudo cargar el asiento." }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json({ ok: false, error: "Asiento no encontrado." }, { status: 404 });
  }

  // ---- Determinar campos del update ----
  const update: { seat_label?: string; table_id?: string; seat_index?: number } = {};

  if (typeof body.seatLabel === "string") {
    const cleanLabel = sanitizeInput(body.seatLabel.trim());
    if (!cleanLabel) {
      return NextResponse.json(
        { ok: false, error: "El nombre del asiento es requerido." },
        { status: 400 }
      );
    }
    if (cleanLabel.length > 255) {
      return NextResponse.json(
        { ok: false, error: "El nombre no puede exceder 255 caracteres." },
        { status: 400 }
      );
    }
    update.seat_label = cleanLabel;
  }

  const wantsMove = typeof body.tableId === "string" || typeof body.seatIndex === "number";
  if (wantsMove) {
    // Ambos campos son obligatorios para un move (no se puede mover sólo el index
    // sin saber la mesa destino, ni sólo la mesa sin posición).
    if (typeof body.tableId !== "string" || typeof body.seatIndex !== "number") {
      return NextResponse.json(
        { ok: false, error: "Para mover se requieren `tableId` y `seatIndex`." },
        { status: 400 }
      );
    }
    const targetTableId = body.tableId;
    const targetIndex = Math.trunc(body.seatIndex);

    // No es necesario re-validar si (tableId, seatIndex) coincide con el actual.
    const sameSpot = targetTableId === current.table_id && targetIndex === current.seat_index;

    if (!sameSpot) {
      // Validar seatIndex entero no negativo (el tope lo da la capacidad de la mesa)
      if (!Number.isInteger(targetIndex) || targetIndex < 0) {
        return NextResponse.json(
          { ok: false, error: "`seatIndex` debe ser un entero no negativo." },
          { status: 400 }
        );
      }

      // Cargar mesa destino (capacidad)
      const { data: targetTable, error: tErr } = await supabase
        .from("seating_tables")
        .select("id, capacity")
        .eq("id", targetTableId)
        .maybeSingle();

      if (tErr || !targetTable) {
        return NextResponse.json(
          { ok: false, error: "Mesa destino no encontrada." },
          { status: 404 }
        );
      }
      if (targetIndex >= (targetTable.capacity as number)) {
        return NextResponse.json(
          { ok: false, error: `seatIndex ${targetIndex} fuera de rango (capacidad ${targetTable.capacity}).` },
          { status: 400 }
        );
      }

      // Si el move es a otra mesa, validar capacidad (cross-table: 1 huevo más)
      const isCrossTable = targetTableId !== current.table_id;
      if (isCrossTable) {
        const { count: occupiedCount, error: ocErr } = await supabase
          .from("seating_seats")
          .select("id", { count: "exact", head: true })
          .eq("table_id", targetTableId);
        if (ocErr) {
          console.error("Admin seating — error counting target table seats:", ocErr);
          return NextResponse.json({ ok: false, error: "No se pudo verificar la ocupación." }, { status: 500 });
        }
        if ((occupiedCount ?? 0) + 1 > (targetTable.capacity as number)) {
          return NextResponse.json(
            { ok: false, error: "La mesa destino no tiene espacio." },
            { status: 409 }
          );
        }
      }

      // Validar que (targetTableId, targetIndex) esté libre
      const { data: collision, error: colErr } = await supabase
        .from("seating_seats")
        .select("id")
        .eq("table_id", targetTableId)
        .eq("seat_index", targetIndex)
        .maybeSingle();
      if (colErr) {
        console.error("Admin seating — error checking seat collision:", colErr);
        return NextResponse.json({ ok: false, error: "No se pudo verificar la posición." }, { status: 500 });
      }
      if (collision && collision.id !== seatId) {
        return NextResponse.json(
          { ok: false, error: "Esa silla ya está ocupada." },
          { status: 409 }
        );
      }
    }
    update.table_id = targetTableId;
    update.seat_index = targetIndex;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Indique `seatLabel` y/o `tableId`+`seatIndex`." },
      { status: 400 }
    );
  }

  const { data: seat, error: updateErr } = await supabase
    .from("seating_seats")
    .update(update)
    .eq("id", seatId)
    .select()
    .maybeSingle();

  if (updateErr) {
    console.error("Admin seating — error updating seat:", updateErr);
    // 23505 = unique violation (sólo aplica a idx_seating_seats_guest_unique, pero
    // como no tocamos guest_id en un move, no debería dispararse).
    if (updateErr.code === "23505") {
      return NextResponse.json(
        { ok: false, error: "Este invitado ya está sentado en otra mesa." },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, error: "No se pudo actualizar el asiento." }, { status: 500 });
  }
  if (!seat) {
    return NextResponse.json({ ok: false, error: "Asiento no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, seat });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ seatId: string }> }
) {
  const auth = await requireAdmin({ wrapOk: true });
  if (!auth.ok) return auth.response;
  const { seatId } = await params;

  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server not configured. Check .env.local" },
      { status: 503 }
    );
  }

  const supabase = createSupabaseServerClient()!;

  const { error, count } = await supabase
    .from("seating_seats")
    .delete()
    .eq("id", seatId);

  if (error) {
    console.error("Admin seating — error deleting seat:", error);
    return NextResponse.json({ ok: false, error: "No se pudo eliminar el asiento." }, { status: 500 });
  }
  if (count === 0) {
    return NextResponse.json({ ok: false, error: "Asiento no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
