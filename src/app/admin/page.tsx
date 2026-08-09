"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import type { Song } from "@/lib/supabase";
import {
  DEFAULT_STATS,
  type GuestsResponse,
  type SongsResponse,
  type MessagesResponse,
} from "./_components/types";
import { AdminDashboard } from "./_components/AdminDashboard";
import { AdminGuestsTable } from "./_components/AdminGuestsTable";
import { AdminSongsTable } from "./_components/AdminSongsTable";
import { AdminMessages } from "./_components/AdminMessages";

/* ============================================
   ADMIN PANEL — Panel de Administración
   Acceso: /admin (protegido con contraseña; proxy.ts bloquea la ruta)

   Tras el refactor (WS6) este archivo es solo:
   - la puerta de autenticación (verificar sesión / login)
   - el switch de pestañas
   - el "wiring" de datos: un `useAdminFetch` por endpoint y los
     handlers de mutación que re-piden la lista al servidor.

   Toda la UI pesada vive en `./_components/*` y los tipos compartidos
   en `./_components/types.ts` (basados en `src/lib/supabase.ts`).
   ============================================ */

type Tab = "dashboard" | "guests" | "songs" | "messages";

const TAB_LABELS: Record<Tab, string> = {
  dashboard: "Dashboard",
  guests: "Invitados",
  songs: "Canciones",
  messages: "Mensajes",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Verificar sesión activa al montar el componente
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch("/api/admin/check");
        if (res.ok) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Error al verificar autenticación:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  // Autenticación con el endpoint del servidor
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Contraseña incorrecta");
      }
      setIsAuthenticated(true);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Contraseña incorrecta");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Wiring de datos: un hook por endpoint ---
  // Guests: se pide en cuanto hay sesión (alimenta Dashboard stats + tabla),
  // igual que el comportamiento original (no estaba gateado por pestaña).
  const guestsFetch = useAdminFetch<GuestsResponse>({
    url: "/api/admin/guests",
    enabled: isAuthenticated,
  });
  // Songs y mensajes: solo cuando su pestaña está activa (igual que antes).
  const songsFetch = useAdminFetch<SongsResponse>({
    url: "/api/songs",
    enabled: isAuthenticated && activeTab === "songs",
  });
  const messagesFetch = useAdminFetch<MessagesResponse>({
    url: "/api/admin/messages",
    enabled: isAuthenticated && activeTab === "messages",
  });

  // --- Mutaciones de canciones: al éxito se re-pide la lista (servidor = fuente única) ---
  const handleToggleApproval = async (song: Song) => {
    const res = await fetch("/api/admin/songs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songId: song.id, isApproved: !song.is_approved }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Error al actualizar");
    }
    songsFetch.retry();
  };

  const handleDeleteSong = async (songId: string) => {
    const res = await fetch(`/api/songs?songId=${songId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Error al eliminar");
    }
    songsFetch.retry();
  };

  // --- Mutaciones de acompañantes (admin puede agregar/eliminar sin límite) ---
  // El backend resincroniza guests.num_companions tras cada mutación.
  const handleAddCompanion = async (guestId: string, name: string) => {
    const res = await fetch(`/api/admin/guests/${guestId}/companions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Error al agregar acompañante");
    }
    guestsFetch.retry();
  };

  const handleDeleteCompanion = async (guestId: string, companionId: string) => {
    const res = await fetch(
      `/api/admin/guests/${guestId}/companions/${companionId}`,
      { method: "DELETE" },
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Error al eliminar acompañante");
    }
    guestsFetch.retry();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-romantic flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-burgundy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-romantic flex items-center justify-center p-4">
        <div className="glass p-8 max-w-md w-full text-center">
          <h1 className="text-display text-3xl text-burgundy mb-2">
            Panel de Administración
          </h1>
          <p className="text-body text-burgundy/60 mb-6">
            Ingresa la contraseña para continuar
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-3 rounded-xl border border-champagne bg-white/50 focus:outline-none focus:ring-2 focus:ring-silver/50 text-body text-burgundy"
            />
            {loginError && (
              <p className="text-rose text-sm">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const stats = guestsFetch.data?.stats ?? DEFAULT_STATS;

  return (
    <div className="min-h-screen bg-romantic p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-display text-4xl text-burgundy">Panel de Administración</h1>
          <Link href="/" className="btn-outline text-sm">
            Ver Sitio
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl text-body uppercase tracking-wider text-sm transition-all ${
                activeTab === tab
                  ? "bg-burgundy text-ivory"
                  : "glass-subtle text-burgundy/60 hover:text-burgundy"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === "dashboard" && <AdminDashboard stats={stats} />}

        {/* Invitados */}
        {activeTab === "guests" && (
          <AdminGuestsTable
            guests={guestsFetch.data?.guests ?? []}
            loading={guestsFetch.loading}
            error={guestsFetch.error}
            onRetry={guestsFetch.retry}
            onAddCompanion={handleAddCompanion}
            onDeleteCompanion={handleDeleteCompanion}
          />
        )}

        {/* Canciones */}
        {activeTab === "songs" && (
          <AdminSongsTable
            songs={songsFetch.data?.songs ?? []}
            loading={songsFetch.loading}
            error={songsFetch.error}
            onRetry={songsFetch.retry}
            onToggleApproval={handleToggleApproval}
            onDeleteSong={handleDeleteSong}
          />
        )}

        {/* Mensajes */}
        {activeTab === "messages" && (
          <AdminMessages
            messages={messagesFetch.data?.messages ?? []}
            loading={messagesFetch.loading}
            error={messagesFetch.error}
            onRetry={messagesFetch.retry}
          />
        )}
      </div>
    </div>
  );
}
