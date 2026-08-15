"use client";

/* ============================================
   EmptyState + TableSkeleton
   --------------------------------------------
   Estados compartidos para las tablas del panel:
   - EmptyState: aviso tipiado con icono lucide.
   - TableSkeleton: filas de shimmer que sustituyen
     el "Cargando..." plano anterior.
   (WS12 admin overhaul)
   ============================================ */

import { type LucideIcon } from "lucide-react";
import Skeleton from "@/components/shared/Skeleton";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-6", className)}>
      <div className="w-16 h-16 rounded-full bg-silver/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-burgundy/40" aria-hidden />
      </div>
      <p className="text-display text-xl text-burgundy/80 font-medium">{title}</p>
      {description && (
        <p className="text-burgundy/50 text-sm mt-1 max-w-sm">{description}</p>
      )}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  className?: string;
}

/** Filas de shimmer que visualmente sustituyen a la tabla mientras carga. */
export function TableSkeleton({ rows = 7, className }: TableSkeletonProps) {
  return (
    <div className={cn("space-y-2 px-2 py-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl bg-wine-deep/20"
          aria-hidden
        >
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-16 h-6 rounded-full" />
        </div>
      ))}
      <span className="sr-only">Cargando filas…</span>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  className?: string;
}

/** Estado de error con botón Reintentar (reemplaza los bloques inline duplicados). */
export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
      <p className="text-rose text-display text-lg mb-3">{error}</p>
      <button onClick={onRetry} className="btn-outline text-sm">
        Reintentar
      </button>
    </div>
  );
}
