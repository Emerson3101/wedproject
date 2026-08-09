import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ============================================
   HELPERS DE AUTENTICACIÓN PARA ROUTE HANDLERS
   Consolidan el boilerplate repetido en cada ruta protegida:
   (1) verificar que las env vars de configuración existan (503 si no),
   (2) verificar la cookie de sesión (401 si no coincide).

   IMPORTANTE: el muro de seguridad real es `src/proxy.ts` (verifica la
   cookie en cada petición y bloquea rutas admin). Estas funciones son una
   SEGUNDA verificación defensiva dentro del route handler (defensa en
   profundidad), no sustituyen al proxy. Ver COMPENDIUM §3 (modelo de
   confianza) y §10 #9 (la cookie es el secreto).

   Contrato: devuelven `{ ok: true }` si la petición está autorizada, o
   `{ ok: false, response }` con una `NextResponse` lista para devolver.
   Uso típico:
     const auth = await requireGuestOrAdmin();
     if (!auth.ok) return auth.response;
   ============================================ */

export interface AuthMessages {
  /** Mensaje del 401 por sesión inválida. Default: "No autorizado." */
  unauthorized?: string;
  /** Mensaje del 503 por configuración faltante. */
  configError?: string;
  /** Si true, envuelve los errores en `{ ok: false, error }` (admin/guests).
   *  El cliente admin hace el gate por HTTP status y lee `.error`, así que
   *  el wrapper es cosmético, pero se preserva para no alterar la forma. */
  wrapOk?: boolean;
}

export type AuthResult = { ok: true } | { ok: false; response: NextResponse };

const DEFAULT_CONFIG_ERROR =
  "Servicio no disponible por error de configuración del servidor.";
const DEFAULT_UNAUTHORIZED = "No autorizado.";

function errorBody(message: string, wrapOk?: boolean) {
  return wrapOk ? { ok: false as const, error: message } : { error: message };
}

function unauthorizedResponse(messages: AuthMessages): NextResponse {
  return NextResponse.json(
    errorBody(messages.unauthorized ?? DEFAULT_UNAUTHORIZED, messages.wrapOk),
    { status: 401 }
  );
}

function configErrorResponse(messages: AuthMessages): NextResponse {
  return NextResponse.json(
    errorBody(messages.configError ?? DEFAULT_CONFIG_ERROR, messages.wrapOk),
    { status: 503 }
  );
}

/* Requiere sesión de INVITADO (cookie `site_auth` = INVITATION_CODE) o de
   ADMIN (cookie `admin_auth` = ADMIN_PASSWORD). Ambas env vars deben estar
   presentes (fail closed). No loguea en consola al faltar config, para
   preservar el comportamiento de rsvp/songs/youtube. */
export async function requireGuestOrAdmin(
  messages: AuthMessages = {}
): Promise<AuthResult> {
  const invitationCode = process.env.INVITATION_CODE;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!invitationCode || !adminPassword) {
    return { ok: false, response: configErrorResponse(messages) };
  }

  const cookieStore = await cookies();
  const siteCookie = cookieStore.get("site_auth")?.value;
  const adminCookie = cookieStore.get("admin_auth")?.value;

  if (siteCookie !== invitationCode && adminCookie !== adminPassword) {
    return { ok: false, response: unauthorizedResponse(messages) };
  }

  return { ok: true };
}

/* Requiere sesión de ADMIN: cookie `admin_auth` = ADMIN_PASSWORD y, si se
   pasa `request`, ADMITE TAMBIÉN un Bearer token (Authorization: Bearer
   <ADMIN_PASSWORD>) como alternativa (ruta admin/songs). Solo ADMIN_PASSWORD
   debe estar presente. Loguea en consola al faltar config (comportamiento
   heredado de las rutas admin). */
export async function requireAdmin(
  messages: AuthMessages = {},
  request?: NextRequest
): Promise<AuthResult> {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("Config Error: ADMIN_PASSWORD is not set in environment.");
    return { ok: false, response: configErrorResponse(messages) };
  }

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin_auth")?.value;
  const isCookieValid = adminCookie === adminPassword;
  const authHeader = request?.headers.get("authorization");
  const isTokenValid = !!request && authHeader === `Bearer ${adminPassword}`;

  if (!isCookieValid && !isTokenValid) {
    return { ok: false, response: unauthorizedResponse(messages) };
  }

  return { ok: true };
}
