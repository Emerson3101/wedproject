"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Music,
  MessageSquare,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import type { Song } from "@/lib/supabase";
import { cn } from "@/lib/utils";
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
import { AdminToastProvider } from "./_components/AdminToast";

/* ============================================
   ADMIN PANEL — Panel de Administración (WS12)
   Acceso: /admin (protegido con contraseña; proxy.ts bloquea la ruta)

   Estructura:
   - puerta de autenticación (verificar sesión / login)
   - header sticky con Refrescar + Cerrar sesión + Ver Sitio
   - switch de pestañas con iconos + pill deslizante (Framer layoutId)
   - wiring de datos: un `useAdminFetch` por endpoint y handlers de
     mutación que re-piden la lista al servidor (fuente única).
   Toda la UI pesada vive en `./_components/*`. Detrás del
   AdminToastProvider para feedback de acciones.
   ============================================ */

type Tab = "dashboard" | "guests" | "songs" | "messages";

const TAB_LABELS: Record<Tab, string> = {
  dashboard: "Dashboard",
  guests: "Invitados",
  songs: "Canciones",
  messages: "Mensajes",
};

const TAB_ICONS: Record<Tab, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  guests: Users,
  songs: Music,
  messages: MessageSquare,
};

const EASE = [0.16, 1, 0.3, 1] as const;

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const prefersReduced = useReducedMotion();

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
      setPassword("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Contraseña incorrecta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      setIsAuthenticated(false);
      setActiveTab("dashboard");
      setPassword("");
      setLoggingOut(false);
    }
  };

  // --- Wiring de datos: un hook por endpoint ---
  // Guests: se pide en cuanto hay sesión (alimenta Dashboard stats + tabla).
  const guestsFetch = useAdminFetch<GuestsResponse>({
    url: "/api/admin/guests",
    enabled: isAuthenticated,
  });
  // Songs y mensajes: solo cuando su pestaña está activa.
  const songsFetch = useAdminFetch<SongsResponse>({
    url: "/api/songs",
    enabled: isAuthenticated && activeTab === "songs",
  });
  const messagesFetch = useAdminFetch<MessagesResponse>({
    url: "/api/admin/messages",
    enabled: isAuthenticated && activeTab === "messages",
  });

  // --- Refresco del tab activo ---
  const handleRefresh = () => {
    if (activeTab === "dashboard" || activeTab === "guests") guestsFetch.retry();
    else if (activeTab === "songs") songsFetch.retry();
    else if (activeTab === "messages") messagesFetch.retry();
  };

  // --- Mutaciones de canciones: al éxito se re-pide la lista ---
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

  // --- Mutaciones de acompañantes (admin sin límite de MAX) ---
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

  // ====== Pantalla: comprobando sesión ======
  if (authLoading) {
    return (
      <div className="min-h-screen bg-romantic flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-burgundy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ====== Pantalla: login (sin sesión) ======
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-romantic flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={loginError ? "error" : "form"}
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="glass-strong p-8 max-w-md w-full text-center"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-silver/20 text-silver mb-4">
              <Lock className="w-7 h-7" aria-hidden />
            </div>
            <h1 className="text-display text-3xl text-burgundy mb-2">
              Panel de Administración
            </h1>
            <p className="text-body text-burgundy/60 mb-6">
              Ingresa la contraseña para continuar
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  autoFocus
                  aria-label="Contraseña de administrador"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-champagne/40 bg-wine-deep/40 text-body text-burgundy placeholder:text-burgundy/40 focus:outline-none focus:ring-2 focus:ring-silver/50 focus:border-silver/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-burgundy/50 hover:text-burgundy hover:bg-white/10 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>
                {loginError && (
                  <motion.p
                    initial={prefersReduced ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-rose text-sm"
                    role="alert"
                  >
                    {loginError}
                  </motion.p>
                )}
              </AnimatePresence>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full justify-center disabled:opacity-60"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ====== Pantalla: panel autenticado ======
  const stats = guestsFetch.data?.stats ?? DEFAULT_STATS;

  return (
    <div className="min-h-screen bg-romantic">
      <AdminToastProvider>
        {/* Header sticky */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-wine-deep/60 border-b border-champagne/30 [scrollbar-width:thin]">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-silver/20 text-silver flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h1 className="text-display text-xl sm:text-2xl text-burgundy leading-tight truncate">
                  Panel de Administración
                </h1>
                <p className="text-burgundy/40 text-xs hidden sm:block">
                  Boda de Alma & Chava
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loggingOut}
                aria-label="Refrescar datos"
                title="Refrescar datos del tab actual"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-burgundy/70 border border-champagne/30 hover:bg-white/5 hover:text-burgundy transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-burgundy/70 border border-champagne/30 hover:bg-white/5 hover:text-burgundy transition-colors text-xs uppercase tracking-wider"
                title="Ver el sitio público"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Ver Sitio</span>
              </a>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose/80 border border-rose/20 hover:bg-rose/10 hover:text-rose transition-colors text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
          {/* Tabs con pill deslizante (Framer layoutId) */}
          <nav aria-label="Secciones del panel">
            <div
              className="glass-subtle rounded-2xl p-1.5 flex flex-wrap gap-1.5 justify-between overflow-x-auto [scrollbar-width:thin]"
              role="tablist"
            >
              {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => {
                const Icon = TAB_ICONS[tab];
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${tab}`}
                    id={`tab-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "relative flex-1 inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-body uppercase tracking-wider text-sm whitespace-nowrap transition-colors",
                      isActive
                        ? "text-ivory"
                        : "text-burgundy/60 hover:text-burgundy"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="admin-tab-pill"
                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-wine-mid to-wine-deep border border-silver/30 shadow-[0_4px_16px_rgba(138,143,152,0.25)]"
                        transition={
                          prefersReduced
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 380, damping: 30 }
                        }
                        aria-hidden
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <Icon className="w-4 h-4" aria-hidden />
                      {TAB_LABELS[tab]}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Contenido de tab */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={prefersReduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
              id={`tabpanel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
            >
              {activeTab === "dashboard" && <AdminDashboard stats={stats} />}

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

              {activeTab === "messages" && (
                <AdminMessages
                  messages={messagesFetch.data?.messages ?? []}
                  loading={messagesFetch.loading}
                  error={messagesFetch.error}
                  onRetry={messagesFetch.retry}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </AdminToastProvider>
    </div>
  );
}
