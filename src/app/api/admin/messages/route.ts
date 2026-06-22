import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch guests with messages (non-empty messages only)
    const { data: guests, error } = await supabase
      .from("guests")
      .select("id, name, email, status, message, created_at")
      .not("message", "is", null)
      .neq("message", "")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: "Error obteniendo mensajes" },
        { status: 500 }
      );
    }

    const messages = (guests || []).map((guest) => ({
      id: guest.id,
      guestName: guest.name,
      guestEmail: guest.email,
      message: guest.message,
      status: guest.status,
      createdAt: guest.created_at,
    }));

    return NextResponse.json({ ok: true, messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}