import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

/* ============================================
   API: GET /api/songs
   Obtener lista de canciones.
   ============================================ */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json({ songs: [] });
    }

    const { data: songs, error } = await supabase
      .from("songs")
      .select("*")
      .order("votes", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Songs GET error:", error);
      return NextResponse.json({ songs: [] });
    }

    return NextResponse.json({ songs: songs || [] });
  } catch (error) {
    console.error("Songs API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/* ============================================
   API: POST /api/songs
   Agregar una canción a la playlist.
   ============================================ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, artist, youtubeVideoId, thumbnailUrl, addedBy } =
      body as {
        title: string;
        artist: string;
        youtubeVideoId?: string;
        thumbnailUrl?: string;
        addedBy?: string;
      };

    if (!title || !artist) {
      return NextResponse.json(
        { error: "El título y artista son requeridos." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("songs")
        .insert({
          title,
          artist,
          youtube_video_id: youtubeVideoId || null,
          thumbnail_url: thumbnailUrl || null,
          added_by: addedBy || "Guest",
          is_approved: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Songs POST error:", error);
        return NextResponse.json(
          { error: "Error al agregar la canción." },
          { status: 500 }
        );
      }

      return NextResponse.json({ song: data });
    }

    return NextResponse.json(
      { error: "Backend no disponible." },
      { status: 503 }
    );
  } catch (error) {
    console.error("Songs POST error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/* ============================================
   API: PATCH /api/songs
   Votar por una canción.
   ============================================ */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { songId, delta } = body as { songId: string; delta: number };

    if (!songId) {
      return NextResponse.json(
        { error: "El ID de la canción es requerido." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    if (supabase) {
      const { error } = await supabase.rpc("vote_song", {
        p_song_id: songId,
        p_delta: delta || 1,
      });

      if (error) {
        console.error("Vote error:", error);
        return NextResponse.json(
          { error: "Error al votar." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Backend no disponible." },
      { status: 503 }
    );
  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/* ============================================
   API: DELETE /api/songs
   Eliminar una canción (usado por el admin).
   ============================================ */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get("songId");

    if (!songId) {
      return NextResponse.json(
        { error: "El ID de la canción es requerido." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    if (supabase) {
      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", songId);

      if (error) {
        console.error("Songs DELETE error:", error);
        return NextResponse.json(
          { error: "Error al eliminar la canción." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Backend no disponible." },
      { status: 503 }
    );
  } catch (error) {
    console.error("Songs DELETE error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
