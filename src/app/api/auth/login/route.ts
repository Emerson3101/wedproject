import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/* ============================================
   API: POST /api/auth/login
   Valida el código de invitación general de invitados.
   ============================================ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body as { password?: string };

    const invitationCode = process.env.INVITATION_CODE;

    if (!invitationCode) {
      console.error("Config Error: INVITATION_CODE env variable is missing.");
      return NextResponse.json(
        { error: "Servicio no disponible por error de configuración." },
        { status: 503 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "La contraseña es requerida." },
        { status: 400 }
      );
    }

    if (password !== invitationCode) {
      return NextResponse.json(
        { error: "Contraseña de acceso incorrecta." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("site_auth", password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 días de persistencia
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
