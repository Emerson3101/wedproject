"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Search,
  Heart,
  Plus,
  Check,
  X,
  Loader2,
} from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import GlassCard from "@/components/ui/GlassCard";
import { debounce } from "@/lib/utils";

/* ============================================
   PLAYLIST MUSICAL — Conectado a Spotify API
   ============================================ */

interface SongEntry {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  votes: number;
  addedBy: string;
  isVoted: boolean;
}

interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover_url: string;
  preview_url?: string;
}

export default function PlaylistSection() {
  const [songs, setSongs] = useState<SongEntry[]>([
    { id: "1", title: "Perfect", artist: "Ed Sheeran", votes: 12, addedBy: "Ana", isVoted: false },
    { id: "2", title: "All of Me", artist: "John Legend", votes: 9, addedBy: "Carlos", isVoted: false },
    { id: "3", title: "Thinking Out Loud", artist: "Ed Sheeran", votes: 7, addedBy: "María", isVoted: false },
    { id: "4", title: "A Thousand Years", artist: "Christina Perri", votes: 15, addedBy: "Laura", isVoted: false },
    { id: "5", title: "At Last", artist: "Etta James", votes: 6, addedBy: "Pedro", isVoted: false },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState<string | null>(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");

  // Buscar en Spotify con debounce
  const searchSpotify = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSpotifyResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as { tracks?: SpotifyTrack[] };
        setSpotifyResults(data.tracks || []);
      } catch (err) {
        console.error("Spotify search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchSpotify(value);
  };

  const handleVote = async (id: number) => {
    setSongs((prev) =>
      prev.map((s) =>
        s.id === String(id)
          ? {
              ...s,
              votes: s.isVoted ? s.votes - 1 : s.votes + 1,
              isVoted: !s.isVoted,
            }
          : s
      )
    );

    // Enviar voto al backend
    try {
      await fetch("/api/songs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId: String(id),
          delta: 1,
        }),
      });
    } catch (err) {
      console.error("Vote error:", err);
    }
  };

  const handleAddFromSpotify = async (track: SpotifyTrack) => {
    const newSong: SongEntry = {
      id: Date.now().toString(),
      title: track.title,
      artist: track.artist,
      album: track.album,
      cover_url: track.cover_url,
      votes: 0,
      addedBy: "Tú",
      isVoted: false,
    };

    setSongs((prev) => [newSong, ...prev]);
    setSearchTerm("");
    setSpotifyResults([]);
    setAddedSuccess(track.title);
    setTimeout(() => setAddedSuccess(null), 3000);

    // Guardar en backend
    try {
      await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          album: track.album,
          spotifyId: track.id,
          coverUrl: track.cover_url,
          previewUrl: track.preview_url,
          addedBy: "Guest",
        }),
      });
    } catch (err) {
      console.error("Add song error:", err);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualArtist.trim()) return;

    const newSong: SongEntry = {
      id: Date.now().toString(),
      title: manualTitle,
      artist: manualArtist,
      votes: 0,
      addedBy: "Tú",
      isVoted: false,
    };

    setSongs((prev) => [newSong, ...prev]);
    setManualTitle("");
    setManualArtist("");
    setAddFormOpen(false);
    setAddedSuccess(manualTitle);
    setTimeout(() => setAddedSuccess(null), 3000);
  };

  const filteredSongs = songs.filter(
    (s) =>
      !searchTerm && // Solo filtrar local si no hay búsqueda Spotify activa
      (s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedSongs = [...filteredSongs].sort((a, b) => b.votes - a.votes);

  return (
    <section id="playlist" className="section-padding relative z-20">
      <div className="max-w-3xl mx-auto">
        <SectionTitle
          ornament="♫"
          title="Playlist Musical"
          subtitle="Busca canciones en Spotify o agrega las tuyas para nuestra fiesta"
        />

        {/* Buscador Spotify */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 relative"
        >
          <GlassCard padding="sm" className="flex items-center gap-3">
            <Search className="text-burgundy/30 flex-shrink-0" size={20} />
            <input
              type="text"
              placeholder="Buscar en Spotify... (canción, artista)"
              value={searchTerm}
              onChange={handleSearchChange}
              className="flex-1 bg-transparent focus:outline-none text-body text-burgundy placeholder:text-burgundy/30"
            />
            {isSearching && <Loader2 size={18} className="text-gold animate-spin" />}
            {searchTerm && !isSearching && (
              <button onClick={() => { setSearchTerm(""); setSpotifyResults([]); }}>
                <X size={18} className="text-burgundy/30 hover:text-burgundy/60" />
              </button>
            )}
          </GlassCard>

          {/* Resultados de Spotify */}
          <AnimatePresence>
            {spotifyResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 z-30"
              >
                <GlassCard variant="strong" padding="sm" className="max-h-80 overflow-y-auto">
                  {spotifyResults.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleAddFromSpotify(track)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 transition-colors text-left"
                    >
                      {track.cover_url ? (
                        <img
                          src={track.cover_url}
                          alt={track.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-burgundy/5 flex items-center justify-center flex-shrink-0">
                          <Music size={18} className="text-gold" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-body text-burgundy font-medium text-sm truncate">
                          {track.title}
                        </p>
                        <p className="text-body text-burgundy/50 text-xs truncate">
                          {track.artist}
                        </p>
                      </div>
                      <Plus size={18} className="text-gold flex-shrink-0" />
                    </button>
                  ))}
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Agregar manualmente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <button
            onClick={() => setAddFormOpen(!addFormOpen)}
            className="btn-outline text-sm mb-4"
          >
            {addFormOpen ? <X size={16} /> : <Plus size={16} />}
            {addFormOpen ? "Cancelar" : "Agregar manualmente"}
          </button>

          <AnimatePresence>
            {addFormOpen && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleManualAdd}
              >
                <GlassCard padding="sm">
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
                    <button
                      type="submit"
                      className="btn-primary flex items-center justify-center gap-2 px-6"
                    >
                      <Plus size={18} />
                      Agregar
                    </button>
                  </div>
                </GlassCard>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

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
                ¡"{addedSuccess}" agregada!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de Canciones */}
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
                className="flex items-center gap-4 hover:bg-white/25 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-burgundy/5 flex items-center justify-center flex-shrink-0">
                  <Music size={18} className="text-gold" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-body text-burgundy font-medium truncate">
                    {song.title}
                  </p>
                  <p className="text-body text-burgundy/50 text-sm truncate">
                    {song.artist}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span className="text-display text-xl text-burgundy block">
                      {song.votes}
                    </span>
                  </div>
                  <button
                    onClick={() => handleVote(Number(song.id))}
                    className={`p-2 rounded-full transition-all ${
                      song.isVoted
                        ? "text-rose bg-rose/10"
                        : "text-burgundy/30 hover:text-rose hover:bg-rose/5"
                    }`}
                    aria-label={song.isVoted ? "Quitar voto" : "Votar"}
                  >
                    <Heart size={20} fill={song.isVoted ? "currentColor" : "none"} />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {sortedSongs.length === 0 && searchTerm && (
          <p className="text-center text-body text-burgundy/40 mt-8">
            No se encontraron canciones con "{searchTerm}"
          </p>
        )}
      </div>
    </section>
  );
}
