"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Heart } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import FloatingPetals from "@/components/shared/FloatingPetals";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Por favor, ingresa el código de acceso.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Código incorrecto");
      }

      // Login exitoso, redireccionar a la página de inicio
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Código incorrecto. Por favor, verifica tu invitación."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-romantic flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Pétalos cayendo en el fondo */}
      <FloatingPetals />

      {/* Círculos decorativos en el fondo para efecto de vidrio */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-blush/25 filter blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-champagne/20 filter blur-3xl -z-10 animate-float" style={{ animationDelay: "2s" }} />

      <GlassCard
        variant="strong"
        padding="lg"
        className="max-w-md w-full text-center relative z-20 shadow-2xl border border-white/40"
      >
        {/* Adorno superior */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center text-burgundy animate-pulse">
              <Lock className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold flex items-center justify-center text-white text-[10px]">
              <Heart className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
        </div>

        {/* Nombres e Introducción */}
        <h1 className="text-script text-5xl text-gold mb-1">
          Alma & Chava
        </h1>
        <p className="text-display text-lg uppercase tracking-widest text-burgundy font-medium mb-2">
          Nuestra Boda
        </p>
        <div className="ornament-line justify-center mb-8">
          <span className="text-gold text-xs">❦</span>
        </div>

        <p className="text-body text-burgundy/70 text-sm leading-relaxed mb-8">
          Para acceder a los detalles de nuestra boda y confirmar tu asistencia, ingresa el código de acceso que se encuentra en tu invitación.
        </p>

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ingresa el código aquí"
              className="w-full px-5 py-4 rounded-full border border-champagne bg-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent text-body text-burgundy text-center placeholder-burgundy/40 text-lg transition-all tracking-widest"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-rose text-sm bg-rose/10 py-2.5 px-4 rounded-xl border border-rose/20 animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-4 text-base tracking-wider rounded-full flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Accediendo...
              </span>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        {/* Footer del card */}
        <div className="mt-8 text-[11px] text-burgundy/50 font-body uppercase tracking-wider">
          18 de Octubre, 2026
        </div>
      </GlassCard>
    </div>
  );
}
