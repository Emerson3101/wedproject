import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isSupabaseServerConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";

/* ============================================
   API: DELETE /api/admin/seating/party/[partyKey]
   Elimina toda una party de golpe (lead + companions snapshot
   o un party adhoc). Útil para "quitar toda la mesa del grupo"
   sin tocar cada silla una por una. El party_key aísla cada
   party (guest_id para RSVP, nanoid para adhoc).
   ============================================ */

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ partyKey: string }> }
) {
  const auth = await requireAdmin({ wrapOk: true });
  if (!auth.ok) return auth.response;
  const { partyKey } = await params;

  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server not configured. Check .env.local" },
      { status: 503 }
    );
  }

  if (!partyKey) {
    return NextResponse.json(
      { ok: false, error: "Falta party_key." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient()!;

  const { error, count } = await supabase
    .from("seating_seats")
    .delete()
    .eq("party_key", partyKey);

  if (error) {
    console.error("Admin seating — error deleting party:", error);
    return NextResponse.json({ ok: false, error: "No se pudo eliminar la party." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}
