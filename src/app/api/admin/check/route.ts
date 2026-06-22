import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/* ============================================
   API: GET /api/admin/check
   Verifica si el usuario tiene una sesión de admin válida.
   ============================================ */
export async function GET() {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ ok: false, error: "Missing config" }, { status: 503 });
    }

    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("admin_auth")?.value;

    if (adminCookie === adminPassword) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false }, { status: 401 });
  } catch (error) {
    console.error("Admin Check API error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
