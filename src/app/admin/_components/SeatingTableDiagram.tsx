"use client";

import { useMemo, useState } from "react";
import {
  Armchair,
  LayoutGrid,
  Pencil,
  Trash2,
  Users,
  Loader2,
  X,
  AlertTriangle,
  Info,
  MoveRight,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  SeatingTableWithSeats,
  SeatOccupant,
  MoveContext,
} from "./types";

const EASE = [0.16, 1, 0.3, 1] as const;

interface SeatingTableDiagramProps {
  table: SeatingTableWithSeats;
  pendingTableId: string | null;
  pendingSeatId: string | null;
  pendingPartyKey: string | null;
  /** Si no es null, estamos en move-mode: las sillas vacías de TODAS las
   * mesas son targets tap-ables para reubicar la silla de este contexto. */
  moveCtx: MoveContext | null;
  onShapeToggle: (table: SeatingTableWithSeats) => void;
  onEditTable: (table: SeatingTableWithSeats) => void;
  onDeleteTable: (table: SeatingTableWithSeats) => void;
  onRemoveSeat: (seatId: string, label: string) => void;
  onRemoveParty: (partyKey: string) => void;
  onRenameSeat: (seatId: string, seatLabel: string) => Promise<void>;
  /** Inicia move-mode desde el popover de una silla ocupada. */
  onStartMove: (seat: SeatOccupant) => void;
  /** Tocar una silla vacía como destino del move (mesa=index). */
  onPickMoveTarget: (tableId: string, seatIndex: number) => void;
}

interface ChairSlot {
  index: number;
  occupied: SeatOccupant | null;
  cx: number;
  cy: number;
}

interface PartyStyle {
  badge: string;
  chair: string;
  indicator: string;
}

const PARTY_PALETTE: PartyStyle[] = [
  {
    badge: "text-sage-light bg-sage/15 border-sage/45",
    chair: "text-sage-light bg-sage/20 border-sage/60",
    indicator: "text-sage-light border-sage/50 bg-sage/20",
  },
  {
    badge: "text-rose bg-rose/15 border-rose/45",
    chair: "text-rose bg-rose/20 border-rose/60",
    indicator: "text-rose border-rose/50 bg-rose/20",
  },
  {
    badge: "text-silver-light bg-silver/15 border-silver/45",
    chair: "text-silver-light bg-silver/20 border-silver/60",
    indicator: "text-silver-light border-silver/50 bg-silver/20",
  },
  {
    badge: "text-amber-200 bg-amber-400/10 border-amber-400/40",
    chair: "text-amber-200 bg-amber-400/20 border-amber-400/60",
    indicator: "text-amber-200 border-amber-400/50 bg-amber-400/20",
  },
  {
    badge: "text-sky-200 bg-sky-400/10 border-sky-400/40",
    chair: "text-sky-200 bg-sky-400/20 border-sky-400/60",
    indicator: "text-sky-200 border-sky-400/50 bg-sky-400/20",
  },
  {
    badge: "text-purple-200 bg-purple-400/10 border-purple-400/40",
    chair: "text-purple-200 bg-purple-400/20 border-purple-400/60",
    indicator: "text-purple-200 border-purple-400/50 bg-purple-400/20",
  },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function getPartyStyle(partyKey: string): PartyStyle {
  return PARTY_PALETTE[hashString(partyKey) % PARTY_PALETTE.length];
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function SeatingTableDiagram({
  table,
  pendingTableId,
  pendingSeatId,
  pendingPartyKey,
  moveCtx,
  onShapeToggle,
  onEditTable,
  onDeleteTable,
  onRemoveSeat,
  onRemoveParty,
  onRenameSeat,
  onStartMove,
  onPickMoveTarget,
}: SeatingTableDiagramProps) {
  const prefersReduced = useReducedMotion();
  const [popoverSeatId, setPopoverSeatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const seatsByIndex = useMemo(() => {
    const map = new Map<number, SeatOccupant>();
    for (const s of table.seats) map.set(s.seat_index, s);
    return map;
  }, [table.seats]);

  const slots = useMemo<ChairSlot[]>(() => {
    const cap = table.capacity;
    if (table.shape === "round") {
      const radius = 38;
      return Array.from({ length: cap }, (_, i) => {
        const angle = (i / cap) * 2 * Math.PI - Math.PI / 2;
        return {
          index: i,
          occupied: seatsByIndex.get(i) ?? null,
          cx: 50 + radius * Math.cos(angle),
          cy: 50 + radius * Math.sin(angle),
        };
      });
    }
    const topCount = Math.ceil(cap / 2);
    const botCount = cap - topCount;
    const arr: ChairSlot[] = [];
    for (let i = 0; i < topCount; i++) {
      arr.push({
        index: i,
        occupied: seatsByIndex.get(i) ?? null,
        cx: ((i + 0.5) / topCount) * 100,
        cy: 16,
      });
    }
    for (let j = 0; j < botCount; j++) {
      arr.push({
        index: topCount + j,
        occupied: seatsByIndex.get(topCount + j) ?? null,
        cx: ((j + 0.5) / botCount) * 100,
        cy: 84,
      });
    }
    return arr;
  }, [table.shape, table.capacity, seatsByIndex]);

  const parties = useMemo(() => {
    const map = new Map<string, SeatOccupant[]>();
    for (const s of table.seats) {
      const list = map.get(s.party_key) || [];
      list.push(s);
      map.set(s.party_key, list);
    }
    return Array.from(map.entries()).map(([partyKey, seats]) => ({
      partyKey,
      seats: seats.sort((a, b) => (a.is_lead ? -1 : 0) - (b.is_lead ? -1 : 0)),
      lead: seats.find((s) => s.is_lead) ?? seats[0],
    }));
  }, [table.seats]);

  const occupiedCount = table.seats.length;
  const remaining = Math.max(0, table.capacity - occupiedCount);
  const moveActive = !!moveCtx;
  // Recap: sillas ordenadas por seat_index para listar "Silla N: Nombre"
  const seatsOrdered = useMemo(
    () => table.seats.slice().sort((a, b) => a.seat_index - b.seat_index),
    [table.seats]
  );
  const tablePending = pendingTableId === table.id;
  const isTooCrowded = table.capacity > 16;

  const startRename = (seat: SeatOccupant) => {
    setRenamingId(seat.id);
    setRenameValue(seat.seat_label);
  };

  const confirmRename = async (seatId: string) => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed.length <= 255) {
      await onRenameSeat(seatId, trimmed);
    }
    setRenamingId(null);
    setRenameValue("");
    setPopoverSeatId(null);
  };

  return (
    <div
      className={cn(
        "glass p-4 sm:p-5 transition-opacity",
        tablePending && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-display text-xl text-burgundy truncate">{table.name}</h3>
          <p className="text-burgundy/50 text-xs mt-0.5">
            <span className="tabular-nums">{occupiedCount}/{table.capacity}</span> ocupados
            {remaining > 0 && <> · <span className="tabular-nums">{remaining}</span> libres</>}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onShapeToggle(table)}
            disabled={tablePending}
            aria-label={table.shape === "round" ? "Cambiar a rectangular" : "Cambiar a redonda"}
            title={table.shape === "round" ? "Cambiar a rectangular" : "Cambiar a redonda"}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-burgundy/60 hover:text-burgundy hover:bg-silver/15 transition-colors disabled:opacity-50"
          >
            {table.shape === "round" ? (
              <Armchair className="w-4 h-4" aria-hidden />
            ) : (
              <LayoutGrid className="w-4 h-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => onEditTable(table)}
            disabled={tablePending}
            aria-label="Editar mesa"
            title="Editar"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-burgundy/60 hover:text-burgundy hover:bg-silver/15 transition-colors disabled:opacity-50"
          >
            <Pencil className="w-4 h-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDeleteTable(table)}
            disabled={tablePending}
            aria-label="Eliminar mesa"
            title="Eliminar"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-rose/60 hover:text-rose hover:bg-rose/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "relative mx-auto",
          table.shape === "round"
            ? "w-64 h-64 sm:w-72 sm:h-72"
            : "w-72 sm:w-80 h-44"
        )}
      >
        <div
          className={cn(
            "absolute bg-wine-mid/40 border border-silver/30 shadow-[inset_0_2px_12px_rgba(0,0,0,0.45)]",
            table.shape === "round"
              ? "inset-[26%] rounded-full"
              : "left-0 right-0 top-[35%] h-[30%] rounded-2xl"
          )}
          aria-hidden
        />
        {slots.map((slot) => {
          // ---- Silla vacía ----
          if (!slot.occupied) {
            if (moveActive) {
              // Target de move-mode: botón grande + resaltado para touch.
              return (
                <button
                  key={`target-${slot.index}`}
                  type="button"
                  onClick={() => onPickMoveTarget(table.id, slot.index)}
                  style={{
                    left: `${slot.cx}%`,
                    top: `${slot.cy}%`,
                  }}
                  aria-label={`Mover a silla ${slot.index + 1}`}
                  title={`Silla ${slot.index + 1} libre`}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-silver/70 bg-silver/10 hover:bg-silver/25 hover:border-silver flex items-center justify-center transition-colors",
                    table.shape === "round" && isTooCrowded
                      ? "w-8 h-8"
                      : "w-10 h-10"
                  )}
                >
                  <Plus
                    className={cn(
                      "text-silver",
                      table.shape === "round" && isTooCrowded ? "w-3 h-3" : "w-4 h-4"
                    )}
                    aria-hidden
                  />
                </button>
              );
            }
            return (
              <div
                key={`empty-${slot.index}`}
                className="absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-silver/40 bg-white/5 flex items-center justify-center text-[0.625rem] text-burgundy/40 font-display"
                style={{
                  left: `${slot.cx}%`,
                  top: `${slot.cy}%`,
                }}
                aria-hidden
              >
                {slot.index + 1}
              </div>
            );
          }
          // ---- Silla ocupada ----
          const seat = slot.occupied;
          const isOpen = popoverSeatId === seat.id;
          const seatPending = pendingSeatId === seat.id;
          const isMovingThis = moveCtx?.seatId === seat.id;

          // En move-mode, las sillas ocupadas (salvo la origen) quedan inertes
          // para no robar el tap del target; la origen se resalta.
          if (moveActive && !isMovingThis) {
            return (
              <div
                key={seat.id}
                style={{
                  left: `${slot.cx}%`,
                  top: `${slot.cy}%`,
                }}
                className={cn(
                  "absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full border flex items-center justify-center text-xs font-display opacity-40 shadow-sm",
                  table.shape === "round" && isTooCrowded && "w-7 h-7 text-[0.6rem]",
                  seat.is_lead
                    ? "bg-burgundy/20 border-burgundy/80 text-burgundy font-semibold"
                    : getPartyStyle(seat.party_key).chair
                )}
                aria-hidden
              >
                {table.shape === "round" && isTooCrowded ? "" : initial(seat.seat_label)}
              </div>
            );
          }

          const isMovingOrigin = !!isMovingThis;
          return (
            <button
              key={seat.id}
              type="button"
              onClick={() => {
                setPopoverSeatId((cur) => (cur === seat.id ? null : seat.id));
              }}
              title={seat.seat_label}
              aria-label={
                isMovingOrigin
                  ? `Moviendo: ${seat.seat_label}`
                  : `${seat.seat_label}${seat.is_lead ? " (cabecera)" : ""}`
              }
              style={{
                left: `${slot.cx}%`,
                top: `${slot.cy}%`,
              }}
              className={cn(
                "absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full border flex items-center justify-center text-xs font-display transition-all shadow-sm",
                table.shape === "round" && isTooCrowded && "w-7 h-7 text-[0.6rem]",
                seat.is_lead
                  ? "bg-burgundy/20 border-burgundy/80 text-burgundy font-semibold"
                  : getPartyStyle(seat.party_key).chair,
                isOpen && "ring-2 ring-silver/70",
                seatPending && "opacity-50",
                isMovingOrigin && "ring-2 ring-silver/90 bg-silver/20 animate-pulse"
              )}
            >
              {isMovingOrigin ? (
                <MoveRight className="w-4 h-4 text-burgundy" aria-hidden />
              ) : table.shape === "round" && isTooCrowded ? (
                ""
              ) : (
                initial(seat.seat_label)
              )}
            </button>
          );
        })}

        <AnimatePresence>
          {popoverSeatId && (() => {
            const slot = slots.find((s) => s.occupied?.id === popoverSeatId);
            const seat = slot?.occupied;
            if (!seat) return null;
            const isRenaming = renamingId === seat.id;
            const seatPending = pendingSeatId === seat.id;
            return (
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18, ease: EASE }}
                className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-2 w-60 glass-strong p-3 rounded-xl border border-champagne/40"
                role="dialog"
                aria-label="Detalle del asiento"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {isRenaming ? (
                      <input
                        autoFocus
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmRename(seat.id);
                          if (e.key === "Escape") {
                            setRenamingId(null);
                            setRenameValue("");
                          }
                        }}
                        maxLength={255}
                        className="w-full px-2 py-1 rounded-md border border-champagne/40 bg-wine-deep/40 text-burgundy text-sm focus:outline-none focus:ring-2 focus:ring-silver/40"
                      />
                    ) : (
                      <p className="text-burgundy font-medium text-sm truncate">{seat.seat_label}</p>
                    )}
                    <p className="text-burgundy/50 text-xs mt-0.5">
                      {seat.is_lead ? "Cabecera del grupo" : "Acompañante"} ·{" "}
                      {seat.source === "rsvp"
                        ? "RSVP confirmado"
                        : seat.source === "companion"
                        ? "Snapshot companion"
                        : "Adhoc"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPopoverSeatId(null)}
                    aria-label="Cerrar"
                    className="text-burgundy/50 hover:text-burgundy transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {seat.source === "rsvp" && typeof seat.guest_email === "string" && (
                  <p className="text-burgundy/60 text-xs mt-1 truncate">{seat.guest_email}</p>
                )}

                {seat.drift_suggested && (
                  <div
                    className="mt-2 flex items-start gap-1.5 text-amber-700 text-[0.7rem] bg-amber-50/30 border border-amber-300/30 rounded-md p-1.5"
                    role="status"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden />
                    <span>
                      Compañeros drift: cambiarán de{" "}
                      <span className="tabular-nums">{(table.seats).filter(s => s.party_key === seat.party_key && s.source === "companion").length}</span>{" "}
                      ({seat.live_companion_count ?? 0} en vivo).
                    </span>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {!isRenaming ? (
                    <>
                      <button
                        type="button"
                        onClick={() => startRename(seat)}
                        disabled={
                          seatPending || seat.source === "companion"
                        }
                        className="inline-flex items-center gap-1.5 text-xs text-burgundy/80 hover:text-burgundy border border-champagne/30 rounded-md px-2 py-1 disabled:opacity-40"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden />
                        Renombrar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPopoverSeatId(null);
                          onStartMove(seat);
                        }}
                        disabled={seatPending}
                        className="inline-flex items-center gap-1.5 text-xs text-burgundy/80 hover:text-burgundy hover:bg-silver/15 border border-champagne/30 rounded-md px-2 py-1 disabled:opacity-50"
                      >
                        <MoveRight className="w-3.5 h-3.5" aria-hidden />
                        Mover
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => confirmRename(seat.id)}
                      disabled={pendingSeatId === seat.id}
                      className="inline-flex items-center gap-1.5 text-xs text-sage hover:bg-sage/15 rounded-md px-2 py-1"
                    >
                      {pendingSeatId === seat.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                      ) : null}
                      Guardar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPopoverSeatId(null);
                      onRemoveSeat(seat.id, seat.seat_label);
                    }}
                    disabled={seatPending}
                    className="inline-flex items-center gap-1.5 text-xs text-rose/80 hover:bg-rose/10 rounded-md px-2 py-1 disabled:opacity-50"
                  >
                    {seatPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" aria-hidden />
                    )}
                    Quitar
                  </button>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {isTooCrowded && (
        <p className="mt-2 text-burgundy/40 text-xs flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" aria-hidden />
          Mesa muy concurrida — las iniciales se ocultan para mayor legibilidad.
        </p>
      )}

      {seatsOrdered.length > 0 && (
        <div className="mt-4 pt-4 border-t border-champagne/20">
          <p className="text-burgundy/60 text-xs uppercase tracking-wider mb-2">
            Personas en la mesa
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 max-h-44 overflow-auto pr-1 [scrollbar-width:thin]">
            {seatsOrdered.map((s) => {
              const pStyle = getPartyStyle(s.party_key);
              return (
                <li
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2 text-sm py-1 px-1.5 rounded-md",
                    moveCtx?.seatId === s.id && "bg-silver/15"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-6 h-6 rounded-full text-[0.625rem] font-display flex-shrink-0 border tabular-nums shadow-sm",
                      s.is_lead
                        ? "bg-burgundy/20 border-burgundy/80 text-burgundy font-semibold"
                        : pStyle.indicator
                    )}
                    aria-hidden
                  >
                    {s.seat_index + 1}
                  </span>
                  <span
                    className={cn(
                      "truncate",
                      s.is_lead ? "text-burgundy font-medium" : "text-burgundy/90"
                    )}
                    title={s.seat_label}
                  >
                    {s.seat_label}
                  </span>
                  {s.is_lead && (
                    <span className="ml-auto text-burgundy/40 text-[0.625rem] uppercase tracking-wider flex-shrink-0">
                      Cabecera
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {parties.length > 0 && (
        <div className="mt-4 pt-4 border-t border-champagne/20">
          <p className="text-burgundy/60 text-xs uppercase tracking-wider mb-2">Grupos en la mesa</p>
          <ul className="flex flex-wrap gap-2">
            {parties.map((p) => {
              const partyPending = pendingPartyKey === p.partyKey;
              const pStyle = getPartyStyle(p.partyKey);
              return (
                <li
                  key={p.partyKey}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-sm shadow-sm",
                    pStyle.badge,
                    partyPending && "opacity-60"
                  )}
                >
                  <Users className="w-3.5 h-3.5" aria-hidden />
                  <span className="truncate max-w-[8.5rem]">{p.lead?.seat_label ?? "?"}</span>
                  {p.seats.length > 1 && (
                    <span className="opacity-80 tabular-nums">+{p.seats.length - 1}</span>
                  )}
                  {p.seats.some((s) => s.drift_suggested) && (
                    <AlertTriangle className="w-3 h-3 text-amber-700" aria-label="drift" />
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveParty(p.partyKey)}
                    disabled={partyPending}
                    aria-label={`Quitar grupo de ${p.lead?.seat_label ?? "esta mesa"}`}
                    title="Quitar grupo"
                    className="opacity-70 hover:opacity-100 hover:text-rose transition-opacity disabled:opacity-40 ml-0.5"
                  >
                    {partyPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                    ) : (
                      <X className="w-3.5 h-3.5" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
