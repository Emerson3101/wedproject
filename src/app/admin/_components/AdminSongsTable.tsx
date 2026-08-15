"use client";

/* ============================================
   AdminSongsTable — pestaña de Canciones (WS12)
   --------------------------------------------
   Mismas mejoras que AdminGuestsTable:
   - desktop: tabla con encabezado sticky + sort
   - móvil: tarjetas apiladas (sin scroll horizontal)
   - buscador + filtro por estado + paginación
   - acciones con iconos lucide (Check/Circle/Trash2)
   - modal de confirmación envuelto en AnimatePresence
   - tarjetas de stats consistentes con StatCard
   El servidor sigue siendo fuente única de verdad.
   ============================================ */

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, Circle, Trash2, Music, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { formatAdminDate, cn } from "@/lib/utils";
import type { Song } from "@/lib/supabase";
import { StatCard } from "./StatCard";
import { SongStatusChip } from "./StatusChip";
import { AdminToolbar, type FilterOption } from "./AdminToolbar";
import { SortHeader } from "./SortHeader";
import { Pagination } from "./Pagination";
import { EmptyState, ErrorState, TableSkeleton } from "./States";
import { useToast } from "./AdminToast";
import { useTableSort } from "@/hooks/useTableSort";

interface AdminSongsTableProps {
  songs: Song[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggleApproval: (song: Song) => Promise<void>;
  onDeleteSong: (songId: string) => Promise<void>;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function AdminSongsTable({
  songs,
  loading,
  error,
  onRetry,
  onToggleApproval,
  onDeleteSong,
}: AdminSongsTableProps) {
  const { toast } = useToast();
  const prefersReduced = useReducedMotion();
  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // --- Filtros / búsqueda / paginación ---
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { sortKey, direction, toggle, sortBy } = useTableSort<Song>("created_at", "desc");

  const handleToggle = async (song: Song) => {
    setActionError(null);
    setPendingId(song.id);
    try {
      await onToggleApproval(song);
      toast("success", song.is_approved ? "Canción desaprobada" : "Canción aprobada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar la canción";
      setActionError(msg);
      toast("error", msg);
    } finally {
      setPendingId(null);
    }
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    setActionError(null);
    setPendingId(target.id);
    try {
      await onDeleteSong(target.id);
      toast("success", `Canción eliminada: ${target.title}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar la canción";
      setActionError(msg);
      toast("error", msg);
    } finally {
      setPendingId(null);
    }
  };

  const onSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const onFilterChange = (k: string) => { setActiveFilter(k); setPage(1); };
  const onPageSizeChange = (n: number) => { setPageSize(n); setPage(1); };

  // --- Stats de canciones (sin filtrar) ---
  const songStats = useMemo(() => ({
    total: songs.length,
    approved: songs.filter((s) => s.is_approved).length,
    pending: songs.filter((s) => !s.is_approved).length,
    topSong: songs.length > 0 ? songs.reduce((a, b) => (a.votes > b.votes ? a : b)) : null,
  }), [songs]);

  // --- Filtrado / orden / paginación ---
  const filtered = useMemo(() => {
    let list = songs;
    if (activeFilter === "approved") list = list.filter((s) => s.is_approved);
    else if (activeFilter === "pending") list = list.filter((s) => !s.is_approved);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.added_by ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [songs, activeFilter, search]);

  const sorted = useMemo(
    () =>
      sortBy(filtered, {
        title: (s) => s.title.toLowerCase(),
        artist: (s) => s.artist.toLowerCase(),
        votes: (s) => s.votes,
        status: (s) => (s.is_approved ? "approved" : "pending"),
        added_by: (s) => (s.added_by ?? "").toLowerCase() || null,
        created_at: (s) => new Date(s.created_at),
      }),
    [filtered, sortBy]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const filterOptions: FilterOption[] = [
    { key: "all", label: "Todas", count: songStats.total },
    { key: "approved", label: "Aprobadas", count: songStats.approved },
    { key: "pending", label: "Pendientes", count: songStats.pending },
  ];

  return (
    <div className="space-y-6">
      {/* === Tarjetas de estadísticas === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Canciones" value={songStats.total} color="burgundy" icon={Music} />
        <StatCard label="Aprobadas" value={songStats.approved} color="sage" icon={Check} />
        <StatCard label="Pendientes" value={songStats.pending} color="silver" icon={Circle} />
        <div className="glass p-6 text-center flex flex-col justify-center">
          <div className="text-body text-sm text-burgundy/60 uppercase tracking-wider mb-3">
            Más votada
          </div>
          <p className="text-burgundy font-medium text-sm truncate">
            {songStats.topSong ? songStats.topSong.title : "—"}
          </p>
          {songStats.topSong && (
            <p className="text-burgundy/50 text-xs tabular-nums">
              {songStats.topSong.votes} votos
            </p>
          )}
        </div>
      </div>

      {/* === Error de acción puntual === */}
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
              onClick={() => setActionError(null)}
              aria-label="Cerrar"
              className="text-burgundy/50 hover:text-burgundy transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {songs.length > 0 && (
        <AdminToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Buscar por título, artista o autor..."
          filters={filterOptions}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          resultCount={sorted.length}
          totalCount={songs.length}
        />
      )}

      <div className="glass p-4 sm:p-6">
        {loading ? (
          <TableSkeleton className="px-2 py-4" />
        ) : error ? (
          <ErrorState error={error} onRetry={onRetry} className="py-12" />
        ) : songs.length === 0 ? (
          <EmptyState
            icon={Music}
            title="No hay canciones aún"
            description="Las solicitudes de canciones aparecerán aquí cuando los invitados participen en el playlist."
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Music}
            title="Sin resultados"
            description="Ninguna canción coincide con la búsqueda o el filtro aplicado."
          />
        ) : (
          <>
            {/* === Desktop: tabla ordenable con encabezado sticky === */}
            <div
              className="hidden md:block max-h-[32rem] overflow-auto rounded-xl border border-champagne/20 [scrollbar-width:thin]"
              role="region"
              aria-label="Tabla de canciones"
            >
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-wine-deep/90 backdrop-blur-md border-b border-champagne/40">
                    <SortHeader sortKey="title" label="Título" activeKey={sortKey} direction={direction} onToggle={toggle} align="left" />
                    <SortHeader sortKey="artist" label="Artista" activeKey={sortKey} direction={direction} onToggle={toggle} align="left" />
                    <SortHeader sortKey="votes" label="Votos" activeKey={sortKey} direction={direction} onToggle={toggle} />
                    <SortHeader sortKey="status" label="Estado" activeKey={sortKey} direction={direction} onToggle={toggle} />
                    <SortHeader sortKey="added_by" label="Autor" activeKey={sortKey} direction={direction} onToggle={toggle} />
                    <SortHeader sortKey="created_at" label="Fecha" activeKey={sortKey} direction={direction} onToggle={toggle} />
                    <th scope="col" className="pb-4 px-3 text-burgundy text-xs uppercase tracking-wider text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((song) => (
                    <tr
                      key={song.id}
                      className="border-b border-champagne/20 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          {song.youtube_video_id ? (
                            <a
                              href={`https://www.youtube.com/watch?v=${song.youtube_video_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative block w-16 h-10 rounded overflow-hidden flex-shrink-0"
                              aria-label={`Ver ${song.title} en YouTube (se abre en nueva pestaña)`}
                            >
                              <Image
                                src={`https://img.youtube.com/vi/${song.youtube_video_id}/default.jpg`}
                                alt={song.title}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </a>
                          ) : (
                            <div className="w-16 h-10 rounded bg-burgundy/10 flex items-center justify-center flex-shrink-0">
                              <Music className="w-4 h-4 text-burgundy/30" aria-hidden />
                            </div>
                          )}
                          <span className="text-burgundy font-medium text-sm truncate">
                            {song.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-burgundy/85 text-sm">{song.artist}</td>
                      <td className="py-4 px-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-burgundy/10 text-burgundy text-sm font-medium tabular-nums">
                          {song.votes}
                        </span>
                      </td>
                      <td className="py-4 px-3"><SongStatusChip isApproved={song.is_approved} /></td>
                      <td className="py-4 px-3 text-burgundy/80 text-sm">{song.added_by}</td>
                      <td className="py-4 px-3 text-burgundy/70 text-xs whitespace-nowrap">
                        {formatAdminDate(new Date(song.created_at))}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggle(song)}
                            disabled={pendingId === song.id}
                            aria-label={song.is_approved ? "Desaprobar canción" : "Aprobar canción"}
                            title={song.is_approved ? "Desaprobar" : "Aprobar"}
                            className={cn(
                              "inline-flex items-center justify-center w-8 h-8 rounded-full transition-all disabled:opacity-50",
                              song.is_approved
                                ? "text-sage hover:bg-sage/15"
                                : "text-burgundy/60 hover:bg-silver/15 hover:text-burgundy"
                            )}
                          >
                            {pendingId === song.id ? (
                              <Circle className="w-4 h-4 animate-spin" aria-hidden />
                            ) : song.is_approved ? (
                              <Check className="w-4 h-4" aria-hidden />
                            ) : (
                              <Circle className="w-4 h-4" aria-hidden />
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(song)}
                            disabled={pendingId === song.id}
                            aria-label={`Eliminar ${song.title}`}
                            title="Eliminar"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-rose/60 hover:text-rose hover:bg-rose/10 transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* === Móvil: tarjetas apiladas === */}
            <div className="md:hidden space-y-3">
              {paged.map((song) => (
                <article
                  key={song.id}
                  className="rounded-xl border border-champagne/30 bg-wine-deep/30 p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {song.youtube_video_id ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${song.youtube_video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block w-20 h-12 rounded overflow-hidden flex-shrink-0"
                        aria-label={`Ver ${song.title} en YouTube`}
                      >
                        <Image
                          src={`https://img.youtube.com/vi/${song.youtube_video_id}/mqdefault.jpg`}
                          alt={song.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </a>
                    ) : (
                      <div className="w-20 h-12 rounded bg-burgundy/10 flex items-center justify-center flex-shrink-0">
                        <Music className="w-5 h-5 text-burgundy/30" aria-hidden />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-burgundy font-medium text-sm truncate">{song.title}</p>
                      <p className="text-burgundy/70 text-sm truncate">{song.artist}</p>
                      <p className="text-burgundy/50 text-xs mt-0.5">por {song.added_by}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SongStatusChip isApproved={song.is_approved} />
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-burgundy/10 text-burgundy text-xs font-medium tabular-nums">
                        {song.votes}
                      </span>
                      <span className="text-burgundy/50 text-xs">
                        {formatAdminDate(new Date(song.created_at))}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle(song)}
                        disabled={pendingId === song.id}
                        aria-label={song.is_approved ? "Desaprobar canción" : "Aprobar canción"}
                        title={song.is_approved ? "Desaprobar" : "Aprobar"}
                        className={cn(
                          "inline-flex items-center justify-center w-9 h-9 rounded-full transition-all disabled:opacity-50",
                          song.is_approved
                            ? "text-sage hover:bg-sage/15"
                            : "text-burgundy/60 hover:bg-silver/15 hover:text-burgundy"
                        )}
                      >
                        {pendingId === song.id ? (
                          <Circle className="w-4 h-4 animate-spin" aria-hidden />
                        ) : song.is_approved ? (
                          <Check className="w-4 h-4" aria-hidden />
                        ) : (
                          <Circle className="w-4 h-4" aria-hidden />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(song)}
                        disabled={pendingId === song.id}
                        aria-label="Eliminar canción"
                        title="Eliminar"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full text-rose/60 hover:text-rose hover:bg-rose/10 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
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

      {/* === Modal de confirmación de borrado (AnimatePresence) === */}
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
            aria-labelledby="delete-song-title"
          >
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong p-8 max-w-md w-full text-center"
            >
              <h3 id="delete-song-title" className="text-display text-2xl text-burgundy mb-3">
                Eliminar canción
              </h3>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
