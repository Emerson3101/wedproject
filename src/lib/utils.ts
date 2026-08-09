import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ============================================
   FORMATO DE FECHAS — locale canónico es-MX
   La boda es en Ciudad de México; toda fecha que
   se renderice desde un `Date` pasa por aquí. El
   email de confirmación (rsvp/route.ts) NO usa
   estas funciones: lee los strings pre-formateados
   de `src/data/wedding.ts` (fuente de contenido),
   así que su salida no se ve afectada al cambiar
   el locale de un helper Date.
   ============================================ */

/** Locale único del sitio (boda en CDMX). */
export const SITE_LOCALE = "es-MX";

/** Fecha completa para la invitación: "domingo 18 de octubre de 2026". */
export function formatDate(date: Date): string {
  return date.toLocaleDateString(SITE_LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Hora de la ceremonia: hora sin cero a la izquierda, "4:00 p. m.". */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString(SITE_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Fecha de sección (hero, mensaje admin): "18 de octubre de 2026". */
export function formatSectionDate(date: Date): string {
  return date.toLocaleDateString(SITE_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Fecha corta para tablas admin: "18 oct". */
export function formatAdminDate(date: Date): string {
  return date.toLocaleDateString(SITE_LOCALE, {
    day: "numeric",
    month: "short",
  });
}

/** Debounce utility */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/** HTML / XSS sanitization helper to strip/escape script tags and special characters */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/** Email validation helper */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email.length <= 150 && emailRegex.test(email);
}

