"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Search,
  Heart,
  Plus,
  Check,
  X,
  Loader2,
  Play,
  ExternalLink,
} from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import GlassCard from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { debounce } from "@/lib/utils";

/* ============================================
   PLAYLIST MUSICAL — Conectado a YouTube
   Los invitados pueden buscar videos de YouTube,
   agregarlos a la playlist y votar por sus favoritos.
   ============================================ */

interface SongEntry {
  id: string;
  title: string;
  artist: string;
  youtube_video_id: string;
  thumbnail_url: string;
  votes: number;
  addedBy: string;
  isVoted: boolean;
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
}

// Extraer el video ID de una URL de YouTube
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    // youtube.com/watch?v=VIDEO_ID
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    // youtu.be/VIDEO_ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/embed/VIDEO_ID
    /embed\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/shorts/VIDEO_ID
    /shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function PlaylistSection() {
  const [songs, setSongs] = useState<SongEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState<string | null>(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [selectedSong, setSelectedSong] = useState<SongEntry | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Generar/obtener un voter_id persistente por navegador
  const getVoterId = useCallback(() => {
    if (typeof window === "undefined") return "";
    let voterId = localStorage.getItem("wedding_voter_id");
    if (!voterId) {
      voterId = "voter_" + crypto.randomUUID();
      localStorage.setItem("wedding_voter_id", voterId);
    }
    return voterId;
  }, []);

  // Cargar canciones desde el backend al montar
  useEffect(() => {
    let cancelled = false;

    const fetchSongs = async () => {
      setLoading(true);
      try {
        const voterId = getVoterId();
        const res = await fetch(`/api/songs?voterId=${encodeURIComponent(voterId)}`);
        const data = (await res.json()) as { songs: Record<string, unknown>[] };
        if (!cancelled && data.songs) {
          setSongs(
            data.songs.map((s) => ({
              id: String(s.id),
              title: String(s.title),
              artist: String(s.artist),
              youtube_video_id: String(s.youtube_video_id || ""),
              thumbnail_url: String(s.thumbnail_url || ""),
              votes: Number(s.votes) || 0,
              addedBy: String(s.added_by || "Guest"),
              isVoted: Boolean(s.isLikedByVoter),
            }))
          );
        }
      } catch (err) {
        console.error("Error loading songs:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSongs();
    return () => {
      cancelled = true;
    };
  }, [getVoterId]);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(e.target as Node)
      ) {
        setYoutubeResults([]);
        setSearchError(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar en YouTube con debounce
  const searchYouTube = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 2) {
          setYoutubeResults([]);
          setSearchError(null);
          return;
        }

        // Si el usuario pegó una URL directa, extraer el video ID
        const videoId = extractYouTubeVideoId(query);
        if (videoId) {
          // Hacer una búsqueda específica por el video ID
          setIsSearching(true);
          try {
            const res = await fetch(
              `/api/youtube/search?q=${encodeURIComponent(query)}`
            );
            const data = (await res.json()) as { videos?: YouTubeVideo[] };
            if (data.videos && data.videos.length > 0) {
              setYoutubeResults(data.videos);
              setSearchError(null);
            } else {
              setYoutubeResults([]);
              setSearchError("No se encontró el video. Intenta con otra búsqueda.");
            }
          } catch {
            setSearchError("Error al buscar el video.");
          } finally {
            setIsSearching(false);
          }
          return;
        }

        setIsSearching(true);
        setSearchError(null);
        try {
          const res = await fetch(
            `/api/youtube/search?q=${encodeURIComponent(query)}`
          );
          const data = (await res.json()) as { videos?: YouTubeVideo[]; error?: string };

          if (data.error) {
            setSearchError(data.error);
            setYoutubeResults([]);
          } else {
            setYoutubeResults(data.videos || []);
          }
        } catch {
          setSearchError("Error buscando en YouTube.");
        } finally {
          setIsSearching(false);
        }
      }, 500),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchYouTube(value);
  };

  const refreshSongs = async () => {
    try {
      const voterId = getVoterId();
      const res = await fetch(`/api/songs?voterId=${encodeURIComponent(voterId)}`);
      const data = (await res.json()) as { songs: Record<string, unknown>[] };
      if (data.songs) {
        setSongs(
          data.songs.map((s) => ({
            id: String(s.id),
            title: String(s.title),
            artist: String(s.artist),
            youtube_video_id: String(s.youtube_video_id || ""),
            thumbnail_url: String(s.thumbnail_url || ""),
            votes: Number(s.votes) || 0,
            addedBy: String(s.added_by || "Guest"),
            isVoted: Boolean(s.isLikedByVoter),
          }))
        );
      }
    } catch (err) {
      console.error("Error refreshing songs:", err);
    }
  };

  const handleVote = async (song: SongEntry) => {
    const voterId = getVoterId();
    const isLike = !song.isVoted;

    // Optimistic update
    setSongs((prev) =>
      prev.map((s) =>
        s.id === song.id
          ? {
              ...s,
              votes: isLike ? s.votes + 1 : Math.max(0, s.votes - 1),
              isVoted: isLike,
            }
          : s
      )
    );

    // Enviar like/unlike al backend
    try {
      const res = await fetch("/api/songs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId: song.id,
          voterId,
          isLike,
        }),
      });
      const data = (await res.json()) as { liked?: boolean };

      // Refrescar para sincronizar con el estado real del servidor
      await refreshSongs();
    } catch (err) {
      console.error("Like error:", err);
      // Revertir si falla
      setSongs((prev) =>
        prev.map((s) =>
          s.id === song.id
            ? {
                ...s,
                votes: isLike ? s.votes - 1 : s.votes + 1,
                isVoted: !isLike,
              }
            : s
        )
      );
    }
  };

  const handleAddFromYouTube = async (video: YouTubeVideo) => {
    const newSong: SongEntry = {
      id: `yt_${songs.length + 1}`,
      title: video.title,
      artist: video.artist,
      youtube_video_id: video.videoId,
      thumbnail_url: video.thumbnailUrl,
      votes: 0,
      addedBy: "Tú",
      isVoted: false,
    };

    setSongs((prev) => [newSong, ...prev]);
    setSearchTerm("");
    setYoutubeResults([]);
    setAddedSuccess(video.title);
    setTimeout(() => setAddedSuccess(null), 3000);

    // Guardar en backend
    try {
      await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: video.title,
          artist: video.artist,
          youtubeVideoId: video.videoId,
          thumbnailUrl: video.thumbnailUrl,
          addedBy: "Guest",
        }),
      });
      await refreshSongs();
    } catch (err) {
      console.error("Add song error:", err);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualArtist.trim()) return;

    let videoId = "";
    let thumbnail = "";

    // Si se proporcionó una URL de YouTube, extraer el video ID
    if (manualUrl.trim()) {
      videoId = extractYouTubeVideoId(manualUrl.trim()) || "";
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }

    const newSong: SongEntry = {
      id: `manual_${songs.length + 1}`,
      title: manualTitle.trim(),
      artist: manualArtist.trim(),
      youtube_video_id: videoId,
      thumbnail_url: thumbnail,
      votes: 0,
      addedBy: "Tú",
      isVoted: false,
    };

    setSongs((prev) => [newSong, ...prev]);
    setManualTitle("");
    setManualArtist("");
    setManualUrl("");
    setAddFormOpen(false);
    setAddedSuccess(newSong.title);
    setTimeout(() => setAddedSuccess(null), 3000);

    // Guardar en backend
    try {
      await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSong.title,
          artist: newSong.artist,
          youtubeVideoId: videoId || undefined,
          thumbnailUrl: thumbnail || undefined,
          addedBy: "Guest",
        }),
      });
      await refreshSongs();
    } catch (err) {
      console.error("Add song error:", err);
    }
  };

  const sortedSongs = [...songs].sort((a, b) => b.votes - a.votes);

  return (
    <section id="playlist" className="section-padding relative z-20">
      <div className="max-w-3xl mx-auto">
        <SectionTitle
          ornament="♫"
          title="Playlist Musical"
          subtitle="Busca videos en YouTube o agrega los tuyos para nuestra fiesta"
        />

        {/* Buscador YouTube - Unified Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          {/* Unified search container - stronger glass effect */}
          <GlassCard variant="strong" padding="none" className="overflow-hidden rounded-2xl">
            {/* Search input section */}
            <div className="p-4 border-b border-champagne/30">
              <div className="flex items-center gap-3">
                <Search className="text-burgundy/40 flex-shrink-0" size={22} />
                <input
                  type="text"
                  placeholder="Buscar en YouTube... (canción, artista, o pega una URL)"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="flex-1 bg-transparent focus:outline-none text-body text-burgundy placeholder:text-burgundy/40 text-base"
                />
                {isSearching && <Loader2 size={20} className="text-gold animate-spin" />}
                {searchTerm && !isSearching && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setYoutubeResults([]);
                      setSearchError(null);
                    }}
                    type="button"
                  >
                    <X size={20} className="text-burgundy/40 hover:text-burgundy/70" />
                  </button>
                )}
              </div>
            </div>

            {/* Results dropdown - now INSIDE the card, no absolute positioning needed */}
            <AnimatePresence>
              {(youtubeResults.length > 0 || searchError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="max-h-96 overflow-y-auto bg-white/5"
                >
                  {searchError ? (
                    <div className="p-4 text-center">
                      <p className="text-rose text-sm">{searchError}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-champagne/20">
                      {youtubeResults.map((video) => (
                        <button
                          key={video.videoId + video.title}
                          onClick={() => handleAddFromYouTube(video)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-white/10 transition-colors text-left"
                          type="button"
                        >
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-16 h-10 rounded-lg object-cover flex-shrink-0 border border-champagne/20"
                            />
                          ) : (
                            <div className="w-16 h-10 rounded-lg bg-burgundy/10 flex items-center justify-center flex-shrink-0 border border-champagne/20">
                              <Music size={16} className="text-gold" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-body text-burgundy font-medium text-sm truncate">
                              {video.title}
                            </p>
                            <p className="text-body text-burgundy/70 text-xs truncate">
                              {video.artist}
                            </p>
                          </div>
                          <Plus size={20} className="text-gold/80 flex-shrink-0 hover:text-gold transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* "Agregar manualmente" button - visually connected via spacing */}
          <div className="mt-3">
            <button
              onClick={() => setAddFormOpen(!addFormOpen)}
              className="btn-outline text-sm w-full md:w-auto"
              type="button"
            >
              {addFormOpen ? <X size={16} /> : <Plus size={16} />}
              {addFormOpen ? "Cancelar" : "Agregar manualmente"}
            </button>
          </div>
        </motion.div>

          <AnimatePresence>
            {addFormOpen && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleManualAdd}
              >
                <GlassCard padding="sm">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Título de la canción"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-champagne bg-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 text-body text-burgundy"
                      />
                      <input
                        type="text"
                        placeholder="Artista"
                        value={manualArtist}
                        onChange={(e) => setManualArtist(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-champagne bg-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 text-body text-burgundy"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="URL de YouTube (opcional)"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-champagne bg-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 text-body text-burgundy"
                    />
                    <button
                      type="submit"
                      className="btn-primary flex items-center justify-center gap-2 px-6 w-full sm:w-auto"
                    >
                      <Plus size={18} />
                      Agregar
                    </button>
                  </div>
                </GlassCard>
              </motion.form>
            )}
          </AnimatePresence>

        {/* Notificación de éxito */}
        <AnimatePresence>
          {addedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center mb-6"
            >
              <span className="glass-subtle inline-flex items-center gap-2 px-4 py-2 text-sage text-sm">
                <Check size={16} />
                ¡&ldquo;{addedSuccess}&rdquo; agregada!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de Canciones */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} variant="song" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSongs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.5) }}
              >
                <GlassCard
                  variant="subtle"
                  padding="sm"
                  className="flex items-center gap-4 hover:bg-white/25 transition-colors cursor-pointer"
                >
                  {/* Miniatura o icono */}
                  {song.thumbnail_url ? (
                    <img
                      src={song.thumbnail_url}
                      alt={song.title}
                      className="w-16 h-10 rounded-lg object-cover flex-shrink-0"
                      onClick={() => setSelectedSong(song)}
                    />
                  ) : (
                    <div
                      className="w-16 h-10 rounded-lg bg-burgundy/5 flex items-center justify-center flex-shrink-0"
                      onClick={() => setSelectedSong(song)}
                    >
                      <Music size={14} className="text-gold" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-burgundy font-medium truncate">
                      {song.title}
                    </p>
                    <p className="text-body text-burgundy/50 text-sm truncate">
                      {song.artist}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    {/* Botón de reproducir */}
                    {song.youtube_video_id && (
                      <button
                        onClick={() => setSelectedSong(song)}
                        className="p-2 rounded-full text-burgundy/30 hover:text-gold hover:bg-gold/10 transition-all"
                        aria-label="Reproducir"
                        type="button"
                      >
                        <Play size={18} />
                      </button>
                    )}

                    {/* Contador de votos */}
                    <div className="text-center px-1">
                      <span className="text-display text-xl text-burgundy block">
                        {song.votes}
                      </span>
                    </div>

                    {/* Botón de voto */}
                    <button
                      onClick={() => handleVote(song)}
                      className={`p-2 rounded-full transition-all ${
                        song.isVoted
                          ? "text-rose bg-rose/10"
                          : "text-burgundy/30 hover:text-rose hover:bg-rose/5"
                      }`}
                      aria-label={song.isVoted ? "Quitar voto" : "Votar"}
                      type="button"
                    >
                      <Heart
                        size={20}
                        fill={song.isVoted ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Estado vacío */}
        {!loading && sortedSongs.length === 0 && (
          <div className="text-center py-12">
            <Music size={48} className="text-burgundy/20 mx-auto mb-4" />
            <p className="text-body text-burgundy/40">
              Aún no hay canciones. ¡Sé el primero en agregar!
            </p>
          </div>
        )}
      </div>

        {/* Modal de reproducción YouTube */}
        <AnimatePresence>
        {selectedSong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedSong(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white/95 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="flex items-center justify-between p-4 border-b border-champagne/50">
                <div className="flex-1 min-w-0">
                  <h3 className="text-display text-lg text-burgundy font-medium truncate">
                    {selectedSong.title}
                  </h3>
                  <p className="text-body text-sm text-burgundy/50">
                    {selectedSong.artist}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSong(null)}
                  className="p-2 rounded-full hover:bg-burgundy/5 transition-colors ml-3"
                  type="button"
                >
                  <X size={20} className="text-burgundy/60" />
                </button>
              </div>

              {/* Embed de YouTube */}
              {selectedSong.youtube_video_id ? (
                <div className="relative pt-[56.25%]">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${selectedSong.youtube_video_id}?rel=0`}
                    title={selectedSong.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Music size={48} className="text-burgundy/20 mx-auto mb-3" />
                    <p className="text-body text-burgundy/40">
                      No hay video disponible para reproducir
                    </p>
                  </div>
                </div>
              )}

              {/* Link a YouTube */}
              {selectedSong.youtube_video_id && (
                <div className="p-4 border-t border-champagne/50 text-center">
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedSong.youtube_video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-burgundy/50 hover:text-gold transition-colors"
                  >
                    <Music size={16} />
                    Ver en YouTube
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
