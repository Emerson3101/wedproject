import { NextRequest, NextResponse } from "next/server";

/* ============================================
   PROXY - Next.js 16 (replaces middleware)
   Autenticación y protección de rutas
   ============================================ */
export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // 1. Verificar variables de entorno requeridas (FAIL CLOSED)
  const invitationCode = process.env.INVITATION_CODE;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!invitationCode || !adminPassword) {
    console.error("CRITICAL: INVITATION_CODE or ADMIN_PASSWORD is not set.");
    return new NextResponse(
      "Error de configuración: Faltan credenciales en .env",
      { status: 503 }
    );
  }

  // 2. Bloqueo de rutas de prueba en producción
  const isDev = process.env.NODE_ENV === "development";
  if (pathname === "/test" || pathname.startsWith("/api/test")) {
    if (!isDev) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  // 3. Excluir recursos estáticos y rutas públicas
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // 4. Leer cookies de autenticación
  const siteAuth = request.cookies.get("site_auth")?.value;
  const adminAuth = request.cookies.get("admin_auth")?.value;

  const isGuestAuthenticated = siteAuth === invitationCode;
  const isAdminAuthenticated = adminAuth === adminPassword;

  // 5. Redirigir al login si no está autenticado
  if (!isGuestAuthenticated && !isAdminAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "No autorizado. Inicia sesión primero." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Restricciones administrativas
  const isAdminAuthRoute = pathname === "/api/admin/login" || pathname === "/api/admin/check";
  const isAdminRoute = (pathname.startsWith("/api/admin/") && !isAdminAuthRoute) ||
                       (pathname === "/api/songs" && method === "DELETE");

  if (isAdminRoute && !isAdminAuthenticated) {
    return NextResponse.json(
      { error: "No autorizado. Requiere sesión de administrador." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
