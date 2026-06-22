import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/* ============================================
   API: POST /api/admin/login
   Valida la contraseña de administrador y establece cookie de sesión.
   ============================================ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body as { password?: string };

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("Config Error: ADMIN_PASSWORD env variable is missing.");
      return NextResponse.json(
        { error: "El panel de administración no está disponible por falta de configuración." },
        { status: 503 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "La contraseña es requerida." },
        { status: 400 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "Contraseña incorrecta." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_auth", password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 horas de persistencia
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin Login API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
