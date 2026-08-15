import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/* ============================================
   API: POST /api/admin/logout
   --------------------------------------------
   Borra la cookie `admin_auth` para cerrar la
   sesión del panel. Whitelisted en proxy.ts como
   ruta de auth (no requiere admin_auth vigente,
   así un logout desde una sesión caducada no 401).
   Contrato de respuesta: { ok: true } (igual que
   /api/admin/login — ver COMPENDIUM §10 #17).
   ============================================ */
export async function POST() {
  const cookieStore = await cookies();
  // Sobrescribe con maxAge 0 → el navegador elimina la cookie inmediatamente.
  cookieStore.set("admin_auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
