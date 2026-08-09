import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isSupabaseServerConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";

/* ============================================
   API: DELETE /api/admin/guests/[guestId]/companions/[companionId]
   Elimina un acompañante de un invitado.

   Ruta admin-only: el proxy.ts ya requiere `admin_auth` para todo
   /api/admin/* (proxy.ts:62-71). Esta ruta re-verifica la cookie
   (defensa en profundidad, patrón admin/guests/route.ts:13).

   Tras la mutación, resincroniza `guests.num_companions` con el
   conteo real de filas en `companions` para ese invitado.
   ============================================ */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ guestId: string; companionId: string }> }
) {
  const auth = await requireAdmin({ wrapOk: true });
  if (!auth.ok) return auth.response;

  const { guestId, companionId } = await params;

  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server not configured. Check .env.local" },
      { status: 503 }
    );
  }

  const supabase = createSupabaseServerClient()!;

  // Eliminar el acompañante verificando que pertenece al guestId correcto
  // (defensa: evitar borrar un companion ajeno conociendo dos IDs)
  const { data: deleted, error: deleteErr } = await supabase
    .from("companions")
    .delete()
    .eq("id", companionId)
    .eq("guest_id", guestId)
    .select("id")
    .single();

  if (deleteErr || !deleted) {
    return NextResponse.json(
      { ok: false, error: "Acompañante no encontrado." },
      { status: 404 }
    );
  }

  // Resincronizar `guests.num_companions` con el conteo real de filas
  const { count, error: countErr } = await supabase
    .from("companions")
    .select("id", { count: "exact", head: true })
    .eq("guest_id", guestId);

  if (countErr) {
    console.error("Admin API — error counting companions:", countErr);
  } else if (typeof count === "number") {
    await supabase
      .from("guests")
      .update({ num_companions: count })
      .eq("id", guestId);
  }

  return NextResponse.json({ ok: true });
}
