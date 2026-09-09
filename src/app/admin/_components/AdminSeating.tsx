"use client";

import { useMemo, useState } from "react";
import {
  Armchair,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ArrowDownUp,
  Users,
  MoveRight,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  Reorder,
  useDragControls,
} from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  SeatingResponse,
  SeatingTableWithSeats,
  MoveContext,
} from "./types";
import type { SeatOccupant } from "./types";
import { StatCard } from "./StatCard";
import { EmptyState, ErrorState } from "./States";
import { SeatingTableDiagram } from "./SeatingTableDiagram";
import { SeatingPool } from "./SeatingPool";
import { useToast } from "./AdminToast";

const EASE = [0.16, 1, 0.3, 1] as const;

export type AddSeatPayload =
  | { guestId: string; includeCompanions: boolean; seatIndexes?: number[] }
  | { adhocName: string; adhocCompanions: string[]; seatIndexes?: number[] };

/** Carga para mover una silla ya ocupada a otra posición (misma u otra mesa). */
export interface MoveSeatPayload {
  seatId: string;
  tableId: string;
  seatIndex: number;
}

interface AdminSeatingProps {
  data: SeatingResponse;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onCreateTable: (
    name: string,
    capacity: number,
    shape: "round" | "rect"
  ) => Promise<void>;
  onUpdateTable: (
    tableId: string,
    payload: {
      name?: string;
      capacity?: number;
      shape?: "round" | "rect";
      displayOrder?: number;
    }
  ) => Promise<void>;
  onDeleteTable: (tableId: string) => Promise<void>;
  onAddSeat: (tableId: string, payload: AddSeatPayload) => Promise<void>;
  onRemoveSeat: (seatId: string) => Promise<void>;
  onRemoveParty: (partyKey: string) => Promise<void>;
  onRenameSeat: (seatId: string, seatLabel: string) => Promise<void>;
  onMoveSeat: (seatId: string, target: { tableId: string; seatIndex: number }) => Promise<void>;
  /** Persiste el orden global de las mesas (lista completa de ids). */
  onReorderTables: (orderedIds: string[]) => Promise<void>;
}

interface TableFormState {
  name: string;
  capacity: number;
  shape: "round" | "rect";
}

const EMPTY_FORM: TableFormState = { name: "", capacity: 8, shape: "round" };

export function AdminSeating({
  data,
  loading,
  error,
  onRetry,
  onCreateTable,
  onUpdateTable,
  onDeleteTable,
  onAddSeat,
  onRemoveSeat,
  onRemoveParty,
  onRenameSeat,
  onMoveSeat,
  onReorderTables,
}: AdminSeatingProps) {
  const { toast } = useToast();
  const prefersReduced = useReducedMotion();
  const [poolOpen, setPoolOpen] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [formTarget, setFormTarget] = useState<SeatingTableWithSeats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SeatingTableWithSeats | null>(null);
  const [pendingTableId, setPendingTableId] = useState<string | null>(null);
  const [pendingSeatId, setPendingSeatId] = useState<string | null>(null);
  const [pendingPartyKey, setPendingPartyKey] = useState<string | null>(null);
  const [moveCtx, setMoveCtx] = useState<MoveContext | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const stats = data.stats;

  const run = async (
    set: (id: string) => void,
    clear: () => void,
    fn: () => Promise<void>,
    successMsg?: string
  ) => {
    setActionError(null);
    try {
      await fn();
      if (successMsg) toast("success", successMsg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error en la operación";
      setActionError(msg);
      toast("error", msg);
    } finally {
      clear();
    }
  };

  const handleShapeToggle = (table: SeatingTableWithSeats) => {
    const next = table.shape === "round" ? "rect" : "round";
    run(
      () => setPendingTableId(table.id),
      () => setPendingTableId(null),
      () => onUpdateTable(table.id, { shape: next }),
      `Forma ${next === "round" ? "redonda" : "rectangular"} aplicada`
    );
  };

  const handleEdit = (table: SeatingTableWithSeats) => setFormTarget(table);

  const handleAskDelete = (table: SeatingTableWithSeats) => setDeleteTarget(table);

  const handleRemoveSeat = (seatId: string, label: string) =>
    run(
      () => setPendingSeatId(seatId),
      () => setPendingSeatId(null),
      () => onRemoveSeat(seatId),
      `Asiento quitado: ${label}`
    );

  const handleRemoveParty = (partyKey: string) =>
    run(
      () => setPendingPartyKey(partyKey),
      () => setPendingPartyKey(null),
      () => onRemoveParty(partyKey),
      "Grupo retirado de la mesa"
    );

  const handleRenameSeat = async (seatId: string, seatLabel: string) =>
    run(
      () => setPendingSeatId(seatId),
      () => setPendingSeatId(null),
      () => onRenameSeat(seatId, seatLabel),
      "Asiento renombrado"
    );

  const handleAddSeat = (tableId: string, payload: AddSeatPayload) =>
    run(
      () => setPendingTableId(tableId),
      () => setPendingTableId(null),
      () => onAddSeat(tableId, payload),
      "Asignado a la mesa"
    );

  // ---- Move-mode ----
  const handleStartMove = (seat: SeatOccupant) =>
    setMoveCtx({
      seatId: seat.id,
      label: seat.seat_label,
      originTableId: seat.table_id,
      originSeatIndex: seat.seat_index,
    });

  const handleCancelMove = () => setMoveCtx(null);

  const handlePickMoveTarget = (tableId: string, seatIndex: number) => {
    const ctx = moveCtx;
    if (!ctx) return;
    setMoveCtx(null);
    run(
      () => setPendingSeatId(ctx.seatId),
      () => setPendingSeatId(null),
      () => onMoveSeat(ctx.seatId, { tableId, seatIndex }),
      `${ctx.label} movido`
    );
  };

  const tables = data.tables;
  const pool = data.pool;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Mesas" value={stats.tables} color="burgundy" icon={Armchair} />
        <StatCard label="Asientos totales" value={stats.total_seats} color="champagne" icon={LayoutGrid} />
        <StatCard label="Sentados" value={stats.occupied} color="sage" icon={CheckCircle2} />
        <StatCard label="Por sentar" value={stats.unseated_confirmed} color="silver" icon={Clock} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-display text-2xl text-burgundy">Plano de mesas</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowReorder(true)}
            disabled={loading || tables.length < 2}
            aria-label="Reordenar mesas"
            title="Cambiar el orden global de las mesas"
            className="btn-outline text-sm disabled:opacity-50"
          >
            <ArrowDownUp className="w-4 h-4" aria-hidden />
            Reordenar
          </button>
          <button
            type="button"
            onClick={() => {
              setFormTarget(null);
              setShowCreate(true);
            }}
            disabled={loading}
            className="btn-primary text-sm"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Nueva mesa
          </button>
        </div>
      </div>

      <AnimatePresence>
        {actionError && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass p-4 border-l-4 border-rose flex items-center justify-between gap-3"
            role="alert"
          >
            <p className="text-rose text-sm">{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError(null)}
              aria-label="Cerrar"
              className="text-burgundy/50 hover:text-burgundy transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {moveCtx && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            className="glass p-3 sm:p-4 border border-silver/50 flex items-center justify-between gap-3 sticky top-2 z-30"
            role="status"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MoveRight className="w-4 h-4 text-burgundy flex-shrink-0" aria-hidden />
              <p className="text-burgundy text-sm truncate">
                Moviendo a <strong className="text-burgundy">{moveCtx.label}</strong>
                <span className="text-burgundy/60 hidden sm:inline">
                  {" "}— toca una silla vacía en cualquier mesa
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelMove}
              className="inline-flex items-center gap-1.5 text-xs text-burgundy/70 hover:text-burgundy border border-champagne/30 rounded-md px-2.5 py-1.5 hover:bg-white/5 transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
              Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-display text-xl text-burgundy">Personas por sentar</h3>
            <p className="text-burgundy/50 text-xs mt-0.5">
              Invitados confirmados sin mesa + añadir personas externas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPoolOpen((v) => !v)}
            aria-expanded={poolOpen}
            aria-controls="seating-pool"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-burgundy/70 border border-champagne/30 hover:bg-white/5 transition-colors"
            title={poolOpen ? "Contraer" : "Expandir"}
          >
            <motion.span
              animate={{ rotate: poolOpen ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
              aria-hidden
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          </button>
        </div>
        <AnimatePresence initial={false}>
          {poolOpen && (
            <motion.div
              id="seating-pool"
              initial={prefersReduced ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden"
            >
              <SeatingPool
                pool={pool}
                tables={tables}
                onAddSeat={handleAddSeat}
                pendingTableId={pendingTableId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="glass p-6">
          <div className="flex items-center justify-center gap-3 py-12 text-burgundy/60">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            <span className="text-sm">Cargando plano…</span>
          </div>
        </div>
      ) : error ? (
        <div className="glass p-4 sm:p-6">
          <ErrorState error={error} onRetry={onRetry} className="py-12" />
        </div>
      ) : tables.length === 0 ? (
        <div className="glass p-4 sm:p-6">
          <EmptyState
            icon={Armchair}
            title="No hay mesas aún"
            description="Crea la primera mesa para empezar a ubicar a tus invitados."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tables.map((table) => (
            <SeatingTableDiagram
              key={table.id}
              table={table}
              pendingTableId={pendingTableId}
              pendingSeatId={pendingSeatId}
              pendingPartyKey={pendingPartyKey}
              moveCtx={moveCtx}
              onShapeToggle={handleShapeToggle}
              onEditTable={handleEdit}
              onDeleteTable={handleAskDelete}
              onRemoveSeat={handleRemoveSeat}
              onRemoveParty={handleRemoveParty}
              onRenameSeat={handleRenameSeat}
              onStartMove={handleStartMove}
              onPickMoveTarget={handlePickMoveTarget}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <TableFormModal
            title="Nueva mesa"
            initial={EMPTY_FORM}
            onClose={() => setShowCreate(false)}
            onSubmit={async (state) => {
              await run(
                () => setPendingTableId("__new__"),
                () => setPendingTableId(null),
                () => onCreateTable(state.name, state.capacity, state.shape),
                `Mesa "${state.name}" creada`
              );
              setShowCreate(false);
            }}
          />
        )}
        {showReorder && tables.length >= 2 && (
          <ReorderTablesModal
            tables={tables}
            onClose={() => setShowReorder(false)}
            onSubmit={async (orderedIds) => {
              await run(
                () => setPendingTableId("__reorder__"),
                () => setPendingTableId(null),
                () => onReorderTables(orderedIds),
                "Orden de mesas guardado"
              );
              setShowReorder(false);
            }}
          />
        )}
        {formTarget && (
          <TableFormModal
            title={`Editar mesa "${formTarget.name}"`}
            initial={{
              name: formTarget.name,
              capacity: formTarget.capacity,
              shape: formTarget.shape,
            }}
            onClose={() => setFormTarget(null)}
            onSubmit={async (state) => {
              await run(
                () => setPendingTableId(formTarget.id),
                () => setPendingTableId(null),
                () =>
                  onUpdateTable(formTarget.id, {
                    name: state.name,
                    capacity: state.capacity,
                    shape: state.shape,
                  }),
                `Mesa "${state.name}" actualizada`
              );
              setFormTarget(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteTarget(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-burgundy/15 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-table-title"
          >
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong p-8 max-w-md w-full text-center"
            >
              <h3 id="delete-table-title" className="text-display text-2xl text-burgundy mb-3">
                Eliminar mesa
              </h3>
              <p className="text-burgundy/70 text-sm mb-6">
                ¿Eliminar <strong className="text-burgundy">{deleteTarget.name}</strong>? Se
                quitarán también todos sus asientos ({deleteTarget.seats.length} ocupados).
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="btn-outline text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const target = deleteTarget;
                    setDeleteTarget(null);
                    await run(
                      () => setPendingTableId(target.id),
                      () => setPendingTableId(null),
                      () => onDeleteTable(target.id),
                      `Mesa "${target.name}" eliminada`
                    );
                  }}
                  className="btn-primary text-sm"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TableFormModalProps {
  title: string;
  initial: TableFormState;
  onClose: () => void;
  onSubmit: (state: TableFormState) => Promise<void>;
}

function TableFormModal({ title, initial, onClose, onSubmit }: TableFormModalProps) {
  const prefersReduced = useReducedMotion();
  const [name, setName] = useState(initial.name);
  const [capacity, setCapacity] = useState(initial.capacity);
  const [shape, setShape] = useState<"round" | "rect">(initial.shape);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError("El nombre es obligatorio.");
      return;
    }
    if (trimmed.length > 100) {
      setLocalError("El nombre no puede exceder 100 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ name: trimmed, capacity, shape });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-burgundy/15 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-form-title"
    >
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.25, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong p-8 max-w-md w-full"
      >
        <h3 id="table-form-title" className="text-display text-2xl text-burgundy mb-5 text-center">
          {title}
        </h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="tf-name" className="block text-burgundy/70 text-xs uppercase tracking-wider mb-1.5">
              Nombre
            </label>
            <input
              id="tf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-champagne/40 bg-wine-deep/40 text-body text-burgundy placeholder:text-burgundy/40 focus:outline-none focus:ring-2 focus:ring-silver/50 focus:border-silver/50 transition"
            />
          </div>
          <div>
            <label htmlFor="tf-capacity" className="block text-burgundy/70 text-xs uppercase tracking-wider mb-1.5">
              Capacidad (1–50)
            </label>
            <input
              id="tf-capacity"
              type="number"
              min={1}
              max={50}
              value={capacity}
              onChange={(e) =>
                setCapacity(Math.min(50, Math.max(1, Number(e.target.value) || 1)))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-champagne/40 bg-wine-deep/40 text-body text-burgundy focus:outline-none focus:ring-2 focus:ring-silver/50 focus:border-silver/50 transition"
            />
          </div>
          <div>
            <span className="block text-burgundy/70 text-xs uppercase tracking-wider mb-1.5">
              Forma
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(["round", "rect"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShape(s)}
                  aria-pressed={shape === s}
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors",
                    shape === s
                      ? "bg-silver/25 text-burgundy border-silver/60"
                      : "bg-wine-deep/30 text-burgundy/60 border-champagne/30 hover:border-silver/40 hover:text-burgundy"
                  )}
                >
                  {s === "round" ? (
                    <Armchair className="w-4 h-4" aria-hidden />
                  ) : (
                    <LayoutGrid className="w-4 h-4" aria-hidden />
                  )}
                  {s === "round" ? "Redonda" : "Rectangular"}
                </button>
              ))}
            </div>
          </div>

          {localError && (
            <p className="text-rose text-sm" role="alert">
              {localError}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline text-sm"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary text-sm"
              disabled={submitting}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
                </span>
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ============================================
   ReorderTablesModal — editor del orden global
   de las mesas. Tres mecanismos sincronizados:
   1. Drag & drop desde el grip (Reorder.Item +
      useDragControls, solo el handle inicia).
   2. Select de posición 1..N (move-to-slot).
   3. Botones subir/bajar un lugar.
   Al guardar persiste display_order=0..N-1.
   ============================================ */

interface ReorderTablesModalProps {
  tables: SeatingTableWithSeats[];
  onClose: () => void;
  onSubmit: (orderedIds: string[]) => Promise<void>;
}

function ReorderTablesModal({ tables, onClose, onSubmit }: ReorderTablesModalProps) {
  const prefersReduced = useReducedMotion();
  const [order, setOrder] = useState<string[]>(() => tables.map((t) => t.id));
  const [submitting, setSubmitting] = useState(false);

  const byId = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);

  /** Mueve la mesa en `from` hasta la posición `to` (move-to-slot). */
  const moveTo = (from: number, to: number) => {
    setOrder((cur) => {
      if (from === to || from < 0 || to < 0 || from >= cur.length || to >= cur.length) return cur;
      const next = cur.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const moveBy = (id: string, delta: number) => {
    const from = order.indexOf(id);
    moveTo(from, from + delta);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(order);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-burgundy/15 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reorder-tables-title"
    >
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.25, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong p-6 sm:p-8 max-w-md w-full"
      >
        <h3 id="reorder-tables-title" className="text-display text-2xl text-burgundy mb-1.5 text-center">
          Reordenar mesas
        </h3>
        <p className="text-burgundy/50 text-xs text-center mb-5">
          Arrastra el grip, elige la posición o usa las flechas. El nuevo orden
          se refleja en el plano y en el Excel.
        </p>

        <form onSubmit={submit}>
          <Reorder.Group
            axis="y"
            values={order}
            onReorder={setOrder}
            className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 [scrollbar-width:thin]"
          >
            {order.map((id, idx) => {
              const table = byId.get(id);
              if (!table) return null;
              return (
                <ReorderRow
                  key={id}
                  value={id}
                  index={idx}
                  total={order.length}
                  name={table.name}
                  occupied={table.seats.length}
                  capacity={table.capacity}
                  onMoveTo={(to) => moveTo(idx, to)}
                  onMoveBy={(delta) => moveBy(id, delta)}
                />
              );
            })}
          </Reorder.Group>

          <div className="flex gap-3 justify-end pt-5">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline text-sm"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary text-sm"
              disabled={submitting}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
                </span>
              ) : (
                "Guardar orden"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

interface ReorderRowProps {
  value: string;
  index: number;
  total: number;
  name: string;
  occupied: number;
  capacity: number;
  onMoveTo: (to: number) => void;
  onMoveBy: (delta: number) => void;
}

/** Fila slim: grip + select posición + nombre + ocupación + flechas. */
function ReorderRow({
  value,
  index,
  total,
  name,
  occupied,
  capacity,
  onMoveTo,
  onMoveBy,
}: ReorderRowProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={value}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-champagne/30 bg-wine-deep/30 select-none"
    >
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        aria-label={`Arrastrar ${name}`}
        title="Arrastra para reordenar"
        className="flex items-center justify-center w-8 h-8 -my-1 rounded-lg text-burgundy/40 hover:text-burgundy hover:bg-silver/15 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
      >
        <GripVertical className="w-4 h-4" aria-hidden />
      </button>

      <select
        value={index}
        onChange={(e) => onMoveTo(Number(e.target.value))}
        aria-label={`Posición de ${name}`}
        title="Posición"
        className="w-14 px-1.5 py-1 rounded-md border border-champagne/40 bg-wine-deep/40 text-burgundy text-sm tabular-nums text-center focus:outline-none focus:ring-2 focus:ring-silver/50 flex-shrink-0 [scrollbar-width:thin]"
      >
        {Array.from({ length: total }, (_, i) => (
          <option key={i} value={i}>
            {i + 1}
          </option>
        ))}
      </select>

      <div className="min-w-0 flex-1">
        <p className="text-burgundy text-sm font-medium truncate">{name}</p>
        <p className="text-burgundy/50 text-xs tabular-nums">
          {occupied}/{capacity} ocupados
        </p>
      </div>

      <div className="flex flex-col flex-shrink-0">
        <button
          type="button"
          onClick={() => onMoveBy(-1)}
          disabled={index === 0}
          aria-label={`Subir ${name}`}
          title="Subir un lugar"
          className="inline-flex items-center justify-center w-7 h-6 rounded-t-md text-burgundy/60 hover:text-burgundy hover:bg-silver/15 disabled:opacity-30 transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onMoveBy(1)}
          disabled={index === total - 1}
          aria-label={`Bajar ${name}`}
          title="Bajar un lugar"
          className="inline-flex items-center justify-center w-7 h-6 rounded-b-md text-burgundy/60 hover:text-burgundy hover:bg-silver/15 disabled:opacity-30 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" aria-hidden />
        </button>
      </div>
    </Reorder.Item>
  );
}

// Note: Pencil/Trash2/Users imports still required for table header actions;
// tree-shaken if unused by the rest of the file.
void Pencil;
void Trash2;
void Users;
