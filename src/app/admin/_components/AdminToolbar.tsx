"use client";

/* ============================================
   AdminToolbar — barra de herramientas de tabla
   --------------------------------------------
   Buscador + grupo de filtros por estado +
   conteo de resultados. Reutilizable por las
   pestañas Invitados / Canciones / Mensajes.
   El padre es dueño del estado (`search`,
   `activeFilter`) y pasa setters — la tabla
   filtra en memoria (inmediato para cientos de
   filas). (WS12 admin overhaul)
   ============================================ */

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  key: string;
  label: string;
  count?: number;
}

interface AdminToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (key: string) => void;
  resultLabel?: string;
  /** Muestra "X de Y" o similar bajo la barra. */
  resultCount?: number;
  totalCount?: number;
  className?: string;
}

export function AdminToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters,
  activeFilter,
  onFilterChange,
  resultLabel,
  resultCount,
  totalCount,
  className,
}: AdminToolbarProps) {
  return (
    <div
      className={cn(
        "glass-subtle rounded-2xl p-3 sm:p-4 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Buscador */}
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-burgundy/50"
            aria-hidden
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Buscar"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-champagne/40 bg-wine-deep/40 text-body text-burgundy text-sm placeholder:text-burgundy/40 focus:outline-none focus:ring-2 focus:ring-silver/50 focus:border-silver/50 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-burgundy/50 hover:text-burgundy hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Conteo de resultados */}
        {typeof resultCount === "number" && typeof totalCount === "number" && (
          <p
            className="text-xs text-burgundy/50 uppercase tracking-wider whitespace-nowrap sm:ml-2"
            aria-live="polite"
          >
            {resultCount} de {totalCount}
            {resultLabel ? ` · ${resultLabel}` : ""}
          </p>
        )}
      </div>

      {/* Grupo de filtros */}
      {filters && filters.length > 0 && onFilterChange && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar por estado"
        >
          {filters.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => onFilterChange(f.key)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border transition-all",
                  isActive
                    ? "bg-silver/25 text-burgundy border-silver/60"
                    : "bg-wine-deep/30 text-burgundy/60 border-champagne/30 hover:text-burgundy hover:border-silver/40"
                )}
              >
                {f.label}
                {typeof f.count === "number" && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[0.625rem] font-medium",
                      isActive
                        ? "bg-burgundy/80 text-ivory"
                        : "bg-white/10 text-burgundy/70"
                    )}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
