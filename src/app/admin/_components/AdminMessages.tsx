"use client";

/* ============================================
   AdminMessages — pestaña de mensajes
   Muestra los mensajes de los invitados (RSVP con mensaje no vacío).
   ============================================ */

import { MessageSquare } from "lucide-react";
import { formatSectionDate } from "@/lib/utils";
import type { GuestMessage } from "./types";

interface AdminMessagesProps {
  messages: GuestMessage[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function MessageCard({ message }: { message: GuestMessage }) {
  const statusColor =
    (
      {
        confirmed: "bg-sage/20 text-sage",
        declined: "bg-rose/20 text-rose",
        pending: "bg-silver/20 text-silver",
      } as const
    )[message.status as "confirmed" | "declined" | "pending"] || "bg-silver/20 text-silver";

  const statusLabel =
    (
      {
        confirmed: "Confirmado",
        declined: "Declinado",
        pending: "Pendiente",
      } as const
    )[message.status as "confirmed" | "declined" | "pending"] || message.status;

  return (
    <div className="glass p-6 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-display text-lg text-burgundy font-medium">
            {message.guestName}
          </p>
          <p className="text-burgundy/60 text-sm">{message.guestEmail}</p>
        </div>
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs uppercase tracking-wider ${statusColor} flex-shrink-0`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="bg-white/5 rounded-lg p-4 mb-3">
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
  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-burgundy/60 text-center py-8">Cargando mensajes...</p>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-rose mb-2">{error}</p>
          <button onClick={onRetry} className="btn-outline text-sm">
            Reintentar
          </button>
        </div>
      ) : messages.length === 0 ? (
        <div className="glass p-12 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-burgundy/30 mb-4" />
          <p className="text-burgundy/60 text-lg">No hay mensajes aún</p>
          <p className="text-burgundy/40 text-sm mt-1">
            Los mensajes aparecerán aquí cuando los invitados respondan
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {messages.map((msg) => (
            <MessageCard key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </div>
  );
}
