"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GlobalError:", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          background:
            "linear-gradient(180deg, #F6F5F8 0%, #EAE8EE 40%, #F6F5F8 100%)",
          fontFamily:
            "'Jost', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#722F37",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'Great Vibes', 'Georgia', cursive",
            fontSize: 36,
            margin: 0,
            color: "#8A8F98",
          }}
        >
          ❦
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 32,
            fontWeight: 300,
            margin: 0,
          }}
        >
          Algo salió mal
        </h1>
        <p style={{ fontSize: 14, opacity: 0.7, margin: 0, maxWidth: 400 }}>
          Ocurrió un error inesperado. Por favor, intenta de nuevo.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 8,
            padding: "12px 28px",
            borderRadius: 999,
            border: "2px solid #722F37",
            background: "#722F37",
            color: "#F6F5F8",
            fontFamily: "inherit",
            fontSize: 13,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Intentar de nuevo
        </button>
      </body>
    </html>
  );
}
