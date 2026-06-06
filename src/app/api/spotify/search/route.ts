import { NextRequest, NextResponse } from "next/server";
import { spotifyConfig, isSpotifyConfigured } from "@/lib/config";

/* ============================================
   API: GET /api/spotify/search?q=...
   Buscar canciones en Spotify (server-side).
   Usa Client Credentials Flow.
   ============================================ */

let spotifyAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getSpotifyAccessToken(): Promise<string | null> {
  // Reutilizar token si aún es válido (con margen de 5 min)
  if (spotifyAccessToken && Date.now() < tokenExpiresAt - 300000) {
    return spotifyAccessToken;
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`
          ).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    if (data.access_token) {
      spotifyAccessToken = data.access_token;
      tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      return spotifyAccessToken;
    }
  } catch (error) {
    console.error("Spotify token error:", error);
  }
  return null;
}

export async function GET(request: NextRequest) {
  if (!isSpotifyConfigured) {
    return NextResponse.json(
      { error: "Spotify no configurado." },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "El parámetro 'q' es requerido." },
        { status: 400 }
      );
    }

    const token = await getSpotifyAccessToken();
    if (!token) {
      return NextResponse.json(
        { error: "No se pudo obtener el token de Spotify." },
        { status: 500 }
      );
    }

    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=10`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = (await response.json()) as {
      tracks: {
        items: Array<{
          id: string;
          name: string;
          artists: Array<{ name: string }>;
          album: { name: string; images: Array<{ url: string }> };
          preview_url: string | null;
        }>;
      };
    };

    const tracks = (data.tracks?.items || []).map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0]?.name || "Desconocido",
      album: track.album?.name || "",
      cover_url: track.album?.images?.[1]?.url || "",
      preview_url: track.preview_url,
    }));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Spotify search error:", error);
    return NextResponse.json(
      { error: "Error buscando en Spotify." },
      { status: 500 }
    );
  }
}
