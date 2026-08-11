"use client";

/* ============================================
   AdminGuestsTable — pestaña de invitados
   Tabla con filas expandibles para ver acompañantes.
   Reemplaza el bloque inline del God component. Posee su propio
   estado `expandedGuests` (era del padre y pertenece a esta UI).
   ============================================ */

import { Fragment, useState, type KeyboardEvent } from "react";
import { formatAdminDate } from "@/lib/utils";
import type { GuestWithCompanions } from "./types";

type GuestStatus = "pending" | "confirmed" | "declined";

interface AdminGuestsTableProps {
  guests: GuestWithCompanions[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onAddCompanion: (guestId: string, name: string) => Promise<void>;
  onDeleteCompanion: (guestId: string, companionId: string) => Promise<void>;
}

const STATUS_MAP: Record<GuestStatus, string> = {
  confirmed: "bg-sage/20 text-sage",
  declined: "bg-rose/20 text-rose",
  pending: "bg-silver/20 text-silver",
};

const STATUS_LABEL_MAP: Record<GuestStatus, string> = {
  confirmed: "Confirmado",
  declined: "Declinado",
  pending: "Pendiente",
};

function StatusBadge({ status }: { status: GuestStatus }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs uppercase tracking-wider ${STATUS_MAP[status]}`}
    >
      {STATUS_LABEL_MAP[status]}
    </span>
  );
}

export function AdminGuestsTable({
  guests,
  loading,
  error,
  onRetry,
  onAddCompanion,
  onDeleteCompanion,
}: AdminGuestsTableProps) {
  const [expandedGuests, setExpandedGuests] = useState<Set<string>>(new Set());

  const toggleGuest = (guestId: string) => {
    setExpandedGuests((prev) => {
      const next = new Set(prev);
      if (next.has(guestId)) {
        next.delete(guestId);
      } else {
        next.add(guestId);
      }
      return next;
    });
  };

  // --- Estado del formulario inline de agregar acompañante, por invitado ---
  const [companionInputs, setCompanionInputs] = useState<Record<string, string>>({});
  const [companionErrors, setCompanionErrors] = useState<Record<string, string>>({});
  const [companionDeleting, setCompanionDeleting] = useState<Set<string>>(new Set());

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
    try {
      await onAddCompanion(guestId, name);
      setCompanionInputs((prev) => ({ ...prev, [guestId]: "" }));
      setCompanionErrors((prev) => ({ ...prev, [guestId]: "" }));
    } catch (err) {
      setCompanionErrors((prev) => ({
        ...prev,
        [guestId]: err instanceof Error ? err.message : "Error al agregar",
      }));
    }
  };

  const handleDelete = async (guestId: string, companionId: string) => {
    setCompanionDeleting((prev) => new Set(prev).add(companionId));
    try {
      await onDeleteCompanion(guestId, companionId);
    } catch (err) {
      console.error("Error al eliminar acompañante:", err);
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

  return (
    <div className="glass p-8 overflow-x-auto">
      {loading ? (
        <p className="text-burgundy/60 text-center py-8">Cargando invitados...</p>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-rose mb-2">{error}</p>
          <button onClick={onRetry} className="btn-outline text-sm">
            Reintentar
          </button>
        </div>
      ) : guests.length === 0 ? (
        <p className="text-burgundy/60 text-center py-8">
          No hay invitados registrados aún.
        </p>
      ) : (
        <table className="w-full text-center">
          <thead>
            <tr className="border-b border-champagne bg-white/5">
              <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">
                Nombre
              </th>
              <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">
                Email
              </th>
              <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">
                Teléfono
              </th>
              <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">
                Estado
              </th>
              <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">
                Acompañantes
              </th>
              <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">
                Mensaje
              </th>
              <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {guests.map(({ guest, companions }) => (
              <Fragment key={guest.id}>
                <tr
                  className="border-b border-champagne/30 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleGuest(guest.id)}
                >
                  <td className="py-5 px-6 text-burgundy font-medium">{guest.name}</td>
                  <td className="py-5 px-6 text-burgundy/80 text-sm">{guest.email}</td>
                  <td className="py-5 px-6 text-burgundy/80 text-sm">
                    {guest.phone || "—"}
                  </td>
                  <td className="py-5 px-6">
                    <StatusBadge status={guest.status} />
                  </td>
                  <td className="py-5 px-6 text-burgundy">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        companions.length > 0 ? "bg-sage/20 text-sage" : "text-burgundy/50"
                      }`}
                    >
                      {companions.length}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-burgundy/85 text-sm max-w-md truncate">
                    {guest.message || "—"}
                  </td>
                  <td className="py-5 px-6 text-burgundy/70 text-xs">
                    {formatAdminDate(new Date(guest.created_at))}
                  </td>
                </tr>
                {/* Fila expandible de acompañantes */}
                {expandedGuests.has(guest.id) && (
                  <tr>
                    <td colSpan={7} className="py-0 px-6">
                      <div className="bg-champagne/10 rounded-lg p-4 ml-4 mt-1 mb-2">
                        <p className="text-xs uppercase tracking-wider text-burgundy/50 mb-3 font-medium">
                          Acompañantes de {guest.name}
                        </p>
                        {companions.length === 0 ? (
                          <p className="text-burgundy/40 text-sm italic">
                            Sin acompañantes registrados
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {companions.map((companion) => (
                              <div
                                key={companion.id}
                                className="flex items-center gap-3 bg-wine-deep/40 rounded-lg px-3 py-2"
                              >
                                <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sage text-xs font-medium flex-shrink-0">
                                  {companion.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-burgundy text-sm font-medium truncate">
                                    {companion.name}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  disabled={companionDeleting.has(companion.id)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(guest.id, companion.id);
                                  }}
                                  aria-label={`Eliminar a ${companion.name}`}
                                  className="flex-shrink-0 text-burgundy/30 hover:text-rose transition-colors disabled:opacity-50"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formulario inline para agregar acompañante — sin límite de MAX
                            (el backend valida permisos de admin; el límite de 2 aplica
                            solo al RSVP público en src/components/sections/RSVPSection.tsx) */}
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={companionInputs[guest.id] ?? ""}
                            onChange={(e) => handleInput(guest.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, guest.id)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Nombre del acompañante"
                            className="flex-1 px-4 py-2 rounded-lg border border-champagne bg-wine-deep/40 focus:outline-none focus:ring-2 focus:ring-silver/50 text-body text-burgundy text-sm"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdd(guest.id);
                            }}
                            className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
                          >
                            + Agregar
                          </button>
                        </div>
                        {companionErrors[guest.id] && (
                          <p className="mt-2 text-rose text-xs">
                            {companionErrors[guest.id]}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
