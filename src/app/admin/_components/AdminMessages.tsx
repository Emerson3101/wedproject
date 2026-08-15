"use client";

/* ============================================
   AdminMessages — pestaña de Mensajes (WS12)
   --------------------------------------------
   Mejoras:
   - Buscador (nombre / email / contenido) + paginación
   - StatusChip unificado (misma fuente que el resto)
   - Entrada con Reveal (stagger por mensaje)
   - Estados de carga/error/vacío consistentes
   Data: GET /api/admin/messages (guests.message)
   ============================================ */

import { useMemo, useState } from "react";
import { MessageSquare, Search, X } from "lucide-react";
import { formatSectionDate } from "@/lib/utils";
import Reveal from "@/components/shared/Reveal";
import { SkeletonCard } from "@/components/shared/Skeleton";
import type { GuestMessage } from "./types";
import { StatusChip, type GuestStatus } from "./StatusChip";
import { Pagination } from "./Pagination";
import { EmptyState, ErrorState } from "./States";

interface AdminMessagesProps {
  messages: GuestMessage[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function MessageCard({ message }: { message: GuestMessage }) {
  return (
    <div className="glass p-6 hover:bg-white/5 transition-colors h-full min-w-0 flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="text-display text-lg text-burgundy font-medium truncate">
            {message.guestName}
          </p>
          <p className="text-burgundy/60 text-sm truncate">{message.guestEmail}</p>
        </div>
        <StatusChip status={message.status as GuestStatus} className="flex-shrink-0" />
      </div>
      <div className="bg-white/5 rounded-lg p-4 mb-3 flex-1 min-w-0">
        <p className="text-burgundy/95 text-body whitespace-normal break-words leading-relaxed">
          {message.message}
        </p>
      </div>
      <div className="flex items-center justify-between text-burgundy/60 text-xs">
        <span>{formatSectionDate(new Date(message.createdAt))}</span>
      </div>
    </div>
  );
}

export function AdminMessages({ messages, loading, error, onRetry }: AdminMessagesProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) =>
      m.guestName.toLowerCase().includes(q) ||
      m.guestEmail.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  }, [messages, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const onSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const onPageSizeChange = (n: number) => { setPageSize(n); setPage(1); };

  return (
    <div className="space-y-4">
      {messages.length > 0 && (
        <div className="glass-subtle rounded-2xl p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-burgundy/50" aria-hidden />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre, email o contenido..."
              aria-label="Buscar mensajes"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-champagne/40 bg-wine-deep/40 text-body text-burgundy text-sm placeholder:text-burgundy/40 focus:outline-none focus:ring-2 focus:ring-silver/50 focus:border-silver/50 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-burgundy/50 hover:text-burgundy hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <p className="sr-only" aria-live="polite">
              {filtered.length} de {messages.length} mensajes
            </p>
          </div>
          <p className="text-xs text-burgundy/50 uppercase tracking-wider mt-2 px-1">
            Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} mensajes
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} variant="default" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} className="py-12" />
      ) : messages.length === 0 ? (
        <div className="glass p-12 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-burgundy/30 mb-4" aria-hidden />
          <p className="text-burgundy/60 text-lg">No hay mensajes aún</p>
          <p className="text-burgundy/40 text-sm mt-1">
            Los mensajes aparecerán aquí cuando los invitados respondan
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Sin resultados"
          description="Ningún mensaje coincide con la búsqueda."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paged.map((msg, i) => (
              <Reveal key={msg.id} delay={i * 0.04} className="h-full min-w-0">
                <MessageCard message={msg} />
              </Reveal>
            ))}
          </div>

          <div className="glass-subtle rounded-2xl p-3 mt-4">
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={onPageSizeChange}
              pageSizeOptions={[9, 18, 36]}
            />
          </div>
        </>
      )}
    </div>
  );
}
