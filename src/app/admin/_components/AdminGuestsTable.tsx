"use client";

/* ============================================
   AdminGuestsTable — pestaña de Invitados (WS12)
   --------------------------------------------
   Resuelve el problema de UX reportado:
   - Móvil (<md): tarjetas apiladas — sin scroll
     horizontal, sin tabla que se sale del viewport.
   - Desktop (≥md): tabla real con encabezado sticky
     (visible al desplazarse), columnas ordenables,
     altura acotada (no scroll infinito).
   - Buscador + filtros por estado + paginación
     (cero dependencias nuevas).
   - Expandir acompañantes con botón real (accesible
     por teclado); formulario inline para agregar;
     iconos lucide en las acciones (no glifos).
   - Toast de éxito al agregar/eliminar (via useToast).
   El servidor sigue siendo la fuente única de verdad:
   tras cada mutación el padre re-pide la lista.
   ============================================ */

import { Fragment, useMemo, useState, type KeyboardEvent } from "react";
import { ChevronRight, Trash2, Loader2, Plus, Users, UserMinus } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { formatAdminDate, cn } from "@/lib/utils";
import type { GuestWithCompanions } from "./types";
import type { GuestStatus } from "./StatusChip";
import { StatusChip } from "./StatusChip";
import { AdminToolbar, type FilterOption } from "./AdminToolbar";
import { SortHeader } from "./SortHeader";
import { Pagination } from "./Pagination";
import { EmptyState, ErrorState, TableSkeleton } from "./States";
import { useToast } from "./AdminToast";
import { useTableSort } from "@/hooks/useTableSort";

interface AdminGuestsTableProps {
  guests: GuestWithCompanions[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onAddCompanion: (guestId: string, name: string) => Promise<void>;
  onDeleteCompanion: (guestId: string, companionId: string) => Promise<void>;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function AdminGuestsTable({
  guests,
  loading,
  error,
  onRetry,
  onAddCompanion,
  onDeleteCompanion,
}: AdminGuestsTableProps) {
  const { toast } = useToast();
  const prefersReduced = useReducedMotion();

  // --- Filtros / búsqueda / paginación (estado local) ---
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // --- Ordenamiento ---
  const { sortKey, direction, toggle, sortBy } = useTableSort<GuestWithCompanions>(
    "created_at",
    "desc"
  );

  // --- Expandir fila de acompañantes (compartido desktop/móvil) ---
  const [expandedGuests, setExpandedGuests] = useState<Set<string>>(new Set());
  const toggleGuest = (guestId: string) => {
    setExpandedGuests((prev) => {
      const next = new Set(prev);
      if (next.has(guestId)) next.delete(guestId);
      else next.add(guestId);
      return next;
    });
  };

  // --- Form companion inline ---
  const [companionInputs, setCompanionInputs] = useState<Record<string, string>>({});
  const [companionErrors, setCompanionErrors] = useState<Record<string, string>>({});
  const [companionDeleting, setCompanionDeleting] = useState<Set<string>>(new Set());
  const [addingFor, setAddingFor] = useState<string | null>(null);

  const handleInput = (guestId: string, value: string) => {
    setCompanionInputs((prev) => ({ ...prev, [guestId]: value }));
    setCompanionErrors((prev) => ({ ...prev, [guestId]: "" }));
  };

  const handleAdd = async (guestId: string) => {
    const name = (companionInputs[guestId] ?? "").trim();
    if (!name) {
      setCompanionErrors((prev) => ({ ...prev, [guestId]: "El nombre es obligatorio" }));
      return;
    }
    setAddingFor(guestId);
    try {
      await onAddCompanion(guestId, name);
      setCompanionInputs((prev) => ({ ...prev, [guestId]: "" }));
      setCompanionErrors((prev) => ({ ...prev, [guestId]: "" }));
      toast("success", `Acompañante agregado: ${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al agregar";
      setCompanionErrors((prev) => ({ ...prev, [guestId]: msg }));
      toast("error", msg);
    } finally {
      setAddingFor(null);
    }
  };

  const handleDelete = async (guestId: string, companionId: string, companionName: string) => {
    setCompanionDeleting((prev) => new Set(prev).add(companionId));
    try {
      await onDeleteCompanion(guestId, companionId);
      toast("success", `Acompañante eliminado: ${companionName}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast("error", msg);
    } finally {
      setCompanionDeleting((prev) => {
        const next = new Set(prev);
        next.delete(companionId);
        return next;
      });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, guestId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd(guestId);
    }
  };

  // Reset de página cuando cambian filtros/búsqueda/tamaño (evita "saltar" atrás).
  const onSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const onFilterChange = (k: string) => { setActiveFilter(k); setPage(1); };
  const onPageSizeChange = (n: number) => { setPageSize(n); setPage(1); };

  // --- Derivación: counts → filtrado → ordenamiento → paginación ---
  const statusCounts = useMemo(() => {
    const c = { all: guests.length, confirmed: 0, declined: 0, pending: 0 };
    for (const { guest } of guests) c[guest.status] += 1;
    return c;
  }, [guests]);

  const filtered = useMemo(() => {
    let list = guests;
    if (activeFilter !== "all") {
      list = list.filter(({ guest }) => guest.status === activeFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(({ guest }) =>
        guest.name.toLowerCase().includes(q) ||
        guest.email.toLowerCase().includes(q) ||
        (guest.phone ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [guests, activeFilter, search]);

  const sorted = useMemo(
    () =>
      sortBy(filtered, {
        name: (g) => g.guest.name.toLowerCase(),
        email: (g) => g.guest.email.toLowerCase(),
        phone: (g) => (g.guest.phone ?? "").toLowerCase() || null,
        status: (g) => g.guest.status,
        companions: (g) => g.companions.length,
        created_at: (g) => new Date(g.guest.created_at),
      }),
    [filtered, sortBy]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const filterOptions: FilterOption[] = [
    { key: "all", label: "Todos", count: statusCounts.all },
    { key: "confirmed", label: "Confirmados", count: statusCounts.confirmed },
    { key: "declined", label: "Declinaron", count: statusCounts.declined },
    { key: "pending", label: "Pendientes", count: statusCounts.pending },
  ];

  // ====== Render: estados (loading / error / vacío) ======
  const renderStates = () => {
    if (loading) return <TableSkeleton className="px-2 py-4" />;
    if (error) return <ErrorState error={error} onRetry={onRetry} className="py-12" />;
    if (guests.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title="No hay invitados registrados aún"
          description="Los invitados aparecerán aquí cuando respondan la invitación."
        />
      );
    }
    if (sorted.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title="Sin resultados"
          description="Ningún invitado coincide con la búsqueda o el filtro aplicado."
        />
      );
    }
    return null;
  };

  const statesView = renderStates();
  const showContents = !loading && !error && sorted.length > 0 && guests.length > 0;

  return (
    <div className="space-y-4">
      {showContents && (
        <AdminToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Buscar por nombre, email o teléfono..."
          filters={filterOptions}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          resultCount={sorted.length}
          totalCount={guests.length}
        />
      )}

      <div className="glass p-4 sm:p-6">
        {statesView}

        {showContents && (
          <>
            {/* ===== Desktop: tabla con encabezado sticky + orden ===== */}
            <div
              className="hidden md:block max-h-[32rem] overflow-auto rounded-xl border border-champagne/20 [scrollbar-width:thin]"
              role="region"
              aria-label="Tabla de invitados"
            >
              <table className="w-full text-left border-collapse min-w-[820px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-wine-deep/90 backdrop-blur-md border-b border-champagne/40">
                    <SortHeader
                      sortKey="name"
                      label="Nombre"
                      activeKey={sortKey}
                      direction={direction}
                      onToggle={toggle}
                      align="left"
                      className="pl-4"
                    />
                    <SortHeader sortKey="email" label="Email" activeKey={sortKey} direction={direction} onToggle={toggle} align="left" />
                    <SortHeader sortKey="phone" label="Teléfono" activeKey={sortKey} direction={direction} onToggle={toggle} />
                    <SortHeader sortKey="status" label="Estado" activeKey={sortKey} direction={direction} onToggle={toggle} />
                    <SortHeader sortKey="companions" label="Acomp." activeKey={sortKey} direction={direction} onToggle={toggle} />
                    <SortHeader sortKey="created_at" label="Fecha" activeKey={sortKey} direction={direction} onToggle={toggle} />
                  </tr>
                </thead>
                <tbody>
                  {paged.map(({ guest, companions }) => {
                    const isOpen = expandedGuests.has(guest.id);
                    const companionsId = `companions-${guest.id}`;
                    return (
                      <Fragment key={guest.id}>
                        <tr
                          className={cn(
                            "border-b border-champagne/20 transition-colors",
                            isOpen ? "bg-white/5" : "hover:bg-white/5"
                          )}
                        >
                          <td className="py-4 px-4">
                            <button
                              type="button"
                              onClick={() => toggleGuest(guest.id)}
                              aria-expanded={isOpen}
                              aria-controls={companionsId}
                              className="flex items-center gap-2 text-left rounded-md hover:text-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silver"
                            >
                              <ChevronRight
                                className={cn(
                                  "w-4 h-4 text-burgundy/60 transition-transform flex-shrink-0",
                                  isOpen && "rotate-90"
                                )}
                                aria-hidden
                              />
                              <span className="text-burgundy font-medium">{guest.name}</span>
                            </button>
                          </td>
                          <td className="py-4 px-4 text-burgundy/85 text-sm">{guest.email}</td>
                          <td className="py-4 px-4 text-burgundy/70 text-sm">
                            {guest.phone || "—"}
                          </td>
                          <td className="py-4 px-4">
                            <StatusChip status={guest.status as GuestStatus} />
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium tabular-nums",
                                companions.length > 0
                                  ? "bg-sage/20 text-sage"
                                  : "bg-champagne/20 text-burgundy/50"
                              )}
                            >
                              {companions.length}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-burgundy/70 text-xs whitespace-nowrap">
                            {formatAdminDate(new Date(guest.created_at))}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={6} className="px-4 pb-4 pt-0">
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  id={companionsId}
                                  initial={prefersReduced ? false : { opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3, ease: EASE }}
                                  className="overflow-hidden"
                                >
                                  <CompanionPanel
                                    guestName={guest.name}
                                    companions={companions}
                                    inputValue={companionInputs[guest.id] ?? ""}
                                    onInputChange={(v) => handleInput(guest.id, v)}
                                    onAdd={() => handleAdd(guest.id)}
                                    onKeyDown={(e) => handleKeyDown(e, guest.id)}
                                    onDelete={(cid, cname) => handleDelete(guest.id, cid, cname)}
                                    deletingSet={companionDeleting}
                                    adding={addingFor === guest.id}
                                    errorMsg={companionErrors[guest.id]}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ===== Móvil: tarjetas apiladas (sin scroll horizontal) ===== */}
            <div className="md:hidden space-y-3">
              {paged.map(({ guest, companions }) => {
                const isOpen = expandedGuests.has(guest.id);
                const companionsId = `companions-m-${guest.id}`;
                return (
                  <article
                    key={guest.id}
                    className="rounded-xl border border-champagne/30 bg-wine-deep/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleGuest(guest.id)}
                        aria-expanded={isOpen}
                        aria-controls={companionsId}
                        className="flex items-start gap-2 text-left flex-1 min-w-0"
                      >
                        <ChevronRight
                          className={cn(
                            "w-4 h-4 text-burgundy/60 transition-transform flex-shrink-0 mt-1",
                            isOpen && "rotate-90"
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="text-burgundy font-medium truncate">{guest.name}</p>
                          <p className="text-burgundy/70 text-sm truncate">{guest.email}</p>
                        </div>
                      </button>
                      <StatusChip status={guest.status as GuestStatus} className="flex-shrink-0" />
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                      <div className="col-span-2">
                        <dt className="text-[0.65rem] uppercase tracking-wider text-burgundy/40">
                          Teléfono
                        </dt>
                        <dd className="text-burgundy/85">{guest.phone || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-[0.65rem] uppercase tracking-wider text-burgundy/40">
                          Acompañantes
                        </dt>
                        <dd className="text-burgundy tabular-nums">{companions.length}</dd>
                      </div>
                      <div>
                        <dt className="text-[0.65rem] uppercase tracking-wider text-burgundy/40">
                          Fecha
                        </dt>
                        <dd className="text-burgundy/85 text-sm">
                          {formatAdminDate(new Date(guest.created_at))}
                        </dd>
                      </div>
                    </dl>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={companionsId}
                          initial={prefersReduced ? false : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="overflow-hidden mt-3"
                        >
                          <CompanionPanel
                            guestName={guest.name}
                            companions={companions}
                            inputValue={companionInputs[guest.id] ?? ""}
                            onInputChange={(v) => handleInput(guest.id, v)}
                            onAdd={() => handleAdd(guest.id)}
                            onKeyDown={(e) => handleKeyDown(e, guest.id)}
                            onDelete={(cid, cname) => handleDelete(guest.id, cid, cname)}
                            deletingSet={companionDeleting}
                            adding={addingFor === guest.id}
                            errorMsg={companionErrors[guest.id]}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-champagne/20">
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                total={sorted.length}
                onPageChange={setPage}
                onPageSizeChange={onPageSizeChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------
   CompanionPanel — panel expandible de acompañantes
   Compartido por desktop (tabla) y móvil (card).
   Form inline + lista de acompañantes + delete.
   -------------------------------------------- */
interface CompanionPanelProps {
  guestName: string;
  companions: GuestWithCompanions["companions"];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onDelete: (companionId: string, companionName: string) => void;
  deletingSet: Set<string>;
  adding: boolean;
  errorMsg?: string;
}

function CompanionPanel({
  guestName,
  companions,
  inputValue,
  onInputChange,
  onAdd,
  onKeyDown,
  onDelete,
  deletingSet,
  adding,
  errorMsg,
}: CompanionPanelProps) {
  return (
    <div className="rounded-xl bg-champagne/10 p-4">
      <p className="text-xs uppercase tracking-wider text-burgundy/50 mb-3 font-medium">
        Acompañantes de {guestName}
      </p>
      {companions.length === 0 ? (
        <p className="text-burgundy/40 text-sm italic">
          Sin acompañantes registrados
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {companions.map((companion) => {
            const isDeleting = deletingSet.has(companion.id);
            return (
              <div
                key={companion.id}
                className="flex items-center gap-3 bg-wine-deep/40 rounded-lg px-3 py-2"
              >
                <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sage text-xs font-medium flex-shrink-0">
                  {companion.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-burgundy text-sm font-medium truncate flex-1 min-w-0">
                  {companion.name}
                </p>
                {isDeleting ? (
                  <Loader2
                    className="w-4 h-4 text-burgundy/50 animate-spin flex-shrink-0"
                    aria-label="Eliminando"
                  />
                ) : (
                  <button
                    type="button"
                    disabled={adding}
                    onClick={() => onDelete(companion.id, companion.name)}
                    aria-label={`Eliminar a ${companion.name}`}
                    className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-burgundy/50 hover:text-rose hover:bg-rose/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form inline — admin puede agregar sin límite (el límite de 2 aplica
          solo al RSVP público). El backend resincroniza guests.num_companions. */}
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          onClick={(e) => e.stopPropagation()}
          placeholder="Nombre del acompañante"
          aria-label={`Agregar acompañante a ${guestName}`}
          className="flex-1 px-4 py-2 rounded-lg border border-champagne/40 bg-wine-deep/40 focus:outline-none focus:ring-2 focus:ring-silver/50 text-body text-burgundy text-sm"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={adding}
          className="btn-primary text-sm px-4 py-2 whitespace-nowrap inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="w-4 h-4" aria-hidden />
          )}
          {adding ? "Agregando..." : "Agregar"}
        </button>
      </div>
      {errorMsg && <p className="mt-2 text-rose text-xs">{errorMsg}</p>}

      {/* Hint sutil sobre el límite de admin */}
      <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-burgundy/40">
        <UserMinus className="w-3 h-3" aria-hidden />
        El panel de admin no aplica el límite de 2 acompañantes del RSVP público.
      </p>
    </div>
  );
}
