import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";

/* ============================================
   API: PATCH /api/admin/songs
   Actualizar estado de aprobacion de una cancion.
   Protegido con password de admin.
   ============================================ */
export async function PATCH(request: NextRequest) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("Config Error: ADMIN_PASSWORD is not set in environment.");
      return NextResponse.json(
        { error: "Servicio no disponible por error de configuración." },
        { status: 503 }
      );
    }

    // Verificar autenticación mediante cookie o Bearer token
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("admin_auth")?.value;
    const authHeader = request.headers.get("authorization");

    const isCookieValid = adminCookie === adminPassword;
    const isTokenValid = authHeader === `Bearer ${adminPassword}`;

    if (!isCookieValid && !isTokenValid) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

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
