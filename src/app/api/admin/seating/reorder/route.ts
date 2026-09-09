import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isSupabaseServerConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";

/* ============================================
   API: POST /api/admin/seating/reorder
   Reordena globalmente las mesas del plano.
   Body: { orderedIds: string[] } — la lista
   COMPLETA de ids en el orden deseado.
   Reasigna display_order = 0..N-1 (sin unique
   en la columna, no hay colisiones).
   ============================================ */

export async function POST(request: NextRequest) {
  const auth = await requireAdmin({ wrapOk: true });
  if (!auth.ok) return auth.response;
  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server not configured. Check .env.local" },
      { status: 503 }
    );
  }

  let body: { orderedIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo de la petición inválido." },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(body.orderedIds) ||
    body.orderedIds.length === 0 ||
    !body.orderedIds.every((id) => typeof id === "string")
  ) {
    return NextResponse.json(
      { ok: false, error: "orderedIds debe ser un arreglo de ids de mesa." },
      { status: 400 }
    );
  }

  const orderedIds = body.orderedIds as string[];

  const supabase = createSupabaseServerClient()!;

  // Plano actual: validamos que orderedIds sea una permutación exacta
  // de las mesas existentes (si cambió algo en paralelo, 409).
  const { data: currentTables, error: fetchErr } = await supabase
    .from("seating_tables")
    .select("id, name, display_order")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (fetchErr) {
    console.error("Admin seating reorder — error fetching tables:", fetchErr);
    return NextResponse.json({ ok: false, error: "No se pudieron cargar las mesas." }, { status: 500 });
  }

  const currentIds = (currentTables || []).map((t: { id: string }) => t.id);
  const currentSet = new Set(currentIds);
  const orderedSet = new Set(orderedIds);

  if (orderedIds.length !== currentIds.length || orderedIds.some((id) => !currentSet.has(id)) || currentIds.some((id) => !orderedSet.has(id))) {
    return NextResponse.json(
      {
        ok: false,
        error: "El orden no coincide con las mesas actuales. Refresca el plano e intenta de nuevo.",
      },
      { status: 409 }
    );
  }

  // Sin cambios: nada que escribir.
  const currentOrder = currentIds.join("|");
  const newOrder = orderedIds.join("|");
  if (currentOrder === newOrder) {
    return NextResponse.json({ ok: true, tables: currentTables });
  }

  // Reasignar display_order = índice (0..N-1) en paralelo.
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("seating_tables")
      .update({ display_order: index })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("Admin seating reorder — error updating display_order:", failed.error);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar el nuevo orden." },
      { status: 500 }
    );
  }

  // Devolver las mesas ya ordenadas (mismo shape que GET /seating).
  const byId = new Map(
    (currentTables || []).map((t: { id: string }) => [t.id, t])
  );
  const tables = orderedIds.map((id) => byId.get(id)!);

  return NextResponse.json({ ok: true, tables });
}
