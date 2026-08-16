"use client";

import { useMemo, useState } from "react";
import {
  UserPlus,
  CheckCircle2,
  X,
  Loader2,
  Heart,
  Mail,
  Phone,
  Armchair,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  ConfirmedParty,
  SeatingTableWithSeats,
} from "./types";
import type { AddSeatPayload } from "./AdminSeating";

const EASE = [0.16, 1, 0.3, 1] as const;

interface SeatingPoolProps {
  pool: ConfirmedParty[];
  tables: SeatingTableWithSeats[];
  onAddSeat: (tableId: string, payload: AddSeatPayload) => Promise<void>;
  pendingTableId: string | null;
}

type AssignCtx =
  | { kind: "rsvp"; party: ConfirmedParty; includeCompanions: boolean }
  | { kind: "adhoc"; adhocName: string; adhocCompanions: string[] }
  | null;

/** Personas a sentar en orden (lead primero). Solo para head-count + labels. */
function personQueue(ctx: NonNullable<AssignCtx>): string[] {
  if (ctx.kind === "rsvp") {
    const lead = ctx.party.guest.name;
    if (!ctx.includeCompanions) return [lead];
    return [lead, ...ctx.party.companions.map((c) => c.name)];
  }
  return [ctx.adhocName, ...ctx.adhocCompanions];
}

function seatsFor(ctx: NonNullable<AssignCtx>): number {
  return personQueue(ctx).length;
}

/**** Mini circle+seat geometry for the chair picker step. Identical trig to
 * SeatingTableDiagram so the picker visually matches the real diagram. */
interface MiniChair {
  index: number;
  cx: number;
  cy: number;
}

function miniGeometry(
  capacity: number,
  shape: "round" | "rect"
): MiniChair[] {
  if (shape === "round") {
    const radius = 38;
    return Array.from({ length: capacity }, (_, i) => {
      const angle = (i / capacity) * 2 * Math.PI - Math.PI / 2;
      return { index: i, cx: 50 + radius * Math.cos(angle), cy: 50 + radius * Math.sin(angle) };
    });
  }
  const topCount = Math.ceil(capacity / 2);
  const botCount = capacity - topCount;
  const arr: MiniChair[] = [];
  for (let i = 0; i < topCount; i++)
    arr.push({ index: i, cx: ((i + 0.5) / topCount) * 100, cy: 16 });
  for (let j = 0; j < botCount; j++)
    arr.push({ index: topCount + j, cx: ((j + 0.5) / botCount) * 100, cy: 84 });
  return arr;
}

export function SeatingPool({
  pool,
  tables,
  onAddSeat,
  pendingTableId,
}: SeatingPoolProps) {
  const prefersReduced = useReducedMotion();
  const [adhocName, setAdhocName] = useState("");
  const [adhocCompanionsRaw, setAdhocCompanionsRaw] = useState("");
  const [assignCtx, setAssignCtx] = useState<AssignCtx>(null);
  // ---- Modal step state ----
  const [step, setStep] = useState<"table" | "chairs">("table");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  const unseated = useMemo(() => pool.filter((p) => !p.lead_seated), [pool]);

  const choices = useMemo(() => {
    if (!assignCtx) return [];
    const needed = seatsFor(assignCtx);
    return tables
      .map((t) => ({
        table: t,
        remaining: Math.max(0, t.capacity - t.seats.length),
      }))
      .map((c) => ({ ...c, fits: c.remaining >= needed }));
  }, [assignCtx, tables]);

  const anyFits = choices.some((c) => c.fits);

  // La mesa elegida en el step "chairs"
  const chosenTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) ?? null,
    [tables, selectedTableId]
  );

  // Mapa de ocupación: seat_index -> occupant label
  const occupiedMap = useMemo(() => {
    const map = new Map<number, string>();
    if (chosenTable) {
      for (const s of chosenTable.seats) map.set(s.seat_index, s.seat_label);
    }
    return map;
  }, [chosenTable]);

  // Free chairs 0..capacity-1 not in occupiedMap, ascending order
  const freeSlots = useMemo(() => {
    if (!chosenTable) return [];
    const arr: number[] = [];
    for (let i = 0; i < chosenTable.capacity; i++) {
      if (!occupiedMap.has(i)) arr.push(i);
    }
    return arr;
  }, [chosenTable, occupiedMap]);

  // Sillas-mini para el picker
  const miniChairs = useMemo(() => {
    if (!chosenTable) return [];
    return miniGeometry(chosenTable.capacity, chosenTable.shape);
  }, [chosenTable]);

  const resetModal = () => {
    setAssignCtx(null);
    setStep("table");
    setSelectedTableId(null);
    setSelectedIndexes([]);
  };

  const openRsvpAssign = (party: ConfirmedParty) => {
    setAssignCtx({ kind: "rsvp", party, includeCompanions: true });
    setStep("table");
    setSelectedTableId(null);
    setSelectedIndexes([]);
  };

  const openAdhocAssign = () => {
    const cleanName = adhocName.trim();
    if (!cleanName) return;
    if (cleanName.length > 100) return;
    const companions = adhocCompanionsRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 100);
    setAssignCtx({
      kind: "adhoc",
      adhocName: cleanName,
      adhocCompanions: companions,
    });
    setStep("table");
    setSelectedTableId(null);
    setSelectedIndexes([]);
  };

  const pickTable = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    setSelectedTableId(tableId);
    // Pre-fill: lowest-free N chairs (fast path — they can re-pick)
    const needed = assignCtx ? seatsFor(assignCtx) : 0;
    const occSet = new Set(table.seats.map((s) => s.seat_index));
    const free: number[] = [];
    for (let i = 0; i < table.capacity; i++) if (!occSet.has(i)) free.push(i);
    setSelectedIndexes(free.slice(0, needed));
    setStep("chairs");
  };

  // Toggles a free chair in/out. The chair slot is at position `idx` in the
  // selectedIndexes array — tapping change re-queues that person to another
  // chair.
  const toggleChair = (seatIndex: number) => {
    setSelectedIndexes((cur) => {
      if (cur.includes(seatIndex)) {
        // Remove — but keep order (person slots intact). That person goes back
        // to "unseated" within the modal; they'll fill the next free tap.
        return cur.filter((i) => i !== seatIndex);
      }
      // Add — at most `needed` slots
      const needed = assignCtx ? seatsFor(assignCtx) : 0;
      if (cur.length >= needed) return cur;
      return [...cur, seatIndex];
    });
  };

  const allAssigned = assignCtx
    ? selectedIndexes.length === seatsFor(assignCtx)
    : false;

  const confirmTo = async () => {
    if (!assignCtx || !selectedTableId || !allAssigned) return;
    const payload: AddSeatPayload =
      assignCtx.kind === "rsvp"
        ? {
            guestId: assignCtx.party.guest.id,
            includeCompanions: assignCtx.includeCompanions,
            seatIndexes: selectedIndexes,
          }
        : {
            adhocName: assignCtx.adhocName,
            adhocCompanions: assignCtx.adhocCompanions,
            seatIndexes: selectedIndexes,
          };
    const tableId = selectedTableId;
    // Reset modal state before calling so the UI clears even if the request
    // is mid-flight. The caller's pendingTableId covers the loading state.
    if (assignCtx.kind === "adhoc") {
      setAdhocName("");
      setAdhocCompanionsRaw("");
    }
    resetModal();
    await onAddSeat(tableId, payload);
  };

  const queue = assignCtx ? personQueue(assignCtx) : [];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-burgundy/60">
            Invitados confirmados ({unseated.length} por sentar)
          </p>
        </div>
        {pool.length === 0 ? (
          <p className="text-burgundy/50 text-sm py-3">
            Aún no hay invitados confirmados. Cuando alguien confirme RSVP aparecerá aquí.
          </p>
        ) : unseated.length === 0 ? (
          <p className="text-burgundy/50 text-sm py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sage" aria-hidden />
            Todos los confirmados están sentados.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unseated.map((p) => (
              <li
                key={p.guest.id}
                className="rounded-xl border border-champagne/30 bg-wine-deep/30 p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-burgundy font-medium text-sm truncate">
                    {p.guest.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.625rem] uppercase tracking-wider border",
                        p.guest.side === "bride"
                          ? "text-rose border-rose/40"
                          : p.guest.side === "groom"
                          ? "text-silver border-silver/40"
                          : "text-burgundy/60 border-champagne/40"
                      )}
                    >
                      {p.guest.side === "bride" ? (
                        <>
                          <Heart className="w-3 h-3" aria-hidden /> Novia
                        </>
                      ) : p.guest.side === "groom" ? (
                        "Novio"
                      ) : (
                        "Sin lado"
                      )}
                    </span>
                    {p.companions.length > 0 && (
                      <span className="text-burgundy/60 text-[0.7rem]">
                        + {p.companions.length} acompañante{p.companions.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  {(p.guest.email || p.guest.phone) && (
                    <p className="text-burgundy/50 text-[0.7rem] mt-0.5 truncate">
                      {p.guest.email && <Mail className="w-3 h-3 inline mr-1" aria-hidden />}
                      {p.guest.email && p.guest.email + " "}
                      {p.guest.phone && <Phone className="w-3 h-3 inline mr-1" aria-hidden />}
                      {p.guest.phone}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openRsvpAssign(p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider bg-silver/20 text-burgundy border border-silver/40 hover:bg-silver/30 transition-colors whitespace-nowrap"
                >
                  Sentar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-4 border-t border-champagne/20">
        <p className="text-xs uppercase tracking-wider text-burgundy/60 mb-3">
          Añadir persona externa
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <input
            type="text"
            value={adhocName}
            onChange={(e) => setAdhocName(e.target.value)}
            placeholder="Nombre del invitado"
            maxLength={100}
            aria-label="Nombre del invitado externo"
            className="sm:col-span-5 px-3 py-2 rounded-xl border border-champagne/40 bg-wine-deep/40 text-body text-burgundy placeholder:text-burgundy/40 focus:outline-none focus:ring-2 focus:ring-silver/50 transition text-sm"
          />
          <input
            type="text"
            value={adhocCompanionsRaw}
            onChange={(e) => setAdhocCompanionsRaw(e.target.value)}
            placeholder="Acompañantes (separados por comas)"
            aria-label="Acompañantes separados por comas"
            className="sm:col-span-5 px-3 py-2 rounded-xl border border-champagne/40 bg-wine-deep/40 text-body text-burgundy placeholder:text-burgundy/40 focus:outline-none focus:ring-2 focus:ring-silver/50 transition text-sm"
          />
          <button
            type="button"
            onClick={openAdhocAssign}
            disabled={!adhocName.trim() || pendingTableId === "__new__"}
            className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg btn-primary text-sm disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" aria-hidden />
            Sentar
          </button>
        </div>
        <p className="text-burgundy/40 text-[0.7rem] mt-1.5">
          Las personas externas no se agregan al panel de Invitados; viven sólo en este plano.
        </p>
      </div>

      <AnimatePresence>
        {assignCtx && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-burgundy/15 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-title"
          >
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong p-6 sm:p-8 max-w-md w-full"
            >
              <div className="flex items-start justify-between gap-2 mb-4">
                <h3 id="assign-title" className="text-display text-2xl text-burgundy">
                  {step === "table" ? "Asignar a mesa" : "Elegir sillas"}
                </h3>
                <button
                  type="button"
                  onClick={resetModal}
                  aria-label="Cerrar"
                  className="text-burgundy/50 hover:text-burgundy transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Summary del party */}
              {assignCtx.kind === "rsvp" && (
                <p className="text-burgundy/70 text-sm mb-1">
                  <strong className="text-burgundy">{assignCtx.party.guest.name}</strong>
                  {assignCtx.party.companions.length > 0 &&
                    ` + ${assignCtx.party.companions.length} acompañante${
                      assignCtx.party.companions.length === 1 ? "" : "s"
                    }`}
                </p>
              )}
              {assignCtx.kind === "adhoc" && (
                <p className="text-burgundy/70 text-sm mb-1">
                  <strong className="text-burgundy">{assignCtx.adhocName}</strong>
                  {assignCtx.adhocCompanions.length > 0 &&
                    ` + ${assignCtx.adhocCompanions.length} acompañante${
                      assignCtx.adhocCompanions.length === 1 ? "" : "s"
                    }`}
                </p>
              )}

              <p className="text-burgundy/50 text-xs mt-1 mb-4">
                {step === "table"
                  ? `Se necesitan ${seatsFor(assignCtx)} sillas.`
                  : `Toca ${seatsFor(assignCtx)} silla(s) libre(s) para asignar.`}
              </p>

              {step === "table" && (
                <>
                  {!anyFits && tables.length > 0 && (
                    <p className="text-rose text-xs bg-rose/10 border border-rose/30 rounded-md p-2 mb-3">
                      Ninguna mesa tiene suficiente espacio. Aumenta alguna capacidad desde su botón de editar o quita personas primero.
                    </p>
                  )}
                  {tables.length === 0 ? (
                    <p className="text-burgundy/50 text-sm py-3">
                      No hay mesas aún. Crea una primero.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-72 overflow-auto pr-1 [scrollbar-width:thin]">
                      {choices.map((c) => (
                        <li key={c.table.id}>
                          <button
                            type="button"
                            onClick={() => pickTable(c.table.id)}
                            disabled={!c.fits}
                            className={cn(
                              "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors",
                              c.fits
                                ? "border-champagne/40 bg-wine-deep/30 hover:bg-silver/15 hover:border-silver/50"
                                : "border-champagne/20 bg-wine-deep/10 opacity-60 cursor-not-allowed"
                            )}
                          >
                            <span className="text-burgundy font-medium text-sm truncate">
                              {c.table.name}
                            </span>
                            <span
                              className={cn(
                                "text-xs tabular-nums",
                                c.fits ? "text-burgundy/60" : "text-rose/70"
                              )}
                            >
                              {c.remaining} libres
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {step === "chairs" && chosenTable && (
                <>
                  {/* Back button */}
                  <button
                    type="button"
                    onClick={() => setStep("table")}
                    className="inline-flex items-center gap-1.5 text-xs text-burgundy/70 hover:text-burgundy border border-champagne/30 rounded-md px-2.5 py-1.5 mb-4 hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
                    Cambiar mesa
                  </button>

                  <p className="text-burgundy/70 text-xs mb-2">
                    Mesa <strong className="text-burgundy">{chosenTable.name}</strong> —{" "}
                    {chosenTable.capacity} sillas, {occupiedMap.size} ocupadas, {freeSlots.length} libres
                  </p>

                  {/* Mini chair grid */}
                  <div
                    className={cn(
                      "relative mx-auto",
                      chosenTable.shape === "round"
                        ? "w-56 h-56 sm:w-60 sm:h-60"
                        : "w-60 sm:w-64 h-36"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute bg-burgundy/8 border border-burgundy/15 shadow-inner",
                        chosenTable.shape === "round"
                          ? "inset-[26%] rounded-full"
                          : "left-0 right-0 top-[35%] h-[30%] rounded-2xl"
                      )}
                      aria-hidden
                    />
                    {miniChairs.map((mc) => {
                      const isOccupied = occupiedMap.has(mc.index);
                      const isSelected = selectedIndexes.includes(mc.index);
                      const queuePos = isSelected ? selectedIndexes.indexOf(mc.index) : -1;

                      if (isOccupied) {
                        return (
                          <div
                            key={mc.index}
                            style={{ left: `${mc.cx}%`, top: `${mc.cy}%` }}
                            className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-champagne/30 bg-wine-deep/35 flex items-center justify-center text-[0.625rem] text-burgundy/40 font-display"
                            aria-hidden
                          >
                            {mc.index + 1}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={mc.index}
                          type="button"
                          onClick={() => toggleChair(mc.index)}
                          style={{ left: `${mc.cx}%`, top: `${mc.cy}%` }}
                          aria-label={
                            isSelected
                              ? `Silla ${mc.index + 1} asignada a ${queue[queuePos] ?? ""} — tap para quitar`
                              : `Silla ${mc.index + 1} libre — tap para asignar`
                          }
                          title={
                            isSelected
                              ? `${queue[queuePos] ?? ""} → silla ${mc.index + 1}`
                              : `Silla ${mc.index + 1} libre`
                          }
                          className={cn(
                            "absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full border flex items-center justify-center text-[0.625rem] font-display transition-all",
                            isSelected
                              ? "bg-silver/30 border-silver/70 text-burgundy font-semibold ring-2 ring-silver/50"
                              : "border-dashed border-champagne/50 text-burgundy/40 hover:bg-silver/10 hover:border-silver/50"
                          )}
                        >
                          {mc.index + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Person→chair mapping list */}
                  <div className="mt-4 space-y-1.5">
                    {queue.map((name, qi) => {
                      const assignedIdx = selectedIndexes[qi];
                      return (
                        <div
                          key={qi}
                          className={cn(
                            "flex items-center gap-2 text-sm px-2 py-1.5 rounded-md",
                            assignedIdx !== undefined
                              ? "bg-silver/10 text-burgundy"
                              : "bg-rose/5 text-burgundy/50"
                          )}
                        >
                          <span className="truncate flex-1">{name}</span>
                          <span className="text-xs tabular-nums flex-shrink-0">
                            {assignedIdx !== undefined
                              ? <>Silla {assignedIdx + 1}</>
                              : "Sin asignar"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {!allAssigned && (
                    <p className="mt-3 text-burgundy/50 text-xs">
                      Toca {seatsFor(assignCtx) - selectedIndexes.length} silla(s) más.
                    </p>
                  )}

                  <div className="flex gap-3 justify-end mt-4">
                    <button
                      type="button"
                      onClick={resetModal}
                      className="btn-outline text-sm"
                      disabled={!!pendingTableId}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmTo}
                      disabled={!allAssigned || !!pendingTableId}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {pendingTableId ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                          Asignando…
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <Armchair className="w-4 h-4" aria-hidden />
                          Confirmar
                        </span>
                      )}
                    </button>
                  </div>
                </>
              )}

              {step === "table" && pendingTableId && (
                <p className="mt-3 text-burgundy/60 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  Procesando…
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
