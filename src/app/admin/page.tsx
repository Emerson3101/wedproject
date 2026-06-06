"use client";

import { useState, useEffect } from "react";

/* ============================================
   ADMIN PANEL — Panel de Administración
   Acceso: /admin (protegido con password básico)
   ============================================ */

interface GuestRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  num_companions: number;
  message?: string;
  dietary_restrictions?: string;
  created_at: string;
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
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    declined: 0,
    pending: 0,
    totalCompanions: 0,
  });

  // Autenticación básica
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // En producción, usar autenticación real
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === "boda2025") {
      setIsAuthenticated(true);
    } else {
      alert("Contraseña incorrecta");
    }
  };

  // Cargar datos desde APIs
  useEffect(() => {
    if (!isAuthenticated) return;

    // En producción, cargar desde endpoints admin
    // Por ahora, datos simulados
    setGuests([
      {
        id: "1",
        name: "Ana García",
        email: "ana@email.com",
        status: "confirmed",
        num_companions: 2,
        message: "¡Felicitaciones!",
        created_at: "2025-08-01T10:00:00Z",
      },
      {
        id: "2",
        name: "Carlos López",
        email: "carlos@email.com",
        status: "confirmed",
        num_companions: 1,
        created_at: "2025-08-02T12:00:00Z",
      },
      {
        id: "3",
        name: "María Torres",
        email: "maria@email.com",
        status: "declined",
        num_companions: 0,
        created_at: "2025-08-03T14:00:00Z",
      },
    ]);

    setSongs([
      { id: "1", title: "Perfect", artist: "Ed Sheeran", votes: 12, is_approved: true, added_by: "Ana" },
      { id: "2", title: "All of Me", artist: "John Legend", votes: 9, is_approved: true, added_by: "Carlos" },
      { id: "3", title: "Thinking Out Loud", artist: "Ed Sheeran", votes: 7, is_approved: false, added_by: "María" },
    ]);

    setStats({
      total: 3,
      confirmed: 2,
      declined: 1,
      pending: 0,
      totalCompanions: 3,
    });

    setLoading(false);
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
          <a
            href="/"
            className="btn-outline text-sm"
          >
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
              {tab === "dashboard" ? "Dashboard" : tab === "guests" ? "Invitados" : "Canciones"}
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
            <StatCard label="Acompañantes" value={stats.totalCompanions} color="champagne" />
          </div>
        )}

        {/* Guests Table */}
        {activeTab === "guests" && (
          <div className="glass p-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-champagne">
                  <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">Nombre</th>
                  <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">Email</th>
                  <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">Estado</th>
                  <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">Acompañantes</th>
                  <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id} className="border-b border-champagne/30">
                    <td className="py-3 text-burgundy">{guest.name}</td>
                    <td className="py-3 text-burgundy/60 text-sm">{guest.email}</td>
                    <td className="py-3">
                      <StatusBadge status={guest.status} />
                    </td>
                    <td className="py-3 text-burgundy text-center">
                      {guest.num_companions}
                    </td>
                    <td className="py-3 text-burgundy/60 text-sm italic max-w-xs truncate">
                      {guest.message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Songs Table */}
        {activeTab === "songs" && (
          <div className="glass p-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-champagne">
                  <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">Canción</th>
                  <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">Artista</th>
                  <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">Votos</th>
                  <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">Agregado por</th>
                  <th className="pb-3 text-burgundy text-sm uppercase tracking-wider">Aprobada</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song) => (
                  <tr key={song.id} className="border-b border-champagne/30">
                    <td className="py-3 text-burgundy">{song.title}</td>
                    <td className="py-3 text-burgundy/60 text-sm">{song.artist}</td>
                    <td className="py-3 text-burgundy text-center">{song.votes}</td>
                    <td className="py-3 text-burgundy/60 text-sm">{song.added_by}</td>
                    <td className="py-3 text-center">
                      {song.is_approved ? (
                        <span className="text-sage">✓</span>
                      ) : (
                        <span className="text-burgundy/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
