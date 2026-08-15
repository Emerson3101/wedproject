"use client";

/* ============================================
   SortHeader — celda de cabecera ordenable
   --------------------------------------------
   <th> accesible con botón interno que dispara
   `onToggle(sortKey)`. Usa aria-sort y un icono
   lucide que refleja el estado (inactivo / asc /
   desc). Reemplaza los <th> planos no ordenables
   de las tablas admin (WS12).
   ============================================ */

import { ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/hooks/useTableSort";

interface SortHeaderProps {
  sortKey: string;
  label: string;
  activeKey: string | null;
  direction: SortDirection;
  onToggle: (key: string) => void;
  className?: string;
  align?: "left" | "center" | "right";
}

const ALIGN: Record<NonNullable<SortHeaderProps["align"]>, string> = {
  left: "justify-start text-left",
  center: "justify-center text-center",
  right: "justify-end text-right",
};

export function SortHeader({
  sortKey,
  label,
  activeKey,
  direction,
  onToggle,
  className,
  align = "center",
}: SortHeaderProps) {
  const isActive = activeKey === sortKey;
  const ariaSort = isActive
    ? direction === "asc"
      ? "ascending"
      : "descending"
    : "none";

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn("pb-4 px-4 text-burgundy text-xs uppercase tracking-wider", className)}
    >
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        className={cn(
          "inline-flex items-center gap-1.5 w-full py-1 rounded-md transition-colors",
          "hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silver",
          ALIGN[align]
        )}
      >
        <span className="font-medium">{label}</span>
        {isActive ? (
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform",
              direction === "asc" && "rotate-180"
            )}
            aria-hidden
          />
        ) : (
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" aria-hidden />
        )}
      </button>
    </th>
  );
}
