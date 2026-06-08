import { NextRequest, NextResponse } from "next/server";
import { youtubeConfig, isYouTubeConfigured } from "@/lib/config";

/* ============================================
   API: GET /api/youtube/search?q=...
   Buscar videos en YouTube (server-side).
   Usa la YouTube Data API v3 (solo API key).
   ============================================ */

export async function GET(request: NextRequest) {
  if (!isYouTubeConfigured) {
    return NextResponse.json(
      { error: "YouTube no configurado." },
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

    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodedQuery}&videoEmbeddable=true&key=${youtubeConfig.apiKey}`
    );

    const data = (await response.json()) as {
      items: Array<{
        id: { kind: string; videoId: string };
        snippet: {
          title: string;
          channelTitle: string;
          thumbnails: {
            default: { url: string };
            medium: { url: string };
            high: { url: string };
          };
        };
      }>;
    };

    const videos = (data.items || []).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || "",
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("YouTube search error:", error);
    return NextResponse.json(
      { error: "Error buscando en YouTube." },
      { status: 500 }
    );
  }
}
