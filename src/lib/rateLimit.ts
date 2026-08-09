import type { NextRequest } from "next/server";

/* ============================================
   RATE LIMITER — in-memory, per-IP + per-key
   Protege endpoints sensibles (p.ej. /api/rsvp que
   dispara un email Gmail) contra abuso/flood sin
   depender de Redis ni infra externa.  Suficiente para
   un sitio de boda de un solo evento.
   ============================================ */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetMs: number;
}

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  cleanupExpired();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { ok: true, remaining: maxRequests - 1, resetMs: windowMs };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return {
      ok: false,
      remaining: 0,
      resetMs: entry.resetTime - now,
    };
  }

  return {
    ok: true,
    remaining: maxRequests - entry.count,
    resetMs: entry.resetTime - now,
  };
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}
