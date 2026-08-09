"use client";

import { useSyncExternalStore } from "react";

/* ============================================
   usePrefersReducedMotion — SSR-safe
   Suscribe a `prefers-reduced-motion: reduce` con
   `useSyncExternalStore` (sin setState-in-effect):
   getServerSnapshot devuelve false durante SSR y en entornos
   sin matchMedia; el valor real se lee en el cliente.
   Usado por los puntos GSAP (PageAnimations, StorySection).
   Los puntos Framer usan useReducedMotion() de framer-motion.
   ============================================ */

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (callback: () => void): (() => void) => {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
};

const getSnapshot = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
};

const getServerSnapshot = (): boolean => false;

export default function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
