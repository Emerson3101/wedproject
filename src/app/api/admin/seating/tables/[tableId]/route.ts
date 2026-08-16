import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isSupabaseServerConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";
import { sanitizeInput } from "@/lib/utils";

/* ============================================
   API: PATCH /api/admin/seating/tables/[tableId]
        DELETE /api/admin/seating/tables/[tableId]
   Edita (nombre/capacidad/forma/orden) o elimina la mesa
   (cascada: sus asientos también se borran).
   Capacidad: rechaza 409 si existen más asientos que el
   nuevo límite.
   ============================================ */

const SHAPE_VALUES = new Set(["round", "rect"]);

export async function PATCH(
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

  let body: {
    name?: string;
    capacity?: number;
    shape?: string;
    displayOrder?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo de la petición inválido." },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const cleanName = sanitizeInput(body.name.trim() || "");
    if (!cleanName) {
      return NextResponse.json(
        { ok: false, error: "El nombre de la mesa es requerido." },
        { status: 400 }
      );
    }
    if (cleanName.length > 100) {
      return NextResponse.json(
        { ok: false, error: "El nombre no puede exceder 100 caracteres." },
        { status: 400 }
      );
    }
    updates.name = cleanName;
  }

  if (body.capacity !== undefined) {
    const capacity = Number(body.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
      return NextResponse.json(
        { ok: false, error: "La capacidad debe ser un entero entre 1 y 50." },
        { status: 400 }
      );
    }
    updates.capacity = capacity;
  }

  if (body.shape !== undefined) {
    if (!SHAPE_VALUES.has(body.shape)) {
      return NextResponse.json(
        { ok: false, error: "La forma debe ser 'round' o 'rect'." },
        { status: 400 }
      );
    }
    updates.shape = body.shape;
  }

  if (body.displayOrder !== undefined) {
    const order = Number(body.displayOrder);
    if (!Number.isInteger(order) || order < 0) {
      return NextResponse.json(
        { ok: false, error: "El orden debe ser un entero no negativo." },
        { status: 400 }
      );
    }
    updates.display_order = order;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { ok: false, error: "No hay campos para actualizar." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient()!;

  // Validación de capacidad: si se reduce, no debe quedar menor que los asientos existentes.
  if (typeof updates.capacity === "number") {
    const { count, error: countErr } = await supabase
      .from("seating_seats")
      .select("id", { count: "exact", head: true })
      .eq("table_id", tableId);

    if (countErr) {
      console.error("Admin seating — error counting seats:", countErr);
      return NextResponse.json({ ok: false, error: "No se pudo verificar la ocupación." }, { status: 500 });
    }
    if (typeof count === "number" && count > (updates.capacity as number)) {
      return NextResponse.json(
        {
          ok: false,
          error: `No se puede reducir la capacidad a ${updates.capacity}: ya hay ${count} asientos ocupados.`,
        },
        { status: 409 }
      );
    }
  }

  const { data: table, error: updateErr } = await supabase
    .from("seating_tables")
    .update(updates)
    .eq("id", tableId)
    .select()
    .maybeSingle();

  if (updateErr) {
    console.error("Admin seating — error updating table:", updateErr);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar la mesa." }, { status: 500 });
  }
  if (!table) {
    return NextResponse.json({ ok: false, error: "Mesa no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, table });
}

export async function DELETE(
  _request: NextRequest,
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

  const supabase = createSupabaseServerClient()!;

  const { error, count } = await supabase
    .from("seating_tables")
    .delete()
    .eq("id", tableId);

  if (error) {
    console.error("Admin seating — error deleting table:", error);
    return NextResponse.json({ ok: false, error: "No se pudo eliminar la mesa." }, { status: 500 });
  }
  if (count === 0) {
    return NextResponse.json({ ok: false, error: "Mesa no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
