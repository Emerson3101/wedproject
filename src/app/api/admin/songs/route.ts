import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

/* ============================================
   API: PATCH /api/admin/songs
   Actualizar estado de aprobacion de una cancion.
   Protegido con password de admin.
   ============================================ */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(
      { configError: "Servicio no disponible por error de configuración." },
      request
    );
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { songId, isApproved } = body as {
      songId: string;
      isApproved: boolean;
    };

    if (!songId) {
      return NextResponse.json(
        { error: "El ID de la cancion es requerido." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Backend no disponible." },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from("songs")
      .update({ is_approved: isApproved })
      .eq("id", songId)
      .select()
      .single();

    if (error) {
      console.error("Admin songs PATCH error:", error);
      return NextResponse.json(
        { error: "Error al actualizar la cancion." },
        { status: 500 }
      );
    }

    return NextResponse.json({ song: data });
  } catch (error) {
    console.error("Admin songs API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
