import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isSupabaseServerConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";
import { sanitizeInput } from "@/lib/utils";

/* ============================================
   API: POST /api/admin/guests/[guestId]/companions
   Añade un acompañante a un invitado existente.

   Ruta admin-only: el proxy.ts ya requiere `admin_auth` para todo
   /api/admin/* (proxy.ts:62-71). Esta ruta re-verifica la cookie
   (defensa en profundidad, patrón admin/guests/route.ts:13).

   NO aplica el limite MAX_COMPANIONS (que es solo para el form de
   invitado); el admin puede añadir cuantos acompañantes quiera
   (caso de uso: "+1 en algunos casos" según el cliente).

   Tras la mutación, resincroniza `guests.num_companions` con el
   conteo real de filas en `companions` para ese invitado.
   ============================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  const auth = await requireAdmin({ wrapOk: true });
  if (!auth.ok) return auth.response;

  const { guestId } = await params;

  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server not configured. Check .env.local" },
      { status: 503 }
    );
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo de la petición inválido." },
      { status: 400 }
    );
  }

  const cleanName = sanitizeInput(body.name?.trim() || "");

  if (!cleanName) {
    return NextResponse.json(
      { ok: false, error: "El nombre del acompañante es requerido." },
      { status: 400 }
    );
  }

  if (cleanName.length > 100) {
    return NextResponse.json(
      { ok: false, error: "El nombre excede el límite de caracteres." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient()!;

  // Verificar que el invitado existe
  const { data: guest, error: guestErr } = await supabase
    .from("guests")
    .select("id")
    .eq("id", guestId)
    .single();

  if (guestErr || !guest) {
    return NextResponse.json(
      { ok: false, error: "Invitado no encontrado." },
      { status: 404 }
    );
  }

  // Insertar acompañante (dietary_restrictions: null — el campo se eliminó del frontend)
  const { data: companion, error: insertErr } = await supabase
    .from("companions")
    .insert({
      guest_id: guestId,
      name: cleanName,
      dietary_restrictions: null,
    })
    .select()
    .single();

  if (insertErr || !companion) {
    console.error("Admin API — error inserting companion:", insertErr);
    return NextResponse.json(
      { ok: false, error: "No se pudo agregar el acompañante." },
      { status: 500 }
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

  return NextResponse.json({ ok: true, companion }, { status: 201 });
}
