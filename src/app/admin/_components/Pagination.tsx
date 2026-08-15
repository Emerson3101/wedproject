"use client";

/* ============================================
   Pagination — paginación de tablas admin
   --------------------------------------------
   Cinta inferior con: página actual / total,
   botones anterior/siguiente, números de página
   con colchón + elipsis, y selector de tamaño de
   página (10/25/50). Cero dependencias.
   Accesible: botones con aria-label y disabled.

   Se oculta toda la barra cuando todo cabe en una
   sola página (no hay nada que paginar).
   ============================================ */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number; // 1-indexed
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

/** Ventana de números de página (con elipsis) alrededor de la página actual. */
function pageWindow(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const win: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) win.push("...");
  for (let p = start; p <= end; p++) win.push(p);
  if (end < total - 1) win.push("...");
  win.push(total);
  return win;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showPagination = total > Math.min(...pageSizeOptions);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-burgundy/70 text-sm",
        className
      )}
    >
      {/* Resumen + selector de tamaño */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs uppercase tracking-wider text-burgundy/50">
          Mostrando <span className="text-burgundy font-medium">{from}–{to}</span> de{" "}
          <span className="text-burgundy font-medium">{total}</span>
        </span>
        <label className="flex items-center gap-2 text-xs text-burgundy/50">
          Filas
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Filas por página"
            className="px-2 py-1 rounded-md border border-champagne/40 bg-wine-deep/40 text-burgundy text-xs focus:outline-none focus:ring-2 focus:ring-silver/50 cursor-pointer"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n} className="bg-wine-deep text-burgundy">
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Botones de página */}
      {showPagination && (
        <div className="flex items-center gap-1" role="navigation" aria-label="Paginación">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Página anterior"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-champagne/30 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageWindow(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span
                key={`e${i}`}
                className="inline-flex items-center justify-center w-9 h-9 text-burgundy/40"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Página ${p}`}
                className={cn(
                  "inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-lg border text-sm transition-all",
                  p === page
                    ? "bg-silver/25 text-burgundy border-silver/60 font-medium"
                    : "border-champagne/30 text-burgundy/70 hover:bg-white/5 hover:text-burgundy"
                )}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-champagne/30 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
