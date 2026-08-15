"use client";

/* ============================================
   AdminToast — notificaciones contextuales
   --------------------------------------------
   Provider + hook de un solo fn `toast(type, msg)`.
   Stack fijo bottom-right con auto-dismiss (2.8s) y
   entrada/salida por Framer AnimatePresence. Gated
   por useReducedMotion (sin animación → fade static).
   Cero dependencias más allá de framer + lucide.
   (WS12 admin overhaul — feedback de acciones)
   ============================================ */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const EASE = [0.16, 1, 0.3, 1] as const;

const TONE: Record<ToastType, { icon: typeof CheckCircle2; color: string }> = {
  success: { icon: CheckCircle2, color: "text-sage border-sage/30" },
  error: { icon: XCircle, color: "text-rose border-rose/30" },
  info: { icon: Info, color: "text-silver border-silver/30" },
};

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prefersReduced = useReducedMotion();

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((t) => [...t, { id, type, message }]);
      window.setTimeout(() => dismiss(id), 2800);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {toasts.map(({ id, type, message }) => {
            const Icon = TONE[type].icon;
            return (
              <motion.div
                key={id}
                layout={!prefersReduced}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: EASE }}
                className={cn(
                  "glass-strong pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border max-w-xs shadow-lg",
                  TONE[type].color
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden />
                <p className="text-burgundy text-sm leading-relaxed flex-1">{message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(id)}
                  aria-label="Cerrar"
                  className="flex-shrink-0 text-burgundy/40 hover:text-burgundy transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Guard: si usan el hook fuera del provider, no-op + advertencia en dev.
    return { toast: () => console.warn("useToast used outside AdminToastProvider") };
  }
  return ctx;
}
