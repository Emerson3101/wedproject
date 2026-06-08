"use client";

import React, { useState, useEffect } from "react";

/* ============================================
   ADMIN PANEL — Panel de Administración
   Acceso: /admin (protegido con password básico)
   ============================================ */

interface GuestData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  num_companions: number;
  message?: string | null;
  dietary_restrictions?: string | null;
  side?: string | null;
  created_at: string;
}

interface CompanionData {
  id: string;
  guest_id: string;
  name: string;
  dietary_restrictions?: string | null;
  created_at: string;
}

interface GuestWithCompanions {
  guest: GuestData;
  companions: CompanionData[];
}

interface Stats {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  totalCompanions: number;
}

interface SongRow {
  id: string;
  title: string;
  artist: string;
  votes: number;
  is_approved: boolean;
  added_by: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "guests" | "songs">(
    "dashboard"
  );
  const [guests, setGuests] = useState<GuestWithCompanions[]>([]);
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    confirmed: 0,
    declined: 0,
    pending: 0,
    totalCompanions: 0,
  });
  const [apiError, setApiError] = useState<string | null>(null);
  // Track which guest rows are expanded
  const [expandedGuests, setExpandedGuests] = useState<Set<string>>(new Set());

  // Autenticación básica
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
      password === "boda2025"
    ) {
      setIsAuthenticated(true);
    } else {
      alert("Contraseña incorrecta");
    }
  };

  // Toggle expansion of a guest row to see companions
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

  // Cargar datos desde la API admin
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setApiError(null);

      try {
        // Fetch guests with companions
        const guestsRes = await fetch("/api/admin/guests");
        const guestsData = await guestsRes.json();

        if (!guestsData.ok || !guestsRes.ok) {
          throw new Error(
            guestsData.error || `API returned status ${guestsRes.status}`
          );
        }

        if (!cancelled) {
          setGuests(guestsData.guests || []);
          setStats(guestsData.stats || {
            total: 0,
            confirmed: 0,
            declined: 0,
            pending: 0,
            totalCompanions: 0,
          });
        }
      } catch (err) {
        console.error("Error loading admin data:", err);
        if (!cancelled) {
          setApiError(
            err instanceof Error ? err.message : "Error cargando los datos"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

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
              className="w-full px-4 py-3 rounded-xl border border-champagne bg-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 text-body text-burgundy"
            />
            <button type="submit" className="btn-primary w-full justify-center">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-romantic p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-display text-4xl text-burgundy">
            Panel de Administración
          </h1>
          <a href="/" className="btn-outline text-sm">
            Ver Sitio
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(["dashboard", "guests", "songs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl text-body uppercase tracking-wider text-sm transition-all ${
                activeTab === tab
                  ? "bg-burgundy text-ivory"
                  : "glass-subtle text-burgundy/60 hover:text-burgundy"
              }`}
            >
              {tab === "dashboard"
                ? "Dashboard"
                : tab === "guests"
                  ? "Invitados"
                  : "Canciones"}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Total RSVP" value={stats.total} color="burgundy" />
            <StatCard label="Confirmados" value={stats.confirmed} color="sage" />
            <StatCard label="Declinaron" value={stats.declined} color="rose" />
            <StatCard label="Pendientes" value={stats.pending} color="gold" />
            <StatCard
              label="Acompañantes"
              value={stats.totalCompanions}
              color="champagne"
            />
          </div>
        )}

        {/* Guests Table */}
        {activeTab === "guests" && (
          <div className="glass p-6 overflow-x-auto">
            {loading ? (
              <p className="text-burgundy/60 text-center py-8">
                Cargando invitados...
              </p>
            ) : apiError ? (
              <div className="text-center py-8">
                <p className="text-rose mb-2">{apiError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-outline text-sm"
                >
                  Reintentar
                </button>
              </div>
            ) : guests.length === 0 ? (
              <p className="text-burgundy/60 text-center py-8">
                No hay invitados registrados aún.
              </p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-champagne">
                    <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">
                      Email
                    </th>
                    <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="pb-3 text-burgundy text-sm uppercase tracking-wider text-center">
                      Acompañantes
                    </th>
                    <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">
                      Mensaje
                    </th>
                    <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map(({ guest, companions }) => (
                    <React.Fragment key={guest.id}>
                      <tr
                        className="border-b border-champagne/30 cursor-pointer hover:bg-champagne/10 transition-colors"
                        onClick={() => toggleGuest(guest.id)}
                      >
                        <td className="py-3 text-burgundy font-medium">
                          {guest.name}
                        </td>
                        <td className="py-3 text-burgundy/60 text-sm">
                          {guest.email}
                        </td>
                        <td className="py-3 text-burgundy/60 text-sm">
                          {guest.phone || "—"}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={guest.status} />
                        </td>
                        <td className="py-3 text-burgundy text-center">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                              companions.length > 0
                                ? "bg-sage/20 text-sage"
                                : "text-burgundy/30"
                            }`}
                          >
                            {companions.length}
                          </span>
                        </td>
                        <td className="py-3 text-burgundy/60 text-sm italic max-w-xs truncate">
                          {guest.message || "—"}
                        </td>
                        <td className="py-3 text-burgundy/40 text-xs">
                          {new Date(guest.created_at).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                      </tr>
                      {/* Expanded companions row */}
                      {expandedGuests.has(guest.id) && (
                        <tr key={`${guest.id}-companions`}>
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
                                      className="flex items-center gap-3 bg-white/40 rounded-lg px-3 py-2"
                                    >
                                      <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sage text-xs font-medium flex-shrink-0">
                                        {companion.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-burgundy text-sm font-medium truncate">
                                          {companion.name}
                                        </p>
                                        {companion.dietary_restrictions && (
                                          <p className="text-burgundy/40 text-xs truncate">
                                            🍽 {companion.dietary_restrictions}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Songs Table — kept as placeholder for now */}
        {activeTab === "songs" && (
          <div className="glass p-6 overflow-x-auto">
            <p className="text-burgundy/60 text-center py-8">
              Próximamente — gestión de canciones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
   COMPONENTES ADMIN
   ============================================ */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    burgundy: "bg-burgundy text-ivory",
    sage: "bg-sage text-ivory",
    rose: "bg-rose text-ivory",
    gold: "bg-gold text-ivory",
    champagne: "bg-champagne text-burgundy",
  };

  return (
    <div className="glass p-6 text-center">
      <div
        className={`inline-flex items-center justify-center w-14 h-14 rounded-full text-2xl text-display mb-3 ${
          colorMap[color] || colorMap.burgundy
        }`}
      >
        {value}
      </div>
      <p className="text-body text-sm text-burgundy/60 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, string> = {
    confirmed: "bg-sage/20 text-sage",
    declined: "bg-rose/20 text-rose",
    pending: "bg-gold/20 text-gold",
  };

  const labelMap: Record<string, string> = {
    confirmed: "Confirmado",
    declined: "Declinado",
    pending: "Pendiente",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs uppercase tracking-wider ${
        statusMap[status] || statusMap.pending
      }`}
    >
      {labelMap[status] || status}
    </span>
  );
}
