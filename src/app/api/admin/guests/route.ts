import { NextResponse } from "next/server";
import { createSupabaseServerClient, type Guest, type Companion } from "@/lib/supabase";
import { isSupabaseServerConfigured } from "@/lib/config";

interface GuestWithCompanions {
  guest: Guest;
  companions: Companion[];
}

/* GET — fetch all guests with their companions */
export async function GET() {
  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server not configured. Check .env.local" },
      { status: 503 }
    );
  }

  const supabase = createSupabaseServerClient()!;

  // Fetch all guests ordered by creation date (newest first)
  const { data: guests, error: guestsError } = await supabase
    .from("guests")
    .select("*")
    .order("created_at", { ascending: false });

  if (guestsError) {
    console.error("Admin API — error fetching guests:", guestsError);
    return NextResponse.json(
      { ok: false, error: guestsError.message },
      { status: 500 }
    );
  }

  if (!guests || guests.length === 0) {
    return NextResponse.json({
      ok: true,
      guests: [],
      stats: {
        total: 0,
        confirmed: 0,
        declined: 0,
        pending: 0,
        totalCompanions: 0,
      },
    });
  }

  // Fetch all companions for all guest IDs
  const guestIds = guests.map((g) => g.id);
  const { data: companions, error: companionsError } = await supabase
    .from("companions")
    .select("*")
    .in("guest_id", guestIds);

  if (companionsError) {
    console.error("Admin API — error fetching companions:", companionsError);
    // Still return guests even if companions fail
  }

  // Group companions by guest_id
  const companionsByGuest = new Map<string, Companion[]>();
  if (companions) {
    for (const companion of companions) {
      const list = companionsByGuest.get(companion.guest_id) || [];
      list.push(companion);
      companionsByGuest.set(companion.guest_id, list);
    }
  }

  // Build the combined result
  const result: GuestWithCompanions[] = guests.map((guest) => ({
    guest,
    companions: companionsByGuest.get(guest.id) || [],
  }));

  // Compute stats
  const stats = {
    total: guests.length,
    confirmed: guests.filter((g) => g.status === "confirmed").length,
    declined: guests.filter((g) => g.status === "declined").length,
    pending: guests.filter((g) => g.status === "pending").length,
    totalCompanions: companions?.length || 0,
  };

  return NextResponse.json({ ok: true, guests: result, stats });
}
