"use client";

/* ============================================
   AdminSongsTable — pestaña de canciones
   --------------------------------------------
   Recibe la lista de canciones (fuente: el hook en page.tsx) y
   expone aprobar/eliminar. Posee su propia UI local:
   - el modal de confirmación de borrado (reemplaza `window.confirm`)
   - el error de una acción puntual (reemplaza `alert`)
   Las mutaciones llaman a callbacks del padre; tras éxito el padre
   re-pide la lista (`retry`), así el servidor es fuente única y no
   hace falta estado de sobreescritura optimista (sin setState-in-effect).
   ============================================ */

import { useState } from "react";
import Image from "next/image";
import { formatAdminDate } from "@/lib/utils";
import type { Song } from "@/lib/supabase";
import { StatCard } from "./StatCard";

interface AdminSongsTableProps {
  songs: Song[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggleApproval: (song: Song) => Promise<void>;
  onDeleteSong: (songId: string) => Promise<void>;
}

function SongStatusBadge({ isApproved }: { isApproved: boolean }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs uppercase tracking-wider ${
        isApproved ? "bg-sage/20 text-sage" : "bg-silver/20 text-silver"
      }`}
    >
      {isApproved ? "Aprobada" : "Pendiente"}
    </span>
  );
}

export function AdminSongsTable({
  songs,
  loading,
  error,
  onRetry,
  onToggleApproval,
  onDeleteSong,
}: AdminSongsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const songStats = {
    total: songs.length,
    approved: songs.filter((s) => s.is_approved).length,
    pending: songs.filter((s) => !s.is_approved).length,
    topSong: songs.length > 0 ? songs.reduce((a, b) => (a.votes > b.votes ? a : b)) : null,
  };

  const handleToggle = async (song: Song) => {
    setActionError(null);
    try {
      await onToggleApproval(song);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al actualizar la canción");
    }
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    setActionError(null);
    try {
      await onDeleteSong(target.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al eliminar la canción");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Canciones" value={songStats.total} color="burgundy" />
        <StatCard label="Aprobadas" value={songStats.approved} color="sage" />
        <StatCard label="Pendientes" value={songStats.pending} color="silver" />
        <div className="glass p-6 text-center">
          <div className="text-body text-sm text-burgundy/60 uppercase tracking-wider mb-3">
            Más votada
          </div>
          <p className="text-burgundy font-medium text-sm truncate">
            {songStats.topSong ? `${songStats.topSong.title}` : "—"}
          </p>
          {songStats.topSong && (
            <p className="text-burgundy/40 text-xs">{songStats.topSong.votes} votos</p>
          )}
        </div>
      </div>

      {/* Error de una acción concreta (toggle/eliminar) */}
      {actionError && (
        <div className="glass p-4 border-l-4 border-rose">
          <p className="text-rose text-sm">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="text-burgundy/50 text-xs mt-1 hover:text-burgundy underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tabla de canciones */}
      <div className="glass p-8 overflow-x-auto">
        {loading ? (
          <p className="text-burgundy/60 text-center py-8">Cargando canciones...</p>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-rose mb-2">{error}</p>
            <button onClick={onRetry} className="btn-outline text-sm">
              Reintentar
            </button>
          </div>
        ) : songs.length === 0 ? (
          <p className="text-burgundy/60 text-center py-8">No hay canciones aún.</p>
        ) : (
          <table className="w-full text-center">
            <thead>
              <tr className="border-b border-champagne bg-white/5">
                <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">Video</th>
                <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">Título</th>
                <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">Artista</th>
                <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">Votos</th>
                <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">Estado</th>
                <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">Agregado por</th>
                <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">Fecha</th>
                <th className="pb-5 px-6 text-burgundy text-sm uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song) => (
                <tr
                  key={song.id}
                  className="border-b border-champagne/30 hover:bg-white/5 transition-colors"
                >
                  {/* Miniatura */}
                  <td className="py-5 px-6">
                    {song.youtube_video_id ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${song.youtube_video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block w-20 h-12 rounded overflow-hidden mx-auto"
                      >
                        <Image
                          src={`https://img.youtube.com/vi/${song.youtube_video_id}/default.jpg`}
                          alt={song.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </a>
                    ) : (
                      <div className="w-20 h-12 rounded bg-burgundy/5 flex items-center justify-center mx-auto">
                        <span className="text-burgundy/20 text-xs">Sin video</span>
                      </div>
                    )}
                  </td>
                  <td className="py-5 px-6 text-burgundy font-medium text-sm">{song.title}</td>
                  <td className="py-5 px-6 text-burgundy/80 text-sm">{song.artist}</td>
                  <td className="py-5 px-6 text-burgundy">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-burgundy/5 text-sm font-medium">
                      {song.votes}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <SongStatusBadge isApproved={song.is_approved} />
                  </td>
                  <td className="py-5 px-6 text-burgundy/80 text-sm">{song.added_by}</td>
                  <td className="py-5 px-6 text-burgundy/70 text-xs">
                    {formatAdminDate(new Date(song.created_at))}
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggle(song)}
                        className={`p-1.5 rounded-full transition-all text-xs ${
                          song.is_approved ? "text-sage hover:bg-sage/10" : "text-silver hover:bg-silver/10"
                        }`}
                        title={song.is_approved ? "Desaprobar" : "Aprobar"}
                      >
                        {song.is_approved ? "✓" : "○"}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(song)}
                        className="p-1.5 rounded-full text-rose/60 hover:text-rose hover:bg-rose/10 transition-all"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de confirmación de borrado (reemplaza window.confirm) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-burgundy/30 backdrop-blur-sm p-4">
          <div className="glass p-8 max-w-md w-full text-center">
            <h3 className="text-display text-2xl text-burgundy mb-3">Eliminar canción</h3>
            <p className="text-burgundy/70 text-sm mb-6">
              ¿Estás seguro de que quieres eliminar{" "}
              <strong className="text-burgundy">{deleteTarget.title}</strong>?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-outline text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="btn-primary text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
