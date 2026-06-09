import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

/* ============================================
   API: GET /api/songs
   Obtener lista de canciones.
   Opcional: pasar ?voterId=xxx para saber qu%C3%A9 canciones ya le dio like.
   ============================================ */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const voterId = searchParams.get("voterId");

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

    // If voterId provided, check which songs this voter has liked
    let likedSongIds: string[] = [];
    if (voterId && songs) {
      const { data: likes } = await supabase
        .from("song_likes")
        .select("song_id")
        .eq("voter_id", voterId)
        .in("song_id", songs.map((s: Record<string, unknown>) => s.id));

      if (likes) {
        likedSongIds = likes.map((l) => String(l.song_id));
      }
    }

    const enriched = (songs || []).map((s: Record<string, unknown>) => ({
      ...s,
      isLikedByVoter: likedSongIds.includes(String(s.id)),
    }));

    return NextResponse.json({ songs: enriched });
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
   Like / unlike una canción (una vez por canción por navegador).
   ============================================ */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { songId, voterId, isLike } = body as {
      songId: string;
      voterId: string;
      isLike: boolean;
    };

    if (!songId || !voterId) {
      return NextResponse.json(
        { error: "El ID de la canción y el voter_id son requeridos." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    if (supabase) {
      let result: string;

      if (isLike) {
        const { data, error } = await supabase.rpc("like_song", {
          p_voter_id: voterId,
          p_song_id: songId,
        });

        if (error) {
          console.error("Like error:", error);
          return NextResponse.json(
            { error: "Error al dar like." },
            { status: 500 }
          );
        }
        result = data || "";
      } else {
        const { data, error } = await supabase.rpc("unlike_song", {
          p_voter_id: voterId,
          p_song_id: songId,
        });

        if (error) {
          console.error("Unlike error:", error);
          return NextResponse.json(
            { error: "Error al quitar like." },
            { status: 500 }
          );
        }
        result = data || "";
      }

      // Map RPC results to a consistent response
      if (isLike) {
        if (result === "liked") return NextResponse.json({ liked: true });
        if (result === "already_liked")
          return NextResponse.json({ liked: true, alreadyLiked: true });
      } else {
        if (result === "unliked") return NextResponse.json({ liked: false });
        if (result === "not_liked")
          return NextResponse.json({ liked: false, notLiked: true });
      }

      return NextResponse.json({ success: false });
    }

    return NextResponse.json(
      { error: "Backend no disponible." },
      { status: 503 }
    );
  } catch (error) {
    console.error("Like API error:", error);
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
