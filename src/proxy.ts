import { NextRequest, NextResponse } from "next/server";

/* ============================================
   PROXY GENERAL DE SEGURIDAD (Next.js 16)
   ============================================ */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // 1. Verificar variables de entorno requeridas en el servidor (FAIL CLOSED)
  const invitationCode = process.env.INVITATION_CODE;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Si no están configuradas, bloqueamos todo para evitar accesos indebidos sin contraseña
  if (!invitationCode || !adminPassword) {
    console.error("CRITICAL: INVITATION_CODE or ADMIN_PASSWORD is not set in environment.");
    return new NextResponse(
      "Error de configuración del servidor: Faltan credenciales de seguridad en el archivo .env.",
      { status: 503 }
    );
  }

  // 2. Bloqueo de rutas de prueba en producción (NODE_ENV !== 'development')
  const isDev = process.env.NODE_ENV === "development";
  if (pathname === "/test" || pathname.startsWith("/api/test")) {
    if (!isDev) {
      // Retornar 404 para ocultar la existencia del suite de pruebas en prod
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  // 3. Excluir recursos estáticos y rutas de inicio de sesión de invitados
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth") || // POST /api/auth/login
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

  // 5. Restricción general para invitados
  // Cualquiera que acceda al sitio debe estar autenticado como invitado (o como admin)
  if (!isGuestAuthenticated && !isAdminAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "No autorizado. Inicia sesión primero." },
        { status: 401 }
      );
    }
    // Redireccionar a la pantalla de login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Restricciones administrativas
  // Rutas administrativas (/api/admin/* y DELETE /api/songs) requieren autenticación de administrador
  // Excluir /api/admin/login y /api/admin/check ya que son necesarios para establecer la sesión
  const isAdminAuthRoute = pathname === "/api/admin/login" || pathname === "/api/admin/check";
  const isAdminRoute = (pathname.startsWith("/api/admin/") && !isAdminAuthRoute) || (pathname === "/api/songs" && method === "DELETE");
  if (isAdminRoute && !isAdminAuthenticated) {
    return NextResponse.json(
      { error: "No autorizado. Requiere sesión de administrador." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

// Configurar los paths en los que se ejecuta el proxy
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication APIs)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
